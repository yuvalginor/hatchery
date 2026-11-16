# Recipe: android

An Android app that wraps the web app with Capacitor, built and signed on GitHub Actions, installed from a GitHub Release. Needs `web`.

## When

DECISION-TREE.md branch 4, mobile on Android. Pick it when the web app should also be a real app on the phone: full screen, its own icon, offline from the first launch, and native features a web page cannot have, such as notifications on a schedule or a home-screen widget. A web app I only install from the browser needs [pwa](../pwa/RECIPE.md) instead.

iOS has no recipe: it needs a Mac and a paid Apple membership. See Platform limits in DECISION-TREE.md.

## Adds

- Capacitor: `capacitor.config.ts`, and the native project in `android/`, committed as Capacitor recommends.
- The app's id and name come from `project.json`: `android.appId` and `title`. Nothing else names the project.
- Glue, loaded only inside the app: `src/features/android.ts` starts `src/native/index.ts`. It handles the back gesture, colours the status and navigation bars, shares exports through Android's share sheet, and applies live updates.
- Live updates: `build/plugins/update.ts` and `scripts/bundle.ts` publish every web build as `app/latest.json` and a zip. The app pulls it with Capgo's updater in its self-hosted mode: no Capgo account, no Capgo servers.
- Build: `.github/workflows/android.yml`. A signed APK on a GitHub Release.
- Scripts: `scripts/android-deps.sh` installs the npm packages, `scripts/android-icons.ts` renders the launcher icons from `assets/icon.svg`.
- Tests: `tests/unit/update.test.ts`, `bundle.test.ts`, `back.test.ts`, `native.test.ts`.
- Rules: `.claude/rules/android.md`.
- Merges: `android.appId` into `project.json`.

## After copying

1. `project.json`: set `android.appId`, such as `com.<owner>.<name>`. It is permanent: a new id is a different app. The code's own package stays `dev.hatchery.app`, so no folders are renamed.
2. `bash scripts/android-deps.sh`, then commit `package.json` and `package-lock.json`. Recipes never edit `package.json`, so this is its own step.
3. `node scripts/android-icons.ts` after the project's own `assets/icon.svg` is in place. Commit the launcher icons it writes.
4. `android/app/src/main/res/values/colors.xml` and `values-night/colors.xml`: `page` equal to the page's background, light and dark. The splash and the first frame use it.
5. Back gesture: in the app's code, call `setBackLayers(() => [...])` from `src/back.ts` with what can be open, topmost first: a menu inside a sheet, a popup, a sheet, a drill-down view. Each is `{ open, close }`. With nothing open, the app leaves.
6. Export with `web-storage`: in `download()`, inside the app call `shareFile` from `src/native/share.ts` instead of saving a blob, which a WebView cannot save: `if (isNativeApp()) return (await import('../native/share')).shareFile(name, text)`.
7. The service worker, with `pwa`: `src/features/pwa.ts` registers in browsers only; add `&& !isNativeApp()` (from `src/platform.ts`). The files are bundled in the APK, so it works offline without one.
8. The signing key, once, in the session:
   - `keytool -genkeypair -storetype PKCS12 -keystore release.p12 -alias <name> -keyalg RSA -keysize 2048 -validity 36500 -dname "CN=<name>"` with a random password. The alias and the `CN` are the project's `name` from `project.json`. The workflow checks both.
   - Seal `ANDROID_KEYSTORE_BASE64` (the file, base64) and `ANDROID_KEYSTORE_PASSWORD` into Actions secrets with the `project-secret` workflow. Never print them.
   - Send me a copy of `release.p12` and its password to keep, then delete them from the session. An update installs over the app only when signed with the same key.
   - The alias stays plain text in the workflow on purpose: as a secret, the runner masks that word in every log line and link.
9. `README.md`: what the Android app is, and the services with their reasons: GitHub Actions for builds, GitHub Releases for installs.

## How it works

- **Origin:** the app serves the bundled web build at `https://localhost`. That origin holds all its saved data, so `androidScheme` and `hostname` never change.
- **Bundled, with live updates:** the web build ships in the APK, so it works offline at once. A merge to `main` deploys the site and publishes the update. On launch and on resume the app checks `app/latest.json` on its own site, downloads a newer bundle, checks its hash, and applies it the next time it goes to the background. A bundle that fails to start rolls back by itself, so `notifyAppReady()` must be called early.
- **Releases:** a push that touches `android/`, `capacitor.config.ts`, `src/native/` or the lockfile builds an APK. `main` publishes `android-v<run>`. A branch publishes a pre-release `android-preview-<branch>`, a separate app ("<title> Preview") with its own data, so trying a branch never touches the real app. The run ends with a notice annotation `android-release` carrying the link.
- **Native changes need a new APK;** web changes reach the app as live updates.

## Native features

Not in the recipe, because they depend on the app. DECISION-TREE.md, "Native features on Android", has the patterns and what went wrong the first time.

## Tests

- `npm test` runs the recipe's unit tests with the web stack's.
- CI builds a debug APK of the Preview flavour from a freshly composed project, so a change to a native file or a Gradle setting fails there first. Sessions cannot build the APK: they have no Android SDK.
