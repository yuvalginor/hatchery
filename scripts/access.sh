#!/usr/bin/env bash
# Cloudflare Access for hatchery Workers. Run in a hatchery-build session; the proxy adds the token.
#   scripts/access.sh init            Once: every Worker in the account, previews included, needs sign-in.
#                                     Allows me (one-time PIN to my Cloudflare email) and the
#                                     hatchery-sessions service token, so sessions can check deploys.
#   scripts/access.sh public <worker> Makes one Worker public, when I say a project goes public.
#   scripts/access.sh private <worker> Undoes public.
#   scripts/access.sh list            Lists Access apps.
# Set ACCESS_TOKEN_HEADER=<name> with init to accept the service token in one header (SETUP.md, step 7).
set -euo pipefail
: "${CLOUDFLARE_ACCOUNT_ID:?not set: use the hatchery-build environment}"
CF=https://api.cloudflare.com/client/v4
ACCOUNT="$CF/accounts/$CLOUDFLARE_ACCOUNT_ID"
TOKEN_NAME=hatchery-sessions
ALL_NAME="Hatchery: all Workers"

fail() { echo "access.sh: $*" >&2; exit 1; }
cf() { # method url [json body]: prints .result, fails with Cloudflare's errors
  local out
  out=$(curl -sS -X "$1" "$2" -H 'Content-Type: application/json' ${3:+--data "$3"})
  [ "$(jq -r .success <<<"$out")" = true ] || fail "$1 $2: $(jq -c '.errors // .' <<<"$out")"
  jq .result <<<"$out"
}
app_id() { cf GET "$ACCOUNT/access/apps" | jq -r --arg n "$1" '.[] | select(.name == $n) | .id'; }
upsert() { # name json
  local id
  id=$(app_id "$1")
  if [ -n "$id" ]; then cf PUT "$ACCOUNT/access/apps/$id" "$2" >/dev/null; else cf POST "$ACCOUNT/access/apps" "$2" >/dev/null; fi
  echo "Saved Access app: $1"
}

case "${1:-}" in
  init)
    email=$(cf GET "$CF/user" | jq -r .email)
    token=$(cf GET "$ACCOUNT/access/service_tokens" | jq -r --arg n "$TOKEN_NAME" '.[] | select(.name == $n) | .id')
    [ -n "$token" ] || fail "No service token named $TOKEN_NAME. Create it first (SETUP.md, step 4)."
    body=$(jq -n --arg email "$email" --arg token "$token" --arg name "$ALL_NAME" --arg header "${ACCESS_TOKEN_HEADER:-}" '{
      type: "self_hosted", name: $name, session_duration: "720h",
      destinations: [{type: "all_workers"}],
      policies: [
        {name: "Me", decision: "allow", include: [{email: {email: $email}}]},
        {name: "Hatchery sessions", decision: "non_identity", include: [{service_token: {token_id: $token}}]}
      ]} + (if $header == "" then {} else {read_service_tokens_from_header: $header} end)')
    upsert "$ALL_NAME" "$body"
    ;;
  public)
    worker=${2:?usage: access.sh public <worker>}
    id=$(cf GET "$ACCOUNT/workers/workers/$worker" | jq -r .id)
    body=$(jq -n --arg id "$id" --arg name "Hatchery public: $worker" '{
      type: "self_hosted", name: $name, destinations: [{type: "worker", worker_id: $id}],
      policies: [{name: "Everyone", decision: "bypass", include: [{everyone: {}}]}]}')
    upsert "Hatchery public: $worker" "$body"
    ;;
  private)
    worker=${2:?usage: access.sh private <worker>}
    id=$(app_id "Hatchery public: $worker")
    [ -n "$id" ] || fail "$worker has no public bypass."
    cf DELETE "$ACCOUNT/access/apps/$id" >/dev/null
    echo "Removed public bypass for $worker. The all-Workers app protects it again."
    ;;
  list)
    cf GET "$ACCOUNT/access/apps" | jq -r '.[] | "\(.name)\t\([.destinations[]?.type] | join(","))"'
    ;;
  *)
    sed -n '2,9p' "$0"
    exit 1
    ;;
esac
