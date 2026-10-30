// Build status page: shows how the deployed build was verified. scripts/report.ts writes the data.
import './styles.css';
import { el } from './dom';

interface Suite {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  tests: { title: string; status: string }[];
}

export interface Results {
  commit: string;
  branch: string;
  builtAt: string;
  suites: Suite[];
  screenshots: { file: string; caption: string }[];
}

export function renderResults(results: Results): HTMLElement {
  const failed = results.suites.reduce((sum, suite) => sum + suite.failed, 0);
  return el(
    'div',
    {},
    el('p', { class: failed ? 'badge bad' : 'badge good' }, failed ? `${failed} failing` : 'All checks passed'),
    el('p', {}, `Tested commit ${results.commit} on ${results.branch}, ${new Date(results.builtAt).toLocaleString()}.`),
    ...results.suites.map((suite) =>
      el(
        'details',
        {},
        el('summary', {}, `${suite.name}: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`),
        el('ul', {}, ...suite.tests.map((test) => el('li', { class: test.status }, `${test.status}: ${test.title}`))),
      ),
    ),
    el(
      'div',
      { class: 'shots' },
      ...results.screenshots.map((shot) =>
        el('figure', {}, el('img', { src: `/status/${shot.file}`, alt: shot.caption, loading: 'lazy' }), el('figcaption', {}, shot.caption)),
      ),
    ),
  );
}

const target = document.querySelector<HTMLElement>('#results');
if (target) {
  fetch('/status/results.json', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
    .then((results: Results) => target.replaceChildren(renderResults(results)))
    .catch(() => {
      target.textContent = 'No verification results yet. Run npm run deploy on a branch to add them.';
    });
}
