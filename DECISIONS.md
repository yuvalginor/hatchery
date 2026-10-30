# Decisions

Choices, assumptions and test results for hatchery itself. Newest first. Project decisions live in each project's DECISIONS.md.

## 2026-10-31: Version 3.0.0, no status page

- **Why it existed:** proof of how a build was verified, readable on a phone, when sessions deployed directly.
- **Why it went:** it shipped test results to everyone using the app. Since 2.0.0 the results come from before the build, so they prove less. They added hundreds of lines and images to each PR, could conflict between branches, and needed a hook exception.
- **What replaces it:** test counts in the PR and the session report, the checks on the PR, the session's phone check, and smoke tests on the live URL.
- **What stays:** `build.json`. `npm run deploy` needs it to know a commit is live. It moved to the site root.
- Earlier entries here and in CHANGELOG.md still mention the status page. They are history, so they stay.

## 2026-10-31: Version 2.3.1, one approval

From rebuilding `habitrabbit`. Version 2.2.0 made the session wait for an OK on the plan after kickoff. The owner had already approved those answers, so the wait added nothing. Kickoff is now the approval.

## 2026-10-31: Version 2.3.0, `habitrabbit` rebuilt

From building `habitrabbit` again on 2.2.1, after the first one was deleted.

- **The design rule was enough.** The owner asked for "cleaner, flatter, not rabbit themed" at kickoff. The result shares no layout with the `web-storage` example. Trimming the example stays open, but is not urgent.
- **The first push to `main` built on its own this time.** Same steps as the 2.1.1 case: `connect-builds.sh`, then the first push to a new, empty repo. So that failure is intermittent. `start-build.sh` stays as the fallback.
- **An empty app makes a poor screenshot.** Rung 0 apps start empty in every test, so the status page showed only an empty state. A test that imports sample data and takes the screenshot fixed it. Now in the `web-storage` RECIPE.md.
- **Apps that show dates need a fixed clock in e2e tests.** `page.clock.setFixedTime` with `locale` and `timezoneId` in `test.use` made day labels and streaks the same on every run. Not a rule yet: one project.
- **Ad hoc Playwright scripts inside a project** resolve the project's Playwright, which looks for its own browser build. Pass `executablePath: '/opt/pw-browsers/chromium'`, as `playwright.config.ts` does.

## 2026-10-31: Version 2.2.1, first real delete

From deleting `habitrabbit`.

- **Worked:** `delete-project.sh` removed the Worker and two triggers, and the audit log confirms it.
- **Previews can hold triggers.** Three `smoke-web` triggers sat under Preview ids, not the Worker's id. Each appeared with its Preview. `habitrabbit`'s one Preview had none, and why they differ is unknown. The script now checks each Preview. That path is not tested.
- **An empty trigger list proves little.** The API returns success and an empty list for any id, even a made-up one. Listing Previews first gives real ids.
- **Silent failures fixed.** A failed lookup used to print "none" and carry on.

## 2026-10-30: Version 2.2.0, a design of its own

From project `habitrabbit`, which came out close to the `smoke-web` demo.

- **Cause:** nothing in the playbook asked for design. The shared styles and the `web-storage` list example were the only guide, and the prompt said to take every default.
- **Taking every default no longer hides the thinking.** The session posts its proposals and the plan, and carries on. The prompt in README and SETUP.md was hatchery's own, and it taught people to skip kickoff, so it is gone.
- **Open:** the `web-storage` example still invites copying. Trim it if the rule is not enough.

## 2026-10-30: Version 2.1.1, a build by hand

From project `habitrabbit`.

- **Seen:** the first push to `main` of a new, empty repo started no Workers Build. `connect-builds.sh` had run before the push and succeeded. GitHub showed no "Workers Builds" check, and Cloudflare listed no builds for the Worker. The next push, a new branch, built on its own.
- **Cause unknown.** Likely the push that creates the first branch in an empty repo. `smoke-web` did not hit it. Not reproduced.
- **The fix works:** `POST /builds/triggers/<uuid>/builds` with the branch and commit started the build, and it deployed production. `start-build.sh` wraps that call. Tested on `habitrabbit` main.
- **Rejected:** having `npm run deploy` start the build itself. Projects hold no Cloudflare API calls, and a second build of a commit that did start one wastes a build minute.

## 2026-10-30: Version 2.1.0, deleting a project

