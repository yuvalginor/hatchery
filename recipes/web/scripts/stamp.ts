// Runs in Cloudflare's build. Writes dist/status/build.json, which names the commit being deployed,
// so npm run deploy can tell when that commit is live.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const commit = process.env.WORKERS_CI_COMMIT_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
mkdirSync('dist/status', { recursive: true });
writeFileSync('dist/status/build.json', `${JSON.stringify({ commit, builtAt: new Date().toISOString() })}\n`);
console.log(`Stamped dist/status/build.json with ${commit.slice(0, 7)}.`);
