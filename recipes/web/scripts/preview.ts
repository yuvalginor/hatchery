// Deploy step of Workers Builds for every branch except main. Branch names can hold characters
// a Preview name cannot, so this cleans the name first.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { previewName } from './deploy.ts';

const branch = process.env.WORKERS_CI_BRANCH;
if (!branch) throw new Error('WORKERS_CI_BRANCH is not set: this script runs in Workers Builds.');
const { name } = JSON.parse(readFileSync('project.json', 'utf8'));
execFileSync('npx', ['wrangler', 'preview', '--name', previewName(branch, name)], { stdio: 'inherit' });
