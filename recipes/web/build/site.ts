// project.json is the single source for names, URLs and privacy. This plugin applies it to every
// HTML page and generates robots.txt and _headers, so flipping "public" changes them all.
import type { Plugin } from 'vite';

export interface Project {
  name: string;
  title: string;
  description: string;
  workersSubdomain: string;
  url: string;
  public: boolean;
  themeColor: string;
  analyticsToken: string;
  privacyAllow: string[];
}

export function workersDevUrl(project: Project, preview?: string): string {
  const host = `${project.name}.${project.workersSubdomain}.workers.dev`;
  return `https://${preview ? `${preview}-` : ''}${host}`;
}

export function siteUrl(project: Project): string {
  return (project.url || workersDevUrl(project)).replace(/\/+$/, '');
}

const escapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (c) => escapes[c]);

export function renderHtml(html: string, project: Project): string {
  const values: Record<string, string> = {
    '%TITLE%': project.title,
    '%DESCRIPTION%': project.description,
    '%URL%': siteUrl(project),
    '%THEME%': project.themeColor,
  };
  let out = html.replace(/%(TITLE|DESCRIPTION|URL|THEME)%/g, (key) => escapeHtml(values[key]));
  const head: string[] = [];
  if (!project.public) head.push('<meta name="robots" content="noindex, nofollow">');
  if (project.public && project.analyticsToken) {
    const beacon = escapeHtml(JSON.stringify({ token: project.analyticsToken }));
    head.push(`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${beacon}"></script>`);
  }
  if (head.length) out = out.replace('</head>', `  ${head.join('\n  ')}\n  </head>`);
  return out;
}

export function robots(project: Project): string {
  return project.public ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
}

export function headers(project: Project): string {
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://static.cloudflareinsights.com",
    "connect-src 'self' https://cloudflareinsights.com",
    "img-src 'self' data: blob:",
    "style-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  const lines = [
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ];
  if (!project.public) lines.push('  X-Robots-Tag: noindex, nofollow');
  return `${lines.join('\n')}\n`;
}

export function sitePlugin(project: Project): Plugin {
  return {
    name: 'hatchery-site',
    transformIndexHtml: { order: 'pre', handler: (html) => renderHtml(html, project) },
    generateBundle() {
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });
      emit('robots.txt', robots(project));
      emit('_headers', headers(project));
    },
  };
}