- **Tested:** deleting a Worker leaves its build triggers, and the build token survives both. A build on a trigger with no Worker is cancelled in seconds, with no log. So a script removes triggers first, while the Worker's id can still be found.
- **Not tested:** `delete-project.sh` itself. Only its trigger and Worker calls were tested, one by one.
- **The token rename may not show.** The Builds API still listed the old name in the test after the owner renamed it. It is cosmetic.

## 2026-10-30: Version 2.0.0, Cloudflare builds and deploys every push

From project `smoke-web`, the first project through the whole playbook.

- **The block.** `npm run deploy` failed at the static asset upload with 401. Wrangler sends each upload with a short-lived JWT in `Authorization`. The session proxy replaces every `Authorization` header to `api.cloudflare.com` with the account token. Production and Previews both fail. `check-env.sh` missed it because it only tested login.
- **The choice: Workers Builds.** Cloudflare pulls from GitHub and deploys, so no upload crosses the proxy. It stays on Workers, costs nothing, and adds no Cloudflare token to GitHub. Rejected: deploying from Actions (a token copied to every project), serving files from the Worker (3 MB limit, every file counts against the daily request limit).
- **Tested on smoke-web.** A session created a Worker, connected the repo, reused one build token and added triggers, all over the API. A push to main deployed production. A push to a branch deployed a Preview with `wrangler preview`, which keeps Preview settings apart from production. `wrangler versions upload` does not, so hatchery does not use it.
- **Order matters.** A Preview returns 404 until the Worker has had one production deploy, so `connect-builds.sh` runs before the first push to `main`.
- **Browser tests stay out of the build.** Chromium downloads there but cannot start: `libatk-1.0.so.0` is missing, and the build user has no root to install it. So Cloudflare runs typecheck, unit tests and the privacy check. The hook and CI run everything.
- **Status page data is committed.** The build cannot produce e2e results or screenshots, so `npm run deploy` commits them to `public/status/` on the branch. Two open branches can conflict on those files; rerun `npm run deploy` after merging `main`. The results name the tested commit, which is the one before the data commit. That commit changes no code, so the hook skips the tests for it.
- **`status/build.json`.** Cloudflare's build writes the commit it deploys there. `npm run deploy` polls it to know the commit is live.
- **One manual step remains, once per account.** A build token needs a Cloudflare API token, so a fresh account makes one by importing a repo in the dashboard (SETUP.md, step 3). That exact path with the `hatchery` repo is not tested; a private project repo was.
- **The build token belongs to the account.** Cloudflare's docs keep it under My Profile > API Tokens and reuse it for later builds. So no project depends on the Worker that created it. Deleting that Worker is not tested yet.
- **Setup ends with one real project.** Ten smoke tests were too much for setup. Most test features a new user may never touch. They moved to Feature checks in SETUP.md.
- **Not tested yet:** `connect-builds.sh` as a whole. Its calls were tested one by one. Field names for the repo connection and the triggers come from Cloudflare's published API schema.

## 2026-10-30: First check-env run

- Org-wide Neon keys cannot call `/api/v2/users/me` or `neonctl me` ("not allowed for organization API keys"). `check-env.sh` lists projects instead. Creating a project with an org-wide key is not tested yet.

## 2026-10-30: Version 1.3.1, Neon is required again, Access per project

- **Neon is required again.** Making it optional in 1.3.0 was a mistake: the owner paused that step, and did not ask to change it. With the key in place a session creates a database without stopping, which is the point of hatchery. Going straight to the console after registering skips its onboarding form.
- **Access can be turned on for one project.** `init` protects every Worker. The owner wants to add sign-in to a specific project if it ever matters, so `scripts/access.sh protect <worker>` does that with its own Access app. Not tested: it needs Zero Trust, which is not set up.

## 2026-10-30: Version 1.3.0, Access is optional

From the first walkthrough of SETUP.md.

