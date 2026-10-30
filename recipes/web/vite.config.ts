import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { sitePlugin, type Project } from './build/site.ts';

const project: Project = JSON.parse(readFileSync('project.json', 'utf8'));

// Recipes add Vite plugins as build/plugins/<recipe>.ts, each with a default export (project) => Plugin.
const pluginDir = 'build/plugins';
const recipePlugins: Plugin[] = existsSync(pluginDir)
  ? await Promise.all(
      readdirSync(pluginDir)
        .filter((file) => file.endsWith('.ts'))
        .sort()
        .map(async (file) => (await import(pathToFileURL(resolve(pluginDir, file)).href)).default(project)),
    )
  : [];

export default defineConfig({
  plugins: [sitePlugin(project), ...recipePlugins],
  build: {
    sourcemap: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
