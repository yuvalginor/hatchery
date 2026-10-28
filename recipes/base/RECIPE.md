# Recipe: base

What every project gets, whatever the platform.

## When

Always. `compose.sh` adds it first.

## Adds

- `CLAUDE.md`, `DECISIONS.md`, `HATCHERY_INBOX.md`: the project notes.
- `project.json`: name, title, description, `public`, and `hatchery` (version and recipes, written by `compose.sh`).
- `scripts/session-start.sh` and `.claude/settings.json`: the SessionStart hook. It sets my no-reply commit identity and `core.hooksPath`, then runs `scripts/session-start.d/*.sh` from other recipes.
- `.gitignore`: env files.
- `compose.sh` also copies `.claude/skills/karpathy-guidelines/` from hatchery.

## After copying

- `project.json`: `name` (the repo name), `title`, `description`.
- `README.md`: write it. What the project is, where it runs, how to run it, every service and why.
- `DECISIONS.md`: the first entry. Architecture path, recipes, test floor.

## Tests

None of its own. A platform recipe brings the pre-commit hook and CI. A project with no platform recipe still gets both: the session writes `.githooks/pre-commit` and a CI workflow that run the project's test command.
