import { describe, expect, it } from 'vitest';
import { checkConfig, isLive, previewName } from '../../scripts/deploy';
import { e2eSuite, unitSuite } from '../../scripts/report';
import type { Project } from '../../build/site';

describe('deploy helpers', () => {
  it('turns branch names into valid Preview names', () => {
    expect(previewName('claude/youthful-edison-itgwgh', 'app')).toBe('claude-youthful-edison-itgwgh');
    expect(previewName('Feature/Add_Login', 'app')).toBe('feature-add-login');
    expect(previewName('123-fix', 'app')).toBe('b-123-fix');
    const long = previewName(`feature-${'x'.repeat(80)}`, 'my-project');
    expect(`${long}-my-project`.length).toBeLessThanOrEqual(63);
  });

  it('catches config mistakes before deploying', () => {
    const project = { name: 'demo', workersSubdomain: 'SUBDOMAIN' } as Project;
    expect(checkConfig(project, '{ "name": "other" }')).toHaveLength(2);
    expect(checkConfig({ ...project, workersSubdomain: 'me' }, '{ "name": "demo" }')).toEqual([]);
  });

  it('knows when a commit is live', () => {
    expect(isLive('{"commit":"abc123"}', 'abc123')).toBe(true);
    expect(isLive('{"commit":"abc"}', 'abc123')).toBe(true);
    expect(isLive('{"commit":"def456"}', 'abc123')).toBe(false);
    expect(isLive('{"commit":""}', 'abc123')).toBe(false);
    expect(isLive('<html>', 'abc123')).toBe(false);
    expect(isLive('', 'abc123')).toBe(false);
  });

  it('summarizes test reports for the status page', () => {
    const unit = unitSuite({ testResults: [{ assertionResults: [{ fullName: 'a', status: 'passed' }, { fullName: 'b', status: 'pending' }] }] });
    expect(unit).toMatchObject({ passed: 1, skipped: 1, failed: 0 });
    const e2e = e2eSuite({
      suites: [{ title: 'app.spec.ts', specs: [{ title: 'loads', tests: [{ projectName: 'phone', status: 'expected' }, { projectName: 'desktop', status: 'unexpected' }] }] }],
    });
    expect(e2e).toMatchObject({ passed: 1, failed: 1 });
    expect(e2e.tests[0].title).toBe('loads (phone)');
  });
});
