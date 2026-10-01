# addrop. landing page

Static build of `project/Addrop Landing v2.dc.html` (Claude Design handoff). No build step. Serve the folder as-is:

```sh
python3 -m http.server -d site 8000
```

(The waitlist API doesn't run under this plain server. Use `wrangler pages dev` below to test it.)

- `index.html`: markup for every section (nav, hero, marquee, problem, features, app preview, reviews, CTA and footer)
- `styles.css`: all styling, using the prototype's values
- `main.js`: the waitlist forms and the app-preview carousel arrows

## Waitlist

Both forms POST to `/api/waitlist`, a Cloudflare Pages Function (`functions/api/waitlist.js` at the repo root). It saves each email to a Cloudflare D1 database. The table is created automatically, and duplicate emails are ignored.

One-time setup in the Cloudflare dashboard:
1. **Storage & Databases → D1 → Create database**, e.g. `addrop-waitlist`.
2. Pages project → **Settings → Bindings → Add → D1 database**. Variable name `DB`, pick the database. Do this for Production (and Preview if you want).
3. Optional, for CSV export: **Settings → Variables and Secrets → Add**, type Secret, name `ADMIN_TOKEN`, a long random value.
4. Redeploy (Deployments → ⋯ → Retry deployment), since bindings only apply to new deployments.

To view sign-ups, open the D1 database → Console → `SELECT * FROM waitlist ORDER BY created_at;`. If `ADMIN_TOKEN` is set, you can also open `https://<your-site>/api/waitlist?token=<ADMIN_TOKEN>` to download a CSV.

Local testing (needs Node):

```sh
npx wrangler pages dev site --d1 DB=local-waitlist
```

## Before launch

- **Reviews and rating:** the six reviews and the 4.9 "Beta tester rating" are placeholder copy from the design. Replace them with real quotes or remove them.
- **Footer links:** Terms, Privacy, Contact and Instagram all point to `#`.
