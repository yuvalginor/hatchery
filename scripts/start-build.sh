#!/usr/bin/env bash
# Starts a Workers Build by hand, for a push that started none.
# Use it when `npm run deploy` waits and the commit on GitHub has no "Workers Builds" check.
# Seen on the first push to main of a new, empty repo. Run it in hatchery, then `npm run deploy` again in the project.
#   scripts/start-build.sh <name> [branch]    branch defaults to main
set -euo pipefail
NAME=${1:?usage: scripts/start-build.sh <name> [branch]}
BRANCH=${2:-main}
: "${CLOUDFLARE_ACCOUNT_ID:?not set: use the hatchery-build environment}"
: "${HATCHERY_OWNER:?not set: use the hatchery-build environment}"
ACCOUNT=https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID

# The proxy adds the token.
api() { curl -sS -H 'Content-Type: application/json' "$@"; }

worker=$(api "$ACCOUNT/workers/workers/$NAME" | jq -r '.result.id // empty')
[ -n "$worker" ] || { echo "No Worker named $NAME: run scripts/connect-builds.sh $NAME first." >&2; exit 1; }

# main uses the "Deploy main" trigger. Every other branch uses the Preview trigger.
includes=$([ "$BRANCH" = main ] && echo '["main"]' || echo '["*"]')
trigger=$(api "$ACCOUNT/builds/workers/$worker/triggers" | jq -r --argjson inc "$includes" '[.result[] | select(.branch_includes == $inc)][0].trigger_uuid // empty')
[ -n "$trigger" ] || { echo "No trigger for $BRANCH: run scripts/connect-builds.sh $NAME first." >&2; exit 1; }

commit=$(gh api "repos/$HATCHERY_OWNER/$NAME/commits/$BRANCH" --jq .sha)
res=$(api -X POST "$ACCOUNT/builds/triggers/$trigger/builds" -d "$(jq -n --arg branch "$BRANCH" --arg commit "$commit" '{branch: $branch, commit_hash: $commit}')")
if [ "$(jq -r .success <<<"$res")" != true ]; then
  echo "Start build failed: $(jq -c .errors <<<"$res")" >&2
  exit 1
fi
echo "Started a build of $NAME $BRANCH at ${commit:0:7}. Now run npm run deploy in the project."
