#!/usr/bin/env bash
# SessionStart hook (.claude/settings.json). In cloud sessions: commit identity and git hooks,
# then each recipe's own setup in scripts/session-start.d/, such as installing dependencies.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 1

git config user.name "Your Name"
git config user.email "ID+USERNAME@users.noreply.github.com"
git config core.hooksPath .githooks

for step in scripts/session-start.d/*.sh; do
  [ -f "$step" ] && bash "$step"
done
exit 0
