// /api/waitlist handlers.
//
// POST {"email": "..."}  → saves the email to the D1 database bound as `DB`.
// GET  ?token=...         → downloads every sign-up as CSV (only when the
//                           ADMIN_TOKEN secret is set and matches).
//
// The D1 binding is declared in wrangler.jsonc. The table is created
// automatically on first use.

const MAX_EMAIL_LENGTH = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SCHEMA = `CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT,
  country TEXT,
  user_agent TEXT
)`;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Waitlist storage is not configured.' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  // Honeypot: real visitors never fill the hidden "company" field.
  if (body.company) return json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  const source = String(body.source || '').slice(0, 32) || null;
  const country = request.cf?.country || null;
  const userAgent = (request.headers.get('user-agent') || '').slice(0, 300) || null;

  await env.DB.prepare(SCHEMA).run();
  // Signing up twice is fine: the first sign-up is kept and the visitor still sees success.
  await env.DB
    .prepare('INSERT OR IGNORE INTO waitlist (email, source, country, user_agent) VALUES (?, ?, ?, ?)')
    .bind(email, source, country, userAgent)
    .run();

  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.ADMIN_TOKEN || !token || !(await safeEqual(token, env.ADMIN_TOKEN))) {
    return new Response('Not found', { status: 404 });
  }
  if (!env.DB) return new Response('Waitlist storage is not configured.', { status: 500 });

  await env.DB.prepare(SCHEMA).run();
  const { results } = await env.DB
    .prepare('SELECT email, created_at, source, country FROM waitlist ORDER BY created_at')
    .all();

  const rows = [['email', 'created_at', 'source', 'country'], ...results.map((r) => [r.email, r.created_at, r.source, r.country])];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="addrop-waitlist.csv"',
      'Cache-Control': 'no-store',
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function csvCell(value) {
  const s = value == null ? '' : String(value);
  // Quote everything; prefix formula-looking values so spreadsheets don't execute them.
  const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
  return '"' + safe.replace(/"/g, '""') + '"';
}

// Constant-time comparison so the admin token can't be guessed by timing.
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
