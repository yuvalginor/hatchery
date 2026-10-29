#!/usr/bin/env bash
# Installs npm dependencies. Skips npm ci while package.json and the lockfile are unchanged.
hashes=node_modules/.install.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  npm ci --no-audit --no-fund && sha256sum package.json package-lock.json > "$hashes"
fi
