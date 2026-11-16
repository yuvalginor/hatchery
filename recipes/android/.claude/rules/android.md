# Android app

The Android app is a Capacitor wrapper around the web build. The web build in `dist/` ships inside the APK.

## Commands

- `npm run build && npx cap sync android`: copies `dist/` and the plugins into `android/`. Needs no Android SDK.
- `node scripts/android-icons.ts`: renders the launcher icons from `assets/icon.svg`.
- The APK builds on GitHub Actions (`.github/workflows/android.yml`), not in a session: the session cannot reach the Android SDK. Read the run's `android-release` notice annotation for the release link.
- Building locally, with the Android SDK: `cd android && ./gradlew assembleRelease -Ppreview`. Without the `ANDROID_KEYSTORE_*` variables the APK is unsigned.

## Layout

- `capacitor.config.ts`: app id and name from `project.json`, `webDir: dist`, the scheme and host.
- `android/`: the native project, committed. `android/.gitignore` leaves out what `cap sync` copies in.
- `android/app/build.gradle`: the app id and the name come from `project.json`. `-Ppreview` builds "<title> Preview" (`<appId>.preview`), `-PversionCode` is the Actions run number, and the signing key comes from `ANDROID_KEYSTORE_FILE`, `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_ALIAS`.
- The code's package is `dev.hatchery.app`, whatever the app id is. Do not rename it.
- `src/platform.ts`: `isNativeApp()`. `src/back.ts`: the back gesture's order, set with `setBackLayers`.
- `src/native/`: the app's glue, imported dynamically only inside the app. `index.ts` (back gesture), `bars.ts` (system bars follow the page), `share.ts` (export through the share sheet), `updates.ts` (live updates). `update.ts` is the pure part.
- Live updates: `build/plugins/update.ts` sets `__APP_VERSION__` and `__UPDATE_ORIGIN__` for each build and runs `scripts/bundle.ts`, which writes `dist/app/bundle-<version>.zip` and `dist/app/latest.json`.

## Rules

- Never change the app id or the origin (`androidScheme: 'https'`, `hostname: 'localhost'`, so `https://localhost`). The origin holds every saved piece of data in the app. A new one starts the app empty.
- Never import `src/native/` statically. The web bundle must stay free of it.
- Web changes reach the app as live updates after a deploy: open, background and reopen the app. Keep `notifyAppReady()` early in `startUpdates`, or every update rolls back after 10 s.
- Never point the updater at Capgo's servers. Keep `updateUrl`, `channelUrl` and `statsUrl` empty in `capacitor.config.ts`.
- Native changes need a new APK: anything in `android/`, `capacitor.config.ts` or a Capacitor plugin. Code in `src/native/` ships as a live update too, unless it needs a new plugin. The workflow also runs on `src/native/`, so its Preview APK can be tested.
- Test on the branch's Preview APK before merging. A merge to `main` publishes the real app's Release.
- The signing key lives in Actions secrets `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD`, set through hatchery's `project-secret` workflow. Its alias, the project's name, is plain text in the workflow: as a secret, the runner masks that word in every log line and link. The owner keeps a copy of the key. Never commit it. Updates install over the old app only with the same key.
- The status and navigation bars take the page's background. Keep `android/app/src/main/res/values*/colors.xml` (`page`) equal to it, light and dark: the splash and the first frame use it.
- The service worker never registers in the app.
- Export inside the app goes through the share sheet (`src/native/share.ts`). A WebView cannot save a blob.
