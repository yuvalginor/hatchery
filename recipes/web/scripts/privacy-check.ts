// Scans the build output before every deploy and fails on bad practice: files outside the
// allowlist, sourcemaps, secrets, private addresses, internal hostnames, stray emails, local paths.
// A sanity check, not a guarantee. Usage: node scripts/privacy-check.ts dist
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ALLOWED_EXTENSIONS = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.xml', '.svg',
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.wasm',
]);
const ALLOWED_NAMES = new Set(['_headers', '_redirects']);
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.xml', '.svg', '']);

const RULES: [string, RegExp][] = [
  ['sourcemap reference', /sourceMappingURL=/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Stripe key', /\b[sr]k_live_[A-Za-z0-9]{16,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['AI API key', /\bsk-(ant-|proj-)?[A-Za-z0-9_-]{32,}/],
  ['Cloudflare Access secret', /\bcfast_[A-Za-z0-9]{40}/],
  ['database URL with password', /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^\s:@/'"]+:[^\s@/'"]+@/],
  ['secret assignment', /\b(api[_-]?key|secret|password|passwd|access[_-]?token|auth[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i],
  ['bearer token', /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/],
  ['private IP address', /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/],
  ['internal hostname', /\b(localhost(:\d+)?|[a-z0-9-]+\.(local|internal|lan|corp|intranet|svc\.cluster\.local))\b/i],
  ['email address', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['local file path', /(\/home\/[a-z]|\/Users\/[A-Za-z]|[A-Z]:\\Users\\)/],
];

export interface Finding {
  file: string;
  rule: string;
  match: string;
}

export function scanText(file: string, text: string, allow: string[] = []): Finding[] {
  const findings: Finding[] = [];
  for (const [rule, pattern] of RULES) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const found of text.matchAll(global)) {
      if (!allow.some((allowed) => found[0].includes(allowed))) findings.push({ file, rule, match: found[0].slice(0, 80) });
    }
  }
  return findings;
}

export function checkName(file: string): Finding[] {
  const name = file.split('/').pop() ?? file;
  if (name.startsWith('.')) return [{ file, rule: 'dotfile', match: name }];
  if (name.endsWith('.map')) return [{ file, rule: 'sourcemap file', match: name }];
  if (!ALLOWED_NAMES.has(name) && !ALLOWED_EXTENSIONS.has(extname(name).toLowerCase())) {
    return [{ file, rule: 'file type not on the allowlist', match: name }];
  }
  return [];
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function scanDir(dir: string, allow: string[] = []): Finding[] {
  return walk(dir).flatMap((path) => {
    const file = relative(dir, path);
    const findings = checkName(file);
    if (TEXT_EXTENSIONS.has(extname(path).toLowerCase())) findings.push(...scanText(file, readFileSync(path, 'utf8'), allow));
    return findings;
  });
}

if (import.meta.main) {
  const dir = process.argv[2] ?? 'dist';
  const project = JSON.parse(readFileSync('project.json', 'utf8'));
  const allow: string[] = [...project.privacyAllow, project.analyticsToken].filter(Boolean);
  const findings = scanDir(dir, allow);
  for (const finding of findings) console.error(`${finding.file}: ${finding.rule}: ${finding.match}`);
  if (findings.length) {
    console.error(`Privacy check failed: ${findings.length} finding(s) in ${dir}. Fix them, or add a known-safe string to privacyAllow in project.json.`);
    process.exit(1);
  }
  console.log(`Privacy check passed: ${walk(dir).length} files in ${dir}.`);
}
