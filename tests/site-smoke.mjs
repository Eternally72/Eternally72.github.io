import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(resolve(root, name), 'utf8');
const files = ['index.html','projects.html','platform.html','review.html','memory.html','about.html'];
const pages = new Map(files.map(name => [name, read(name)]));
const idsOf = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const css = read('system.css');
let largest = 0;
for (const [file, html] of pages) {
  const ids = idsOf(html);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${file}: expected one h1`);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /name="viewport"/);
  assert.equal(html.match(/<style id="homepage-styles">\n([\s\S]*?)\n  <\/style>/)?.[1], css.trimEnd(), `${file}: stale styles`);
  assert.doesNotMatch(html, /<link\b[^>]*rel="stylesheet"/, `${file}: blocking stylesheet`);
  assert.doesNotMatch(html, /TiMEM|paper-forge|novel-agent|trajectory-runner/i, `${file}: excluded content`);
  assert.doesNotMatch(html, /(?:href|src)="[^"\n]*(?:dev\/|\.pdf)/, `${file}: private resume link`);
  const canonical = file === 'index.html' ? '' : file;
  assert.ok(html.includes(`<link rel="canonical" href="https://eternally72.github.io/${canonical}">`));
  for (const [, reference] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(reference)) continue;
    const [path, hash] = reference.split('#');
    if (path) assert.ok(existsSync(resolve(root, path)), `${file}: missing ${path}`);
    if (hash) assert.ok(idsOf(path ? read(path) : html).includes(hash), `${file}: missing ${reference}`);
  }
  for (const [, reference] of html.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g)) {
    for (const id of reference.split(' ')) assert.ok(ids.includes(id), `${file}: missing ARIA target ${id}`);
  }
  for (const [anchor] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(anchor, /rel="[^"]*noopener/);
  assert.equal(html.includes('<script src="particles.js"'), file === 'index.html', 'Particles must be home-only');
  assert.equal(html.includes('<dialog'), ['platform.html','review.html'].includes(file), 'Only original project pages need modal code');
  const bytes = [file, 'script.js', 'assets/favicon.svg', 'assets/bai-sans.woff2', ...(file === 'index.html' ? ['particles.js'] : [])]
    .reduce((total, path) => total + statSync(resolve(root, path)).size, 0);
  assert.ok(bytes < 250_000, `${file}: page exceeds 250 KB budget (${bytes})`);
  largest = Math.max(largest, bytes);
}
for (const sheet of ['system.css','project-details.css']) {
  for (const [, path] of read(sheet).matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (!path.startsWith('#')) assert.ok(existsSync(resolve(root,path)), `Missing ${path}`);
  }
}
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /focus-visible/);
assert.match(read('.gitignore'), /(?:^|\n)\/?dev\/?(?:\n|$)/);
assert.ok(statSync(resolve(root,'script.js')).size < 8_000);
assert.ok(statSync(resolve(root,'particles.js')).size < 6_000);
assert.match(pages.get('about.html'), /IEEE Transactions on Consumer Electronics/);
assert.match(pages.get('platform.html'), /4,028/);
assert.match(pages.get('memory.html'), /尚未完成系统评测/);
assert.doesNotMatch(pages.get('memory.html'), /github\.com\/Eternally72\/mem-plugin/, 'Private repository must not be a public source link');
const { projects } = await import('../project-data.js');
const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
for (const url of [...strings(projects), ...[...pages.values()].flatMap(html => [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]))]) {
  if (url.startsWith('https://github.com/Eternally72/trpc-agent-service')) assert.match(url, /\/(?:tree|blob)\/feature\/baijun(?:\/|$)/, `Wrong platform branch: ${url}`);
}
for (const project of Object.values(projects)) assert.ok(existsSync(resolve(root, project.architecture.image)));
const lazyBytes = ['project-details.js','project-data.js','project-diagrams.js','project-details.css','assets/bai-details.woff2','assets/platform-architecture.svg','assets/review-architecture.svg']
  .reduce((n,file) => n + statSync(resolve(root,file)).size,0);
assert.ok(lazyBytes < 150_000);
console.log(`Six pages passed: links, anchors, content, branch URLs and accessibility. Largest page: ${(largest / 1024).toFixed(1)} KiB. Lazy details: ${(lazyBytes / 1024).toFixed(1)} KiB.`);
