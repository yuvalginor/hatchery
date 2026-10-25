#!/usr/bin/env bash
# Setup script for the hatchery-build cloud environment (SETUP.md, step 7).
# Runs as root on Ubuntu 24.04 before Claude Code starts, then the environment is cached.
# It cannot read the environment's variables or network secrets. It must exit 0.
# Idempotent: skips anything already installed. Node, npm, Python, gh, jq and Playwright's Chromium come preinstalled.
set -u
log() { echo "[hatchery-setup] $*"; }

npm_tool() { # package binary
  command -v "$2" >/dev/null 2>&1 && return 0
  npm install -g --no-audit --no-fund "$1" >/dev/null 2>&1 || log "WARN: npm install $1 failed"
}

npm_tool wrangler@4 wrangler &
npm_tool neonctl@8 neonctl &
# PyNaCl seals Actions secrets for hatchery's project-secret workflow (scripts/seal-secret.py).
(python3 -c 'import nacl' 2>/dev/null || pip install --quiet --break-system-packages pynacl || log "WARN: pynacl failed") &
(command -v gh >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y -qq gh) || log "WARN: gh failed") &
wait

log "wrangler $(wrangler --version 2>/dev/null | tail -n 1)"
log "neonctl $(neonctl --version 2>/dev/null)"
log "$(gh --version 2>/dev/null | head -n 1)"
log "pynacl $(python3 -c 'import nacl; print(nacl.__version__)' 2>/dev/null)"
exit 0
