# PWA recipe

- `public/sw.js` is network first: an online visit always gets the latest deploy, and the cache only answers offline. Keep it that way, so iterating never serves stale code.
- Bump `CACHE` in `public/sw.js` when the caching logic changes, so old caches are dropped.
- Never cache `/api/` responses.
- An app installed on iOS keeps its storage apart from Safari. Tell me when that matters.
