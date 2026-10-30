// Turns the test reports into public/status/results.json and copies the e2e screenshots next to it.
// npm run deploy commits them, because Cloudflare's build has no browser to produce them.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

type Test = { title: string; status: string };

export function unitSuite(report: any) {
  const tests: Test[] = report.testResults.flatMap((file: any) =>
    file.assertionResults.map((test: any) => ({ title: test.fullName, status: test.status === 'pending' ? 'skipped' : test.status })),
  );
  return summarize('Unit tests', tests);
}

export function e2eSuite(report: any) {
  const tests: Test[] = [];
  const visit = (suite: any, prefix: string[]) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const status = test.status === 'expected' || test.status === 'flaky' ? 'passed' : test.status === 'skipped' ? 'skipped' : 'failed';
        tests.push({ title: [...prefix, spec.title, `(${test.projectName})`].join(' '), status });
      }
    }
    for (const child of suite.suites ?? []) visit(child, child.title.endsWith('.ts') ? prefix : [...prefix, child.title]);
  };
  for (const suite of report.suites) visit(suite, []);
  return summarize('End-to-end tests', tests);
}

function summarize(name: string, tests: Test[]) {
  const count = (status: string) => tests.filter((test) => test.status === status).length;
  return { name, passed: count('passed'), failed: count('failed'), skipped: count('skipped'), tests };
}

if (import.meta.main) {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
  rmSync('public/status', { recursive: true, force: true });
  mkdirSync('public/status', { recursive: true });
  const shots = existsSync('reports/screenshots') ? readdirSync('reports/screenshots').filter((f) => f.endsWith('.png')).sort() : [];
  for (const file of shots) copyFileSync(`reports/screenshots/${file}`, `public/status/${file}`);
  const results = {
    commit: git('rev-parse', '--short', 'HEAD'),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    builtAt: new Date().toISOString(),
    suites: [unitSuite(read('reports/unit.json')), e2eSuite(read('reports/e2e.json'))],
    screenshots: shots.map((file) => ({ file, caption: file.replace(/\.png$/, '').replace(/-/g, ' ') })),
  };
  writeFileSync('public/status/results.json', `${JSON.stringify(results, null, 2)}\n`);
  console.log(`Wrote public/status/results.json and ${shots.length} screenshot(s).`);
}
