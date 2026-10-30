// Verifies a branch, then hands it to Cloudflare. Workers Builds deploys every push: main goes to
// production, any other branch gets its own Preview. Sessions cannot deploy assets themselves.
// On a branch: full test suite, status page data, push. Everywhere: waits for the build,
// then runs the read-only @smoke tests against the live URL. Usage: npm run deploy
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { siteUrl, workersDevUrl, type Project } from '../build/site.ts';

const WAIT_SECONDS = 600;

export function previewName(branch: string, worker: string): string {
  let name = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!/^[a-z]/.test(name)) name = `b-${name}`;
  // The Preview host label is <preview>-<worker> and must fit in 63 characters.
  return name.slice(0, 63 - worker.length - 1).replace(/-+$/, '');
}

export function checkConfig(project: Project, wranglerConfig: string): string[] {
  const problems: string[] = [];
  const wranglerName = wranglerConfig.match(/"name"\s*:\s*"([^"]+)"/)?.[1];
  if (wranglerName !== project.name) problems.push(`wrangler.jsonc name "${wranglerName}" differs from project.json name "${project.name}".`);
  if (!/^[a-z0-9-]+$/.test(project.workersSubdomain)) problems.push('Set workersSubdomain in project.json to the account workers.dev subdomain.');
  return problems;
}

// scripts/stamp.ts writes status/build.json in Cloudflare's build. A match means this commit is live.
export function isLive(buildJson: string, commit: string): boolean {
  try {
    const live = JSON.parse(buildJson).commit;
    return typeof live === 'string' && live.length > 0 && commit.startsWith(live);
  } catch {
    return false;
  }
}

if (import.meta.main) {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const run = (command: string, args: string[], env: Record<string, string> = {}) =>
    execFileSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  // curl, because it uses the session proxy. Node's fetch does not by default.
  const fetchText = (url: string) => {
    try {
      return execFileSync('curl', ['-s', '-f', '-m', '15', url], { encoding: 'utf8' });
    } catch {
      return '';
    }
  };

  const project: Project = JSON.parse(readFileSync('project.json', 'utf8'));
  const problems = checkConfig(project, readFileSync('wrangler.jsonc', 'utf8'));
  if (git('status', '--porcelain')) problems.push('Commit your changes first, so the status page matches what ships.');
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'main') {
    run('npm', ['test']);
    run('node', ['scripts/report.ts']);
    git('add', 'public/status');
    if (git('diff', '--cached', '--name-only')) git('commit', '-m', 'Update status page data');
    run('git', ['push', '-u', 'origin', branch]);
  }

  const url = branch === 'main' ? siteUrl(project) : workersDevUrl(project, previewName(branch, project.name));
  const commit = git('rev-parse', 'HEAD');
  console.log(`Waiting for Cloudflare to build ${commit.slice(0, 7)}.`);
  for (let waited = 0; !isLive(fetchText(`${url}/status/build.json`), commit); waited += 10) {
    if (waited >= WAIT_SECONDS) {
      console.error(`${commit.slice(0, 7)} is not live on ${url} after ${WAIT_SECONDS} seconds. The "Workers Builds" check on this commit shows why.`);
      process.exit(1);
    }
    await sleep(10_000);
  }

  run('npx', ['playwright', 'test', '--grep', '@smoke'], { BASE_URL: url });
  console.log(`\nDeployed ${branch} to ${url}\nStatus page: ${url}/status.html`);
}
