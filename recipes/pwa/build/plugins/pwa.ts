// Vite plugin (web recipe, vite.config.ts): links and generates the web app manifest from project.json.
import type { Plugin } from 'vite';
import type { Project } from '../site.ts';

export function manifest(project: Project): object {
  return {
    name: project.title,
    short_name: project.title,
    description: project.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: project.themeColor,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

// use-credentials: behind Cloudflare Access the manifest request needs the session cookie.
export const MANIFEST_LINK = '<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials">';

export default function pwaPlugin(project: Project): Plugin {
  return {
    name: 'hatchery-pwa',
    transformIndexHtml: (html) => html.replace('</head>', `  ${MANIFEST_LINK}\n  </head>`),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: `${JSON.stringify(manifest(project), null, 2)}\n` });
    },
  };
}
