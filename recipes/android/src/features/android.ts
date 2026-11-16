// Feature module (web recipe, src/main.ts): inside the Android app it loads the native glue in src/native/.
// In a browser nothing is loaded, so the web bundle stays free of Capacitor's native code.
import { isNativeApp } from '../platform';

if (isNativeApp()) void import('../native/index').then(({ start }) => start());
