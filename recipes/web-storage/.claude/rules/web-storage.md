# Web storage recipe

- Saved data lives in IndexedDB through `src/data/store.ts`. Never localStorage for app data: it caps at about 5 MB.
- `src/data/schema.ts` holds the shape. Any change to saved fields bumps `VERSION`, adds a migration step, and adds `tests/fixtures/data/v<N>.json`. The fixture test fails until all three exist.
- Export and import are the backup. Keep both reachable in the UI and covered by the e2e test.
- Import replaces data only after the user confirms.
