#!/usr/bin/env bash
# Connects a project repo to Cloudflare Workers Builds: one Worker, one repo connection, two triggers.
# Run it in a hatchery-build session before the first push to main, so that push deploys production.
# Safe to run again: it finds what exists and updates the commands.
#   scripts/connect-builds.sh <name>
set -euo pipefail
NAME=${1:?usage: scripts/connect-builds.sh <name>}
: "${CLOUDFLARE_ACCOUNT_ID:?not set: use the hatchery-build environment}"
: "${HATCHERY_OWNER:?not set: use the hatchery-build environment}"
ACCOUNT=https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID
BUILD_COMMAND="npm run build:ci"

# Cloudflare rate-limits these calls, so each one waits. The proxy adds the token.
api() { sleep 2; curl -sS -H 'Content-Type: application/json' "$@"; }
need() {
  if [ "$(jq -r .success <<<"$2")" != true ]; then
    echo "$1 failed: $(jq -c .errors <<<"$2")" >&2
    exit 1
  fi
}

worker=$(api "$ACCOUNT/workers/workers/$NAME" | jq -r '.result.id // empty')
if [ -z "$worker" ]; then
  res=$(api -X POST "$ACCOUNT/workers/workers" -d "$(jq -n --arg name "$NAME" '{name: $name}')")
  need "Create Worker" "$res"
  worker=$(jq -r .result.id <<<"$res")
fi

res=$(api "$ACCOUNT/builds/tokens")
need "List build tokens" "$res"
token=$(jq -r '.result[0].build_token_uuid // empty' <<<"$res")
if [ -z "$token" ]; then
  echo "No build token: do SETUP.md step 3, part 3, once." >&2
  exit 1
fi

repo=$(gh api "repos/$HATCHERY_OWNER/$NAME" --jq '{repo_id: (.id | tostring), repo_name: .name, provider_account_id: (.owner.id | tostring), provider_account_name: .owner.login, provider_type: "github"}')
res=$(api -X PUT "$ACCOUNT/builds/repos/connections" -d "$repo")
need "Connect repo" "$res"
connection=$(jq -r .result.repo_connection_uuid <<<"$res")

res=$(api "$ACCOUNT/builds/workers/$worker/triggers")
need "List triggers" "$res"
triggers=$res

# trigger <name> <includes as JSON> <excludes as JSON> <deploy command>
trigger() {
  local uuid
  uuid=$(jq -r --argjson inc "$2" '[.result[] | select(.branch_includes == $inc)][0].trigger_uuid // empty' <<<"$triggers")
  if [ -n "$uuid" ]; then
    res=$(api -X PATCH "$ACCOUNT/builds/triggers/$uuid" -d "$(jq -n --arg build "$BUILD_COMMAND" --arg deploy "$4" '{build_command: $build, deploy_command: $deploy}')")
  else
    res=$(api -X POST "$ACCOUNT/builds/triggers" -d "$(jq -n \
      --arg script "$worker" --arg token "$token" --arg connection "$connection" --arg name "$1" \
      --arg build "$BUILD_COMMAND" --arg deploy "$4" --argjson inc "$2" --argjson exc "$3" \
      '{external_script_id: $script, build_token_uuid: $token, repo_connection_uuid: $connection,
        trigger_name: $name, build_command: $build, deploy_command: $deploy, root_directory: "/",
        branch_includes: $inc, branch_excludes: $exc, path_includes: ["*"], path_excludes: []}')")
  fi
  need "Trigger $1" "$res"
}

trigger "Deploy main" '["main"]' '[]' "npx wrangler deploy"
trigger "Preview branches" '["*"]' '["main"]' "npm run deploy:preview"
echo "Connected $NAME: pushes to main deploy production, other branches get a Preview."
