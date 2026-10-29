#!/usr/bin/env bash
# SessionStart hook (.claude/settings.json). In cloud sessions: commit identity and git hooks,
# then each recipe's own setup in scripts/session-start.d/, such as installing dependencies.
# The identity comes from the cloud environment (HATCHERY_GIT_NAME, HATCHERY_GIT_EMAIL), never from the repo.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 1

if [ -n "${HATCHERY_GIT_NAME:-}" ] && [ -n "${HATCHERY_GIT_EMAIL:-}" ]; then
  git config user.name "$HATCHERY_GIT_NAME"
  git config user.email "$HATCHERY_GIT_EMAIL"
else
  echo "session-start: HATCHERY_GIT_NAME or HATCHERY_GIT_EMAIL is not set. Use the hatchery-build environment, or commits will not be credited to you." >&2
fi
git config core.hooksPath .githooks

for step in scripts/session-start.d/*.sh; do
  [ -f "$step" ] && bash "$step"
done
exit 0
