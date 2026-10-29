#!/usr/bin/env bash
# Checks a hatchery-build session: tools, variables, network secrets, Access, GitHub.
# Run it in a new session after SETUP.md, and whenever deploys or provisioning fail.
# One line per check, never a secret. Exits 1 if any check fails.
set -u
fails=0
ok() { echo "OK    $1"; }
bad() { echo "FAIL  $1"; fails=$((fails + 1)); }
CF=https://api.cloudflare.com/client/v4

for tool in wrangler neonctl gh jq node; do
  command -v "$tool" >/dev/null 2>&1 && ok "$tool installed" || bad "$tool missing: check the setup script"
done
python3 -c 'import nacl' 2>/dev/null && ok "pynacl installed" || bad "pynacl missing: check the setup script"

[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] && ok "CLOUDFLARE_ACCOUNT_ID set" || bad "CLOUDFLARE_ACCOUNT_ID not set"
for var in CLOUDFLARE_API_TOKEN NEON_API_KEY; do
  [ "${!var:-}" = placeholder ] && ok "$var is the placeholder" || bad "$var must be the word placeholder; the real value is a network secret"
done
[ "${WRANGLER_SEND_METRICS:-}" = false ] && ok "WRANGLER_SEND_METRICS=false" || bad "WRANGLER_SEND_METRICS should be false"

# curl sends no Authorization header here. The proxy adds the network secret.
[ "$(curl -s "$CF/user/tokens/verify" | jq -r .success 2>/dev/null)" = true ] \
  && ok "Cloudflare token reaches api.cloudflare.com" || bad "Cloudflare token: check the network secret for api.cloudflare.com"
[ "$(curl -s -o /dev/null -w '%{http_code}' https://console.neon.tech/api/v2/users/me)" = 200 ] \
  && ok "Neon key reaches console.neon.tech" || bad "Neon key: check the network secret for console.neon.tech"

# The open question in SETUP.md: these CLIs send "Authorization: Bearer placeholder". Does the proxy replace it?
wrangler whoami 2>&1 | grep -q "${CLOUDFLARE_ACCOUNT_ID:-none}" \
  && ok "wrangler whoami: proxy replaces the placeholder" || bad "wrangler whoami failed: see SETUP.md, Fallback for CLI tokens"
neonctl me >/dev/null 2>&1 \
  && ok "neonctl me: proxy replaces the placeholder" || bad "neonctl me failed: see SETUP.md, Fallback for CLI tokens"

sub=$(curl -s "$CF/accounts/${CLOUDFLARE_ACCOUNT_ID:-none}/workers/subdomain" | jq -r '.result.subdomain // empty' 2>/dev/null)
[ -n "$sub" ] && ok "workers.dev subdomain: $sub" || bad "No workers.dev subdomain: choose one (SETUP.md, step 3)"

apps=$(curl -s "$CF/accounts/${CLOUDFLARE_ACCOUNT_ID:-none}/access/apps" 2>/dev/null)
echo "$apps" | jq -e '.result[]? | select(any(.destinations[]?; .type == "all_workers"))' >/dev/null 2>&1 \
  && ok "Access protects all Workers" || bad "No Access app for all Workers: run scripts/access.sh init (needs Zero Trust, SETUP.md step 4)"

gh api repos/OWNER/hatchery/actions/workflows --jq '.workflows[].path' 2>/dev/null | grep -q create-project \
  && ok "GitHub: create-project workflow reachable" || bad "GitHub: cannot see hatchery workflows"

echo
[ "$fails" -eq 0 ] && echo "All checks passed." || echo "$fails check(s) failed."
[ "$fails" -eq 0 ]
