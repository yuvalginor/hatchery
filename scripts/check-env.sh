#!/usr/bin/env bash
# Checks a hatchery-build session: tools, variables, network secrets, Access, GitHub.
# Run it in a new session after SETUP.md, and whenever deploys or provisioning fail.
# One line per check, never a secret. NOTE marks an optional part that is off. Exits 1 if any check fails.
set -u
fails=0
ok() { echo "OK    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }
note() { echo "NOTE  $1"; }
CF=https://api.cloudflare.com/client/v4

for tool in wrangler neonctl gh jq node; do
  command -v "$tool" >/dev/null 2>&1 && ok "$tool installed" || bad "$tool missing: check the setup script"
done
python3 -c 'import nacl' 2>/dev/null && ok "pynacl installed" || bad "pynacl missing: check the setup script"

[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] && ok "CLOUDFLARE_ACCOUNT_ID set" || bad "CLOUDFLARE_ACCOUNT_ID not set"
for var in CLOUDFLARE_API_TOKEN NEON_API_KEY; do
  [ "${!var:-}" = placeholder ] && ok "$var is the placeholder" || bad "$var must be the word placeholder; the real value is a network secret"
done
for var in HATCHERY_OWNER HATCHERY_GIT_NAME HATCHERY_GIT_EMAIL; do
  [ -n "${!var:-}" ] && ok "$var set" || bad "$var not set (SETUP.md, step 8)"
done
case "${HATCHERY_GIT_EMAIL:-}" in *@users.noreply.github.com) ok "HATCHERY_GIT_EMAIL is a GitHub no-reply address" ;; *) bad "HATCHERY_GIT_EMAIL should be your GitHub no-reply address" ;; esac
[ -n "${HATCHERY_DOMAIN:-}" ] && ok "HATCHERY_DOMAIN set" || note "HATCHERY_DOMAIN not set: no custom domains"
[ "${WRANGLER_SEND_METRICS:-}" = false ] && ok "WRANGLER_SEND_METRICS=false" || bad "WRANGLER_SEND_METRICS should be false"

# curl sends no Authorization header here. The proxy adds the network secret.
[ "$(curl -s "$CF/user/tokens/verify" | jq -r .success 2>/dev/null)" = true ] \
  && ok "Cloudflare token reaches api.cloudflare.com" || bad "Cloudflare token: check the network secret for api.cloudflare.com"

# These CLIs send "Authorization: Bearer placeholder". The proxy replaces it with the network secret.
wrangler whoami 2>&1 | grep -q "${CLOUDFLARE_ACCOUNT_ID:-none}" \
  && ok "wrangler whoami: proxy replaces the placeholder" || bad "wrangler whoami failed: check the network secret for api.cloudflare.com"
# Org-wide keys cannot call /users/me or neonctl me, so these list projects instead.
[ "$(curl -s -o /dev/null -w '%{http_code}' https://console.neon.tech/api/v2/projects)" = 200 ] \
  && ok "Neon key reaches console.neon.tech" || bad "Neon key: check the network secret for console.neon.tech"
neonctl projects list >/dev/null 2>&1 \
  && ok "neonctl projects list: proxy replaces the placeholder" || bad "neonctl projects list failed: check the network secret for console.neon.tech"

sub=$(curl -s "$CF/accounts/${CLOUDFLARE_ACCOUNT_ID:-none}/workers/subdomain" | jq -r '.result.subdomain // empty' 2>/dev/null)
[ -n "$sub" ] && ok "workers.dev subdomain: $sub" || bad "No workers.dev subdomain: choose one (SETUP.md, step 3)"

apps=$(curl -s "$CF/accounts/${CLOUDFLARE_ACCOUNT_ID:-none}/access/apps" 2>/dev/null)
echo "$apps" | jq -e '.result[]? | select(any(.destinations[]?; .type == "all_workers"))' >/dev/null 2>&1 \
  && ok "Access protects all Workers" || note "Access is off: private projects have noindex and an unlisted URL, no sign-in. With Zero Trust set up, run scripts/access.sh init (SETUP.md, step 4)"

gh api "repos/${HATCHERY_OWNER:-none}/hatchery/actions/workflows" --jq '.workflows[].path' 2>/dev/null | grep -q create-project \
  && ok "GitHub: create-project workflow reachable" || bad "GitHub: cannot see hatchery workflows"

echo
[ "$fails" -eq 0 ] && echo "All checks passed." || echo "$fails check(s) failed."
[ "$fails" -eq 0 ]
