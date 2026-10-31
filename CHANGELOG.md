# Changelog

Hatchery conventions, versioned in `VERSION`. Each project records the version it follows, and the recipes it started from, under `hatchery` in its `project.json`. Project sessions show me the entries newer than theirs and ask before updating.

## 3.1.0 (2026-10-31)

Projects keep to themselves. Touches `base`, `web` and `pwa`. No code changes.

- `base`: a lesson goes to hatchery only if it is general, only after my yes, and never names a project. CLAUDE.md has the rules.
- `web` rule: no `style` attributes under the CSP. Set CSS custom properties from script.
- `pwa` rule: an installed iOS app has no address bar, so anything a link carries in also needs a paste field.
- DECISION-TREE.md: applying migrations to a preview database and to the local database.

To update a project: replace the lessons line in `CLAUDE.md`, the first paragraph of `HATCHERY_INBOX.md`, and add the two rule lines to `.claude/rules/web.md` and `.claude/rules/pwa.md`.

## 3.0.0 (2026-10-31)

The status page is gone. Touches `web`, `web-storage` and `pwa`. Cloudflare triggers do not change.

- Removed: `status.html`, `src/status.ts`, `scripts/report.ts`, committed test results, the "Build status" link, JSON test reports.
- `build.json` moves from `dist/status/` to `dist/`.
- The pre-commit hook is back to `exec npm test`.
- "What was built" and "How to use it" move to README.md. Test counts go in the PR and the report.

To update a project: delete `status.html`, `src/status.ts`, `scripts/report.ts` and `public/status/`, and any test that saves status screenshots. Take these `web` files if the project has not changed them: `vite.config.ts`, `playwright.config.ts`, `.githooks/pre-commit`, `scripts/deploy.ts`, `scripts/stamp.ts`, `tests/unit/deploy.test.ts`, `tests/unit/privacy.test.ts`, `tests/e2e/web.spec.ts`, `.claude/rules/web.md`. Edit three by hand: remove the "Build status" footer from `index.html`, the status page styles from `src/styles.css`, and the `reports/` line from `.gitignore`. Never replace `.gitignore`: it also holds base's `.env` lines. Move the status page text to README.md.

## 2.3.1 (2026-10-31)

One approval per project. No recipes touched.

- The session posts the plan summary and carries on. It stops only if the plan goes beyond the kickoff answers.

## 2.3.0 (2026-10-31)

Status page screenshots with data in them. Touches `web-storage`: RECIPE.md and its rules.

- After copying: add an e2e test that imports sample data and saves a screenshot for the status page.
- Rule: import into an app with no saved data may skip the confirm.

## 2.2.1 (2026-10-31)

Fixes to `delete-project.sh`. No recipes touched.

- It also finds triggers that belong to Previews.
- A failed lookup stops the script, so "none" means none.

## 2.2.0 (2026-10-30)

Projects get a design of their own. Touches the rules of `web`.

- Kickoff asks about look and feel, with a specific proposal.
- New design rule in the build step, and a check that the app does not look like the starter.
- Taking every default skips the wait, not the proposals or the plan summary.
- README and SETUP.md no longer tell people to take every default.

## 2.1.1 (2026-10-30)

A manual build for a push that started none. No recipes touched.

- New `scripts/start-build.sh <name> [branch]`: starts a Workers Build of the branch's latest commit.
- CLAUDE.md, step 4.7: use it when the first push to `main` shows no "Workers Builds" check.

## 2.1.0 (2026-10-30)

A central way to delete a project. No recipes touched.

- New `scripts/delete-project.sh`: build triggers, Worker, D1 databases, Neon project.
- CLAUDE.md and SETUP.md say how to use it. Deleting a Worker alone leaves its triggers behind.
- The logo now holds the word hatchery. The README title is gone.

## 2.0.0 (2026-10-30)

Cloudflare Workers Builds deploys every push. Sessions cannot deploy assets through the proxy. Touches the `web` recipe. Web projects must change.

