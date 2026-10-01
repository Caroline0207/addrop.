# addrop. landing page

Static build of `project/Addrop Landing v2.dc.html` (Claude Design handoff). No build step. Serve the folder as-is:

```sh
python3 -m http.server -d site 8000
```

- `index.html`: markup for every section (nav, hero, marquee, problem, features, app preview, reviews, CTA and footer)
- `styles.css`: all styling, using the prototype's values
- `main.js`: the waitlist forms and the app-preview carousel arrows

## Before launch

- **Waitlist:** sign-ups aren't stored anywhere yet. Set `WAITLIST_ENDPOINT` in `main.js` to a URL that accepts `POST {"email": "..."}` as JSON. If it's left empty, the form only shows the confirmation message.
- **Reviews and rating:** the six reviews and the 4.9 "Beta tester rating" are placeholder copy from the design. Replace them with real quotes or remove them.
- **Footer links:** Terms, Privacy, Contact and Instagram all point to `#`.
