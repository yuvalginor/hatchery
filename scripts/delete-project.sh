#!/usr/bin/env bash
# Removes a project's cloud resources: build triggers, Worker, D1 databases, Neon project.
# Triggers go first: deleting a Worker leaves them behind, and they need the Worker's id.
# Run it in a hatchery-build session. Without --yes it only lists what it would delete.
# The GitHub repo stays: sessions cannot delete it. The owner does that by hand.
#   scripts/delete-project.sh <name> [--yes]
set -euo pipefail
NAME=${1:?usage: scripts/delete-project.sh <name> [--yes]}
YES=${2:-}
: "${CLOUDFLARE_ACCOUNT_ID:?not set: use the hatchery-build environment}"
if [ "$NAME" = hatchery ]; then
  echo "Refusing to touch hatchery itself." >&2
  exit 1
fi
ACCOUNT=https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID

# Cloudflare rate-limits these calls, so each one waits. The proxy adds the token.
api() { sleep 2; curl -sS "$@"; }
remove() {
  local res
  res=$(api -X DELETE "$2")
  if [ "$(jq -r .success <<<"$res")" != true ]; then
    echo "Delete $1 failed: $(jq -c .errors <<<"$res")" >&2
    exit 1
  fi
  echo "Deleted $1."
}

worker=$(api "$ACCOUNT/workers/workers/$NAME" | jq -r '.result.id // empty')
triggers=
if [ -n "$worker" ]; then
  triggers=$(api "$ACCOUNT/builds/workers/$worker/triggers" | jq -r '.result[]?.trigger_uuid')
fi
databases=
for db in "$NAME" "$NAME-preview"; do
  id=$(api "$ACCOUNT/d1/database?name=$db" | jq -r --arg db "$db" '.result[]? | select(.name == $db) | .uuid')
  databases="$databases${id:+$id $db
}"
done
neon=$(neonctl projects list --output json | jq -r --arg name "$NAME" '(.projects? // .) | .[] | select(.name == $name) | .id')

echo "Found for $NAME:"
echo "  Worker: ${worker:-none}"
echo "  Triggers: ${triggers:-none}"
echo "  D1: ${databases:-none}"
echo "  Neon: ${neon:-none}"
if [ -z "$worker" ]; then
  echo "  Any triggers left from a deleted Worker cannot be found by name. Look them up by script_tag in the audit log."
fi
if [ "$YES" != --yes ]; then
  echo "Nothing deleted. Run again with --yes."
  exit 0
fi

for trigger in $triggers; do remove "trigger $trigger" "$ACCOUNT/builds/triggers/$trigger"; done
if [ -n "$worker" ]; then remove "Worker $NAME" "$ACCOUNT/workers/workers/$worker"; fi
while read -r id db; do
  if [ -n "$id" ]; then remove "D1 $db" "$ACCOUNT/d1/database/$id"; fi
done <<<"$databases"
if [ -n "$neon" ]; then
  neonctl projects delete "$neon"
  echo "Deleted Neon project."
fi
echo "Done. Delete the GitHub repo by hand: sessions cannot."