- New `scripts/connect-builds.sh` in hatchery. Run it before the first push to `main`.
- New in `web`: `npm run build:ci`, `npm run deploy:preview`, `scripts/stamp.ts`, `scripts/preview.ts`.
- `npm run deploy` no longer deploys. On a branch it tests, commits status page data and pushes. It then waits for the build and runs the smoke tests.
- Status page data moves to `public/status/` and is committed.
- The pre-commit hook skips tests for a commit of only `public/status/`.
- SETUP.md: connect GitHub in step 3, add Workers Builds Configuration to the token in step 5.
- SETUP.md: step 12 is one first project. The other smoke tests move to an optional Feature checks section.
- New README tagline and a logo outline with changing width.

To update a project: copy the `web` files above, then run `scripts/connect-builds.sh <name>`. It updates existing triggers.

## 1.3.1 (2026-10-30)

Neon is required again. Access works per project. No recipes touched.

- `check-env.sh` fails again without Neon, and SETUP.md step 7 is required.
- `scripts/access.sh protect <worker>` and `unprotect <worker>`: sign-in for one project.

## 1.3.0 (2026-10-30)

Access and Neon are optional. Touches the docs of `web`; projects need no change.

- `check-env.sh` shows skipped optional parts as NOTE instead of failing.
- With Access off, the first deploy goes ahead, and rungs 1 and up on a private project need the owner's OK.
- `HATCHERY_PAT` needs only Administration. Secrets is added when a project needs it.
- Optional `hatchery-research` environment for open-web work: Full network, no network secrets, no deploys.
- SETUP.md fixed from a real walkthrough.

## 1.2.0 (2026-10-29)

Ready to be public. Touches the `base` recipe.

- Personal values come from the cloud environment: `HATCHERY_OWNER`, `HATCHERY_GIT_NAME`, `HATCHERY_GIT_EMAIL`, and optional `HATCHERY_DOMAIN` and `HATCHERY_ANALYTICS_TOKEN`. Nothing personal is in the repo.
- `base`: `scripts/session-start.sh` sets the commit identity from `HATCHERY_GIT_NAME` and `HATCHERY_GIT_EMAIL`, and warns if they are missing. The project CLAUDE.md attaches `$HATCHERY_OWNER/hatchery`. Existing projects: copy both files from `recipes/base`.
- PROJECTS.md is gone. Find projects by the topic `hatchery`. Before adding a cron trigger, sessions count the account's triggers with the Cloudflare API.
- PROMPT.md is gone; it is in the history.
- `check-env.sh` checks the new variables.
- README rewritten, MIT license, SETUP.md generic for anyone who forks hatchery.

## 1.1.0 (2026-10-28)

Recipes replace the template repo. No project used 1.0.0, so nothing needs migrating.

- `recipes/`: `base` for every project, plus `web`, `web-storage` and `pwa`. The files are the 1.0.0 scaffold, split so the decision tree picks what a project gets. Each recipe has a RECIPE.md.
- `scripts/compose.sh` copies `base` and the picked recipes into a new project, refuses conflicts, and records `hatchery.version` and `hatchery.recipes` in `project.json`. That replaces the `HATCHERY_VERSION` file. A recipe's `NEEDS` file lists the recipes it requires, and `compose.sh` refuses a list that skips one. It runs on macOS bash 3.2 too.
- Recipe rules live in `.claude/rules/<recipe>.md`, so recipes never edit the project's CLAUDE.md.
- `create-project` creates an empty private repo with the topic `hatchery`. The template and `is_template` options are gone. The session composes and pushes the first commit.
- `project-secret` refuses repos without the topic `hatchery`.
- `recipes` workflow: tests `web` alone and the full stack when recipes change.
- DECISION-TREE.md links nodes to recipes and adds platform limits: no native macOS or iOS builds in cloud sessions.

## 1.0.0 (2026-10-25)

First version.

- Launcher playbook (CLAUDE.md), decision tree, project registry, setup guide.
- `create-project` workflow: private repos from a template repo, with name checks and errors as annotations.
- `project-secret` workflow: Actions secrets on project repos, sealed in the session.
- Project scaffold in a template repo: Vite and TypeScript, versioned IndexedDB storage with export and import, PWA, status page fed by test results, privacy check of `dist/`, pre-commit hook, CI, deploy script with branch Previews.
- Vendored Karpathy guidelines skill.
