// Worker entry: handles /api/waitlist and serves everything else from the
// static site in ../site (the ASSETS binding in wrangler.jsonc).
import { onRequestGet, onRequestPost } from './waitlist.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/waitlist') {
      if (request.method === 'POST') return onRequestPost({ request, env });
      if (request.method === 'GET') return onRequestGet({ request, env });
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
    }
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    return env.ASSETS.fetch(request);
  },
};
