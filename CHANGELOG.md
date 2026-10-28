# Changelog

Hatchery conventions, versioned in `VERSION`. Each project records the version it follows, and the recipes it started from, under `hatchery` in its `project.json`. Project sessions show me the entries newer than theirs and ask before updating.

## 1.1.0 (2026-10-28)

Recipes replace the template repo. No project used 1.0.0, so nothing needs migrating.

- `recipes/`: `base` for every project, plus `web`, `web-storage` and `pwa`. The files are the 1.0.0 scaffold, split so the decision tree picks what a project gets. Each recipe has a RECIPE.md.
- `scripts/compose.sh` copies `base` and the picked recipes into a new project, refuses conflicts, and records `hatchery.version` and `hatchery.recipes` in `project.json`. That replaces the `HATCHERY_VERSION` file.
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
