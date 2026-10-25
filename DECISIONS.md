# Decisions

Choices, assumptions and test results for hatchery itself. Newest first. Project decisions live in each project's DECISIONS.md.

## 2026-10-25: Build of version 1.0.0

### Settled questions from the brief

**Does the proxy's network secret replace the placeholder `Authorization` header that wrangler and neonctl send?**
Not settled yet. This build session ran outside `hatchery-build`, with no Cloudflare or Neon access. `scripts/check-env.sh` runs `wrangler whoami` and `neonctl me` and reports the answer; SETUP.md step 9 runs it. Plain `curl` without an auth header works either way, and hatchery's own scripts use that. If the CLIs fail, the fallback is in SETUP.md, "Fallback for CLI tokens".

**Can a session set a project repo's Actions secrets through the GitHub proxy?**
No. Tested: every `actions/secrets` and `actions/variables` path returns 403 "Access to this GitHub Actions path is not permitted through this proxy", reads included. Built instead: the `project-secret` workflow. The session seals the value with the target repo's public key (`scripts/seal-secret.py`), so the plaintext never leaves the session. Tested so far: the guard that refuses hatchery itself, and the seal round trip. The current `HATCHERY_PAT` lacks the Secrets permission ("Resource not accessible by personal access token"), so SETUP.md step 6 adds it.

**Do Workers custom domains need zone DNS edit?**
Probably not. The API schema lists only account "Workers Scripts Write" for the custom domain endpoints. Wrangler deploys custom domains through account-level endpoints and lets Cloudflare create the DNS record. Cloudflare's own "Edit Cloudflare Workers" token template has zone "Workers Routes" and no DNS permission. So the token gets zone Workers Routes Edit on example.com and no DNS edit. Smoke test 5 confirms; add DNS Edit on that zone only if it fails.

**Does Neon offer keys narrower than the personal API key?**
Yes: organization keys and project-scoped keys. A project-scoped key has Editor access to one project and cannot create projects. Hatchery creates one Neon project per hatchery project, so sessions need a personal or organization key. Jobs never get an API key: they get a connection string for their own database role.

**Do R2 or Cloudflare Zero Trust require a payment method?**
Both do. Zero Trust: "Complete your onboarding by selecting a subscription plan and entering your payment details. If you chose the Zero Trust Free plan, this step is still needed but you will not be charged." R2: "Complete the checkout flow to add an R2 subscription to your account." Access needs Zero Trust, and the brief puts every private project behind Access. This is your call; SETUP.md step 4 lays it out. R2 waits until a project needs it.

**Free AI options.**
Workers AI: 10,000 Neurons a day on the free plan; more needs Workers Paid. Gemini API free tier: limits are per model and Google has cut them more than once, so check AI Studio at decision time. Free-tier content may be used to improve Google products and read by human reviewers, except in the EEA, Switzerland and the UK. Summarized in DECISION-TREE.md.

### GitHub access, tested

Earlier tests (2026-10-24 and 25, branches `test/results-*`):
- A token in the session cannot create repos: `POST /user/repos` returns 403, and the git proxy refuses pushes to repos not attached to the session, whatever credential is in the URL.
- `workflow_dispatch` over REST works. The workflow creates the repo with `HATCHERY_PAT`.
- `add_repo` with push access attaches a new repo mid-session. Clone, commit and push then work.
- The push relay failed to export code: the checkout credential shadowed the token. It is gone; `add_repo` replaced it.

This build:
- `return_run_details=true` makes the dispatch return the run id. Errors and results come back as check-run annotations, readable over REST. Job logs are not: they redirect to a blocked host.
- Only workflows on the default branch can be dispatched (404 otherwise). A dispatch with `ref` runs the file from that branch.
- The proxy blocks repo settings writes (403), so marking a template repo moved into `create-project` (`is_template`).
- Generating from the template works. The initial commit is authored with my no-reply email.
- Opening and closing PRs over REST works. Creating releases is blocked for sessions, so native builds publish releases from the project's own Actions.
- Branch deletion is blocked over git and REST. The old test branches need deleting by hand (SETUP.md step 10).

### Template and conventions

- **Workers static assets, not Pages.** Static files are free and unlimited, `_headers` works, and Workers is where Cloudflare puts new features such as Previews and Access per Worker.
- **Previews, not Version URLs, for branches.** `wrangler preview` gives each branch its own settings and bindings. Version URLs run with production resources, which would put my data at risk.
- **One account-level Access app for all Workers.** New projects are private from their first deploy with no per-project step. Public projects get a per-Worker bypass. Sessions verify private deploys with a service token the proxy attaches. The manifest link uses `crossorigin="use-credentials"` so installs work behind Access. Sessions last 720 hours to keep sign-ins rare on the phone.
- **project.json is the single source** for names, URLs and privacy. One flag switches robots meta, robots.txt, `X-Robots-Tag` and analytics together.
- **Status page fed by the test run.** The deploy writes test counts, test names and screenshots into the build, so the page shows how that exact build was verified.
- **E2E under `wrangler dev`.** It serves `dist/` like production, `_headers` and CSP included, and uses local D1 when a project has one.
- **Privacy check is an allowlist** of file types plus patterns for secrets, private addresses, internal hosts, emails and local paths. It caught real leaks during the build: sample secrets in test titles.
- **Hand-written service worker, network first.** Online visits always get the latest deploy, so iterating never serves stale code. No dependency.
- **Scripts in TypeScript run directly by Node 22.22.** No build step for tooling.
- **CI runs on PRs and main only,** on `ubuntu-24.04`, to save the shared 2,000 minutes and keep Playwright's system packages stable.
- **Bootstrap exception:** the first commit that only renames the template goes straight to `main` and deploys, so the pipeline works in the first hour.
- **One manual Web Analytics site for example.com.** Creating sites over the API needs Account Settings Edit, which the token must not have. One snippet token covers every subdomain.
- **Access service token scope:** the network secret goes to `*.<subdomain>.workers.dev` and `*.example.com`, never `*.workers.dev`, which would hand the token to every Workers site on the internet.
- **`WRANGLER_SEND_ERROR_REPORTS=false`** added to the environment variables, so wrangler never stops to ask.

### Minimum test floor per project type

Every project keeps the web floor in the template's DECISIONS.md. Add the rows that apply.

| Project type | Floor |
| --- | --- |
| Web app (every project) | Unit tests for all logic. A fixture per saved-data version. E2E on phone and desktop: loads without console errors, data survives reload, export and import round-trip. Read-only `@smoke` against every deploy. Privacy check. |
| Worker API | Unit tests for handlers. E2E calls each route through `wrangler dev`. Auth and input validation tests for every write route. |
| D1 or Neon | Migrations apply to an empty local database and to a fixture copy of every past schema. No destructive migration without a test that proves the data survives. |
| Scheduled job | Job logic tested on fixture inputs. A dry-run mode that the tests use. The dashboard shows the last run and its result. |
| Crawler | Parsers tested on saved HTML fixtures. Rate limits and robots.txt respected in code, with a test. |
| Research or data | The pipeline runs on a fixed sample in tests and the computed results match a checked-in snapshot. The dashboard renders those results. |
| Native wrapper | The web floor, plus a CI build of each target that must succeed. |
