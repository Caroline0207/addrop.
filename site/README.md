# addrop. landing page

Static build of `project/Addrop Landing v2.dc.html` (Claude Design handoff). No build step. Serve the folder as-is:

```sh
python3 -m http.server -d site 8000
```

(The waitlist API doesn't run under this plain server. Use `npx wrangler dev` to test it.)

- `index.html`: markup for every section (nav, hero, marquee, problem, features, app preview, reviews, CTA and footer)
- `styles.css`: all styling, using the prototype's values
- `main.js`: the waitlist forms and the app-preview carousel arrows

## Waitlist

The site deploys as a Cloudflare Worker (`wrangler.jsonc` at the repo root). Files in `site/` are served as static assets, except `README.md` and `.assetsignore`, which `.assetsignore` keeps private. Requests to `/api/waitlist` run `worker/index.js`. It saves each email to the D1 database `addrop-waitlist`, bound as `DB`. The table is created automatically, and duplicate emails are ignored.

**Database:** declared in `wrangler.jsonc` without a `database_id`. On the first deploy, Wrangler creates the database automatically and reuses it afterwards. If the Workers Build log says provisioning was skipped for lack of permission, create the database yourself (Storage & Databases → D1 → Create, name `addrop-waitlist`) and add its ID to `wrangler.jsonc` as `"database_id"`.

**CSV export (optional):** Worker → Settings → Variables and Secrets → Add, type Secret, name `ADMIN_TOKEN`, a long random value. Then open `https://<your-site>/api/waitlist?token=<ADMIN_TOKEN>`.

**Viewing sign-ups:** D1 → `addrop-waitlist` → Console → `SELECT * FROM waitlist ORDER BY created_at;`

**Local testing** (needs Node; uses a local database):

```sh
npx wrangler dev
```

## Before launch

- **Reviews and rating:** the six reviews and the 4.9 "Beta tester rating" are placeholder copy from the design. Replace them with real quotes or remove them.
- **Footer links:** Terms, Privacy, Contact and Instagram all point to `#`.
