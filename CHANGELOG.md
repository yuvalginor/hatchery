# Changelog

Hatchery conventions, versioned in `VERSION`. Each project records the version it follows, and the recipes it started from, under `hatchery` in its `project.json`. Project sessions show me the entries newer than theirs and ask before updating.

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
