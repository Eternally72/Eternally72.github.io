// Keep a single CSS source while shipping a homepage that can paint without asset requests.
import { readFileSync, writeFileSync } from 'node:fs';

const htmlPath = new URL('../index.html', import.meta.url);
const css = readFileSync(new URL('../system.css', import.meta.url), 'utf8').trimEnd();
const html = readFileSync(htmlPath, 'utf8');
const start = '  <!-- homepage styles:start -->';
const end = '  <!-- homepage styles:end -->';
const startIndex = html.indexOf(start);
const endIndex = html.indexOf(end);
if (startIndex < 0 || endIndex < startIndex) throw new Error('Missing homepage style markers');
const updated = html.slice(0, startIndex)
  + `${start}\n  <style id="homepage-styles">\n${css}\n  </style>\n${end}`
  + html.slice(endIndex + end.length);

if (process.argv.includes('--check')) {
  if (updated !== html) {
    console.error('Homepage styles are stale. Run: node scripts/sync-styles.mjs');
    process.exitCode = 1;
  }
} else {
  writeFileSync(htmlPath, updated);
}
