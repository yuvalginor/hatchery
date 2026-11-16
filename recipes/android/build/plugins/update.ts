// Live updates for the Android app. Every build knows its version and where its updates come from,
// and publishes itself as an update (scripts/bundle.ts). main takes updates from production; a branch from its
// own Preview, so a Preview APK follows its branch. The same commit gets the same version on Cloudflare and Actions.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { siteUrl, workersDevUrl, type Project } from '../site.ts';
import { previewName } from '../../scripts/deploy.ts';
import { writeUpdate } from '../../scripts/bundle.ts';
import { versionOf } from '../../src/native/update.ts';

const git = (...args: string[]): string => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

export function updateOrigin(project: Project, branch: string): string {
  return branch === 'main' || branch === '' ? siteUrl(project) : workersDevUrl(project, previewName(branch, project.name));
}

export default function updatePlugin(project: Project): Plugin {
  // Workers Builds and GitHub Actions name the commit and branch; a local build asks git.
  const commit = process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || git('rev-parse', 'HEAD') || '0000000';
  const branch = process.env.WORKERS_CI_BRANCH || process.env.GITHUB_REF_NAME || git('rev-parse', '--abbrev-ref', 'HEAD');
  const committedAt = git('log', '-1', '--format=%cI', commit);
  const version = versionOf(commit, committedAt ? new Date(committedAt) : new Date());
  let config: ResolvedConfig;
  return {
    name: 'android-update',
    config: () => ({
      define: {
        __APP_VERSION__: JSON.stringify(version),
        __UPDATE_ORIGIN__: JSON.stringify(updateOrigin(project, branch)),
      },
    }),
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      if (config.command !== 'build') return;
      const manifest = writeUpdate(resolve(config.root, config.build.outDir), version);
      console.log(`Live update ${manifest.version} for ${updateOrigin(project, branch)}`);
    },
  };
}
