#!/usr/bin/env bash
# Installs the npm packages the android recipe needs and refreshes the lockfile. Run once after composing,
# then commit package.json and package-lock.json. Recipes never edit package.json, so this is its own step.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --no-audit --no-fund \
  @capacitor/core @capacitor/android @capacitor/app @capacitor/filesystem @capacitor/share @capgo/capacitor-updater
npm install --no-audit --no-fund --save-dev @capacitor/cli fflate
