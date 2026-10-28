// Verifies, then deploys. main goes to production; any other branch gets its own Preview.
// Runs the full test suite, writes the status page data, scans the build, deploys dist/,
// then runs the read-only @smoke tests against the live URL. Usage: npm run deploy
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { siteUrl, workersDevUrl, type Project } from '../build/site.ts';

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

if (import.meta.main) {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const run = (command: string, args: string[], env: Record<string, string> = {}) =>
    execFileSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });

  const project: Project = JSON.parse(readFileSync('project.json', 'utf8'));
  const problems = checkConfig(project, readFileSync('wrangler.jsonc', 'utf8'));
  if (git('status', '--porcelain')) problems.push('Commit your changes first, so the status page matches what ships.');
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  run('npm', ['test']);
  run('node', ['scripts/report.ts']);
  run('npm', ['run', 'privacy']);

  let url: string;
  if (branch === 'main') {
    run('npx', ['wrangler', 'deploy']);
    url = siteUrl(project);
  } else {
    const name = previewName(branch, project.name);
    run('npx', ['wrangler', 'preview', '--name', name, '--message', git('log', '-1', '--format=%s')]);
    url = workersDevUrl(project, name);
  }

  run('npx', ['playwright', 'test', '--grep', '@smoke'], { BASE_URL: url });
  console.log(`\nDeployed ${branch} to ${url}\nStatus page: ${url}/status.html`);
}
