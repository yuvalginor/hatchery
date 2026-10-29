# CLAUDE.md

How to work on this project. Read this file, `.claude/rules/`, DECISIONS.md and README.md first. Update them before you finish.

Each recipe the project started from adds its commands and rules in `.claude/rules/<recipe>.md`. `project.json` lists the recipes and the hatchery version.

## Start of every session

1. Check hatchery. Attach `$HATCHERY_OWNER/hatchery` with `add_repo` (read). If its `VERSION` is newer than `hatchery.version` in `project.json`, show me its CHANGELOG.md entries since ours and ask whether to update. Never update on your own.
2. Read DECISIONS.md.
3. In a cloud session, `scripts/session-start.sh` sets the commit identity and git hooks, then runs each recipe's setup in `scripts/session-start.d/`. Sessions with several repos skip repo hooks; then run it yourself: `CLAUDE_CODE_REMOTE=true CLAUDE_PROJECT_DIR=$PWD bash scripts/session-start.sh`.

## Rules

- Work on a branch. Open a PR with `gh api repos/{owner}/{repo}/pulls`; `gh pr` is blocked. Never merge. I merge, or tell you to.
- Commit only with tests passing. Never skip the hook.
- Saved data: every shape carries a version. New fields get defaults. Never rename or remove a field without a migration. Keep a test fixture for every past shape. Never reset my data unless I ask.
- Security: OWASP top 10. No secrets in the repo. Actions secrets go through hatchery's `project-secret` workflow.
- Private by default (`"public": false` in `project.json`). Go public only when I say.
- Every added service gets a reason in README.md.
- Commits use `HATCHERY_GIT_NAME` and `HATCHERY_GIT_EMAIL` from the cloud environment; `scripts/session-start.sh` sets them. A workflow that commits gets the same two values written into it.

## Before you finish

- DECISIONS.md: new choices and assumptions. README.md: what it is, where it runs, services and reasons.
- This file and `.claude/rules/`: anything the next session needs.
- Lessons for every project: open a PR on hatchery if attached, else append to `HATCHERY_INBOX.md` and tell me.
- Report in the session: what changed, where to see it, what to try.
