# Recipes

Tested project files. A new project starts from `base` plus the recipes DECISION-TREE.md picks.

| Recipe | What it adds | Needs |
| --- | --- | --- |
| [base](base/RECIPE.md) | Session start, notes skeletons, `project.json`, inbox. Every project. | |
| [web](web/RECIPE.md) | Static web app on Cloudflare Workers: Vite, TypeScript, tests, hook, CI, deploy, privacy check, status page, noindex, Access when it is on. | base |
| [web-storage](web-storage/RECIPE.md) | Versioned IndexedDB storage with export and import. Rung 0. | web |
| [pwa](pwa/RECIPE.md) | Service worker and manifest: installable, works offline. | web |

## Compose

```sh
scripts/compose.sh /home/user/$NAME web web-storage pwa
```

`compose.sh` copies `base`, then each recipe in order, then the Karpathy skill, and records the hatchery version and the recipe list in `project.json`. It writes nothing if any file conflicts.

## How recipes stack

Recipes add files. They never patch another recipe's file. Two files merge instead:

- `project.json`: a recipe's keys are added. A key that already exists is a conflict.
- `.gitignore`: a recipe's lines are appended.

A recipe that depends on others lists them in a `NEEDS` file, one per line. `compose.sh` refuses the list unless each needed recipe comes earlier, so `web pwa` works and `pwa` alone does not. `base` is always first and never listed.

The web recipe has extension points, so other recipes plug in by adding files:

- `src/features/<recipe>.ts` runs on page load. One may export `mount(root)` to own `#app`.
- `build/plugins/<recipe>.ts` default-exports `(project) => Plugin` for Vite.
- `tests/unit/*.test.ts` and `tests/e2e/*.spec.ts` join the suite by glob.
- `scripts/session-start.d/*.sh` runs at session start.
- `.claude/rules/<recipe>.md` holds the recipe's rules for project sessions.

## Changing recipes

- Each recipe keeps a RECIPE.md: when the tree picks it, what it adds, what to adjust after copying, which tests run.
- The `recipes` workflow tests `web` alone and the full stack on every change under `recipes/`. A new recipe gets a stack in its matrix.
- These files are project files. Their CLAUDE.md and `.claude/rules/` describe projects, not hatchery.
- A change to a recipe is a convention change: bump `VERSION` and add a CHANGELOG.md entry.