- **Access is optional.** Zero Trust wants payment details even on its $0 plan, and sign-in is not essential to every project. Without it, private projects have `noindex` and an unlisted URL. That is not protection: anyone with the link gets in. It is fine for rung 0, where data stays in the browser. On rungs 1 and up the Worker would serve data or spend a quota for anyone with the URL, so the session stops and asks first. `check-env.sh` reports Access as a NOTE, not a failure, and the first deploy no longer needs it.
- **`HATCHERY_PAT` is Administration only.** Contents and Workflows are unused. Secrets is added when a project first needs an Actions secret.
- **The network secret form refused `*.<subdomain>.workers.dev`.** The Claude Code docs give no reason: they only say a leading `*.` matches every subdomain. Untested: whether any wildcard under `workers.dev` works. It only matters with Access on, so it stays open.
- **Open internet lives in a separate environment.** `hatchery-research` has Full network access and no network secrets. A session can use a token through the proxy without seeing it, so a hostile page read under Full could misuse it in `hatchery-build`. Keeping the two apart means the session on the open internet has no account to act on. Research and deploying happen in separate sessions.
- **Neon's agent skill is not installed.** Its onboarding suggests `npx neon skills -y`. Sessions use `neonctl` and the API, and no project needs more yet.

## 2026-10-29: Version 1.2.0, ready to be public

Hatchery goes public so friends can use it. Three decisions:

- **Personal values live in the cloud environment, not the repo.** `HATCHERY_OWNER`, `HATCHERY_GIT_NAME`, `HATCHERY_GIT_EMAIL`, `HATCHERY_DOMAIN` and `HATCHERY_ANALYTICS_TOKEN` are environment variables in `hatchery-build`. Sessions read them; the repo names only the variables. A config file in the repo would have published them, and a gitignored one would not exist in cloud sessions, which clone the repo fresh. The environment is per person and already holds the account ID and network secrets, so a friend who forks hatchery sets their own values in one place. Project repos are private, so a session may write these values into them where a file needs them.
- **No project registry.** PROJECTS.md would have listed every private project in a public repo. A workflow that prints the list would too, because run logs and summaries of a public repo are public. Nothing needs the list: `create-project` refuses a repo name that exists, and before adding a cron trigger the session counts the account's triggers with the Cloudflare API. Every project repo carries the topic `hatchery`, so I find them with a GitHub search for `topic:hatchery` or by asking Claude on my laptop to run `gh repo list --topic hatchery`.
- **No original brief.** PROMPT.md built version 1.0.0 and then only misled sessions that found it in a search. It was removed; `git log --all -- PROMPT.md` finds it in the history.
- **Personal data removed from the history** before the repo went public, so no old commit holds my domain, name or email address in its files.

## 2026-10-28: Version 1.1.0, recipes replace the template repo

### Retire the template repo

The scaffold moved out of the `hatchery-template` repo into `recipes/` in hatchery, and the template repo is retired. Reasons:

- Projects will not look alike. Some ideas are not web apps, and web apps differ in which rungs they use.
- The template baked in choices the decision tree should make: the IndexedDB layer is rung 0, and a PWA is optional.
- The value was in the tested files, not in the template mechanism. In hatchery they sit next to the tree that picks them, one repo to maintain, with one CI that tests them.

Four recipes: `base` (every project), `web`, `web-storage` and `pwa`. `scripts/compose.sh` copies base and the picked recipes into the empty project repo, then the session makes the first commit.

How they stack:
- Recipes only add files. `compose.sh` refuses any file that two recipes, or the target, both have, and then writes nothing.
- Two files merge: `project.json` gains each recipe's keys (a repeated key is a conflict), and `.gitignore` lines are appended.
- `web` has extension points so the others need no patches: `src/features/*.ts` modules, `build/plugins/*.ts` Vite plugins, test globs, `scripts/session-start.d/*.sh`, and `.claude/rules/<recipe>.md`. Claude Code loads `.claude/rules/*.md` in every session, confirmed in this session on the composed test repo.
- `project.json` records `hatchery.version` and `hatchery.recipes`, replacing the `HATCHERY_VERSION` file, so the conventions sync knows what a project started from.

Tested:
- `web` alone: typecheck, 26 unit tests, 8 e2e tests, privacy check. Full stack: 40 unit tests, 16 e2e tests, privacy check. Both pass locally and in the `recipes` workflow on GitHub.
- The offline test fails when the service worker stops caching, so it tests the cache and not just the page.
- End to end: `create-project` made `hatchery-test-recipes` empty, private, with the topic. The session composed all four recipes, committed through the hook with my no-reply identity, and pushed. The project's own CI passed.

The `recipes` workflow runs only on changes under `recipes/`, plus `scripts/compose.sh` and the workflow itself, since both decide what gets tested.

### Topic guard on project-secret

