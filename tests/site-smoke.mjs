import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const html = read('index.html');
const css = read('system.css');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate element IDs');
assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'Expected one main heading');
assert.match(html, /<html lang="zh-CN">/, 'Missing page language');
assert.match(html, /name="viewport"/, 'Missing viewport');

for (const [, reference] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|data:)/.test(reference)) continue;
  const [path, hash] = reference.split('#');
  if (path) assert.ok(existsSync(resolve(root, path)), `Missing asset: ${path}`);
  else if (hash) assert.ok(ids.includes(hash), `Missing anchor: ${hash}`);
}
for (const [, reference] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (!reference.startsWith('#')) assert.ok(existsSync(resolve(root, reference)), `Missing CSS asset: ${reference}`);
}
for (const [, target] of html.matchAll(/aria-controls="([^"]+)"/g)) {
  assert.ok(ids.includes(target), `Missing ARIA target: ${target}`);
}
for (const [anchor] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
  assert.match(anchor, /rel="[^"]*noopener/, 'External tab is missing noopener');
}
assert.doesNotMatch(html, /(?:href|src)="[^"\n]*(?:dev\/|\.pdf)/, 'Private resume must not be linked');
assert.match(css, /prefers-reduced-motion/, 'Reduced-motion support is missing');
assert.match(css, /focus-visible/, 'Visible keyboard focus is missing');
assert.match(read('.gitignore'), /(?:^|\n)\/?dev\/?(?:\n|$)/, 'dev must remain ignored');
const runtimeBytes = ['index.html', 'system.css', 'script.js', 'assets/favicon.svg', 'assets/bai-sans.woff2']
  .reduce((total, file) => total + statSync(resolve(root, file)).size, 0);
assert.ok(runtimeBytes < 250_000, `Page exceeds 250 KB budget: ${runtimeBytes}`);
assert.ok(statSync(resolve(root, 'script.js')).size < 8_000, 'JavaScript exceeds 8 KB budget');
console.log(`Site checks passed. Total local page resources: ${(runtimeBytes / 1024).toFixed(1)} KiB.`);

// Preserve the platform branch explicitly: its implementation is not on main.
const { projects } = await import('../project-data.js');
const strings = (value) => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
for (const url of [...strings(projects), ...[...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])]) {
  if (url.startsWith('https://github.com/Eternally72/trpc-agent-service')) {
    assert.match(url, /\/(?:tree|blob)\/feature\/baijun(?:\/|$)/, `Wrong platform branch: ${url}`);
  }
}
for (const project of Object.values(projects)) {
  assert.ok(existsSync(resolve(root, project.architecture.image)), 'Missing architecture diagram');
}
for (const [, reference] of read('project-details.css').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  assert.ok(existsSync(resolve(root, reference)), `Missing detail asset: ${reference}`);
}
const lazyBytes = ['project-details.js','project-data.js','project-diagrams.js','project-details.css','assets/bai-details.woff2','assets/platform-architecture.svg','assets/review-architecture.svg']
  .reduce((total,file) => total + statSync(resolve(root,file)).size,0);
assert.ok(lazyBytes < 150_000, `Project details exceed 150 KB budget: ${lazyBytes}`);
console.log(`Project detail resources: ${(lazyBytes / 1024).toFixed(1)} KiB, loaded on demand.`);
