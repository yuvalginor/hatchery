# Changelog

Hatchery conventions, versioned in `VERSION`. Each project records the version it follows in `HATCHERY_VERSION`. Project sessions show me the entries newer than theirs and ask before updating.

## 1.0.0 (2026-10-25)

First version.

- Launcher playbook (CLAUDE.md), decision tree, project registry, setup guide.
- `create-project` workflow: private repos from `hatchery-template`, with name checks and errors as annotations.
- `project-secret` workflow: Actions secrets on project repos, sealed in the session.
- `hatchery-template` 1.0.0: Vite and TypeScript, versioned IndexedDB storage with export and import, PWA, status page fed by test results, privacy check of `dist/`, pre-commit hook, CI, deploy script with branch Previews.
- Vendored Karpathy guidelines skill.