`project-secret` could set Actions secrets on any of my repos except hatchery, because `HATCHERY_PAT` covers all repos. A session could have planted a secret in an unrelated repo. Now it refuses any repo without the topic `hatchery`. `create-project` sets the topic; sessions cannot, because the GitHub proxy blocks repo settings. Setting topics needs the fine-grained permission Administration: write, which the token already has for creating repos. Reading them needs only Metadata.

Tested: a repo without the topic is refused, a repo with it passes the guard, and hatchery itself is still refused.

## 2026-10-25: Build of version 1.0.0

### Settled questions from the brief

**Does the proxy's network secret replace the placeholder `Authorization` header that wrangler and neonctl send?**
Yes. Tested 2026-10-30 in `hatchery-build`: with the variable set to `placeholder`, `wrangler whoami` saw the account and `neonctl projects list` returned. So real tokens never need to be in environment variables, and the fallback that put them there is removed.

**Can a session set a project repo's Actions secrets through the GitHub proxy?**
No. Tested: every `actions/secrets` and `actions/variables` path returns 403 "Access to this GitHub Actions path is not permitted through this proxy", reads included. Built instead: the `project-secret` workflow. The session seals the value with the target repo's public key (`scripts/seal-secret.py`), so the plaintext never leaves the session. Tested so far: the guard that refuses hatchery itself, and the seal round trip. The current `HATCHERY_PAT` lacks the Secrets permission ("Resource not accessible by personal access token"), so SETUP.md step 6 adds it.

**Do Workers custom domains need zone DNS edit?**
Probably not. The API schema lists only account "Workers Scripts Write" for the custom domain endpoints. Wrangler deploys custom domains through account-level endpoints and lets Cloudflare create the DNS record. Cloudflare's own "Edit Cloudflare Workers" token template has zone "Workers Routes" and no DNS permission. So the token gets zone Workers Routes Edit on my domain and no DNS edit. Smoke test 5 confirms; add DNS Edit on that zone only if it fails.

**Does Neon offer keys narrower than the personal API key?**
Yes: organization keys and project-scoped keys. A project-scoped key has Editor access to one project and cannot create projects. Hatchery creates one Neon project per hatchery project, so sessions need an org-wide key. Jobs never get an API key: they get a connection string for their own database role.

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
- The proxy blocks repo settings writes (403). Repo settings, such as topics, come from `create-project`.
- Generating a repo from a template worked and kept my no-reply email. Superseded in 1.1.0: repos start empty.
- Opening and closing PRs over REST works. Creating releases is blocked for sessions, so native builds publish releases from the project's own Actions.
- Branch deletion is blocked over git and REST. Branches are deleted by hand.

### Web conventions, now in the recipes

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
- **Bootstrap exception:** the first commit, recipe files only, goes straight to `main` and deploys, so the pipeline works in the first hour.
- **One manual Web Analytics site for my domain.** Creating sites over the API needs Account Settings Edit, which the token must not have. One snippet token covers every subdomain.
- **Access service token scope:** the network secret goes to `*.<subdomain>.workers.dev` and `*.<my domain>`, never `*.workers.dev`, which would hand the token to every Workers site on the internet.
- **`WRANGLER_SEND_ERROR_REPORTS=false`** added to the environment variables, so wrangler never stops to ask.

### Minimum test floor per project type

A project's first DECISIONS.md entry lists the rows it keeps. The recipes' own tests meet their rows.

| Project type | Floor |
| --- | --- |
| Every project | Tests for all logic. The pre-commit hook and CI run them. |
| Web app | E2E on phone and desktop: loads without console errors. Read-only `@smoke` against every deploy. Privacy check. |
| Browser storage | A fixture per saved-data version. Data survives a reload. Export and import round-trip. |
| PWA | The manifest is served. Pages load offline after the first visit. |
| Worker API | Unit tests for handlers. E2E calls each route through `wrangler dev`. Auth and input validation tests for every write route. |
| D1 or Neon | Migrations apply to an empty local database and to a fixture copy of every past schema. No destructive migration without a test that proves the data survives. |
| Scheduled job | Job logic tested on fixture inputs. A dry-run mode that the tests use. The dashboard shows the last run and its result. |
| Crawler | Parsers tested on saved HTML fixtures. Rate limits and robots.txt respected in code, with a test. |
| Research or data | The pipeline runs on a fixed sample in tests and the computed results match a checked-in snapshot. The dashboard renders those results. |
| Native wrapper | The web floor, plus a CI build of each target that must succeed. |
