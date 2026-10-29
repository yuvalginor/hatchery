// Feature module (web recipe, src/main.ts): registers the service worker in production builds.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('/sw.js');
}
