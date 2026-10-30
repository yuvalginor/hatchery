# Recipe: web-storage

Data saved in the browser, versioned, with export and import. Needs `web`.

## When

DECISION-TREE.md rung 0: the project saves data and needs no backend.

## Adds

- `src/data/schema.ts`: the saved shape, its version and migrations.
- `src/data/store.ts`: IndexedDB load and save, persistence request.
- `src/data/transfer.ts`: export and import as a file.
- `src/entries.ts`, `src/entries.css`: an example list that uses all three.
- `src/features/storage.ts`: asks the browser to keep the data and mounts the example.
- Tests: `tests/unit/schema.test.ts`, `transfer.test.ts`, `tests/fixtures/data/v1.json`, `tests/e2e/storage.spec.ts`.
- Rules: `.claude/rules/web-storage.md`.

## After copying

- `src/data/schema.ts`: the project's data. Before the first release, change version 1 in place and update `tests/fixtures/data/v1.json` to match. After that, only migrations.
- Replace `src/entries.ts` with the project's UI, and point the `mount` in `src/features/storage.ts` at it. Keep export and import reachable.
- Status page screenshots: the web recipe's screenshot shows the app empty. Add an e2e test that imports sample data and saves `reports/screenshots/<project>-<name>.png`, so the page shows the app in use.
- `status.html`, "How to use it": add "Export now and then. Browser data lives on one device and the browser can clear it."

## Tests

They run inside the web recipe's `npm test`. The e2e tests write data, so none are `@smoke`.
