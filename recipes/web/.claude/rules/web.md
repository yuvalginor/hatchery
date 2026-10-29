# Web recipe

## Commands

- `npm run dev`: local dev server.
- `npm test`: typecheck, unit tests, build, e2e on `dist/` under `wrangler dev`, privacy check. The pre-commit hook and CI run it.
- `npm run deploy`: tests, status page data, privacy check, deploy, then read-only `@smoke` tests on the live URL. `main` goes to production. Any other branch gets its own Preview.
- `npm run icons`: regenerates the icons and `public/og.png` from `assets/icon.svg` and `project.json`.

## Layout

- `project.json`: name, title, description, URLs, public or private. `build/site.ts` applies it to every HTML page, robots.txt and `_headers`.
- `src/main.ts` runs every `src/features/*.ts`. The one that exports `mount(root)` owns `#app`.
- `build/plugins/*.ts`: Vite plugins added by other recipes.
- `status.html`, `src/status.ts`: the status page. `scripts/report.ts` fills it from test results at deploy.
- `scripts/`: deploy, report, privacy check, icons.

## Rules

- Deploy every branch and send me the Preview URL. After a merge, deploy `main`.
- Build DOM with `el()` or `textContent`. Never `innerHTML` with dynamic text.
- No secrets in `src/` or `public/`. Server secrets: `wrangler secret put`.
- With a backend: D1 changes go through `wrangler d1 migrations`, additive only. Previews bind to a preview database, never production. `@smoke` tests stay read-only.
- Before you finish: update "What was built" and "How to use it" in `status.html`.
