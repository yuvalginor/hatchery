# Recipe: pwa

Installable on the phone and usable offline. Needs `web`.

## When

Optional for any web project. Pick it when I will use the app from my phone's home screen or without a network. Skip it for pages I only visit.

## Adds

- `public/sw.js`: the service worker. Network first, cache as fallback, never `/api/`.
- `src/features/pwa.ts`: registers it in production builds.
- `build/plugins/pwa.ts`: generates `manifest.webmanifest` from `project.json` and links it with `crossorigin="use-credentials"`, so installs work behind Access.
- Tests: `tests/unit/pwa.test.ts`, `tests/e2e/pwa.spec.ts`.
- Rules: `.claude/rules/pwa.md`.

## After copying

- `status.html`, "How to use it": add "Install it: Share, then Add to Home Screen (iPhone), or Install app (Android, desktop Chrome)."
- The manifest uses `public/icons/icon-192.png` and `icon-512.png` from the web recipe. `npm run icons` regenerates them.

## Tests

They run inside the web recipe's `npm test`. The manifest test is `@smoke`. The offline test proves pages load from the cache with the network off.
