# Recipe: web

A static web app on Cloudflare Workers static assets, private behind Access and `noindex`.

## When

DECISION-TREE.md branch 1: it can run in a browser. The default for anything with a UI, including the dashboards of jobs and research projects.

## Adds

- App: `index.html`, `status.html`, `src/main.ts`, `src/dom.ts`, `src/status.ts`, `src/styles.css`, `assets/icon.svg`, `public/icons/`, `public/og.png`.
- Build: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `build/site.ts`, `wrangler.jsonc`.
- Scripts: `scripts/deploy.ts`, `report.ts`, `privacy-check.ts`, `icons.ts`, and `scripts/session-start.d/npm.sh` (installs dependencies).
- Tests: `playwright.config.ts`, `tests/unit/site.test.ts`, `privacy.test.ts`, `deploy.test.ts`, `tests/e2e/web.spec.ts`.
- Gates: `.githooks/pre-commit`, `.github/workflows/ci.yml`.
- Rules: `.claude/rules/web.md`.
- Merges: `workersSubdomain`, `url`, `themeColor`, `analyticsToken` and `privacyAllow` into `project.json`; build output into `.gitignore`.

## Extension points

Other recipes plug in by adding files. Nothing in web needs editing:

- `src/features/<name>.ts` runs on page load. One may export `mount(root)` to own `#app`.
- `build/plugins/<name>.ts` default-exports `(project) => Plugin`.
- `tests/unit/*.test.ts` and `tests/e2e/*.spec.ts` join the suite. Tag read-only e2e tests `@smoke`; deploy runs those on the live site.

## After copying

- `package.json` and `wrangler.jsonc`: `name` equal to `project.json` `name`. Deploy refuses a mismatch. Then `npm install` to update the lockfile.
- `project.json`: `workersSubdomain` from `curl -s https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain | jq -r .result.subdomain`.
- The project's own UI goes in `src/features/app.ts` with `mount(root)`, or replaces the example of the recipe that brought one.
- `status.html`: "What was built" and "How to use it".
- `assets/icon.svg`, then `npm run icons`.

## Tests

- Hook and CI: `npm test`. Typecheck, unit tests, build, e2e on `dist/` under `wrangler dev` (production headers included), privacy check.
- Deploy: `npm run deploy`. Tests, status page data, privacy check, deploy, `@smoke` tests on the live URL.
