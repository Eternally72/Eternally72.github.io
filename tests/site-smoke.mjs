import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules"]);

const walk = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) return [];

    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const htmlFiles = walk(root).filter((path) => extname(path) === ".html");
assert.ok(htmlFiles.length >= 5, "expected the homepage and project detail pages");

const pages = htmlFiles.map((htmlFile) => ({
  html: readFileSync(htmlFile, "utf8"),
  htmlFile,
  relativeName: htmlFile.slice(root.length + 1),
}));
const pageIds = new Map();

for (const { html, htmlFile, relativeName } of pages) {
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);

  assert.match(html, /<html\s[^>]*lang=["']zh-CN["']/i, `${relativeName}: missing zh-CN language`);
  assert.match(html, /<meta\s[^>]*name=["']viewport["']/i, `${relativeName}: missing viewport meta`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${relativeName}: missing document title`);
  assert.match(html, /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/i, `${relativeName}: missing h1`);
  assert.equal(new Set(ids).size, ids.length, `${relativeName}: duplicate id attribute`);

  pageIds.set(htmlFile, new Set(ids));
}

for (const { html, htmlFile, relativeName } of pages) {
  const references = [
    ...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g),
  ].map((match) => match[1]);

  for (const reference of references) {
    if (
      reference.startsWith("http://") ||
      reference.startsWith("https://") ||
      reference.startsWith("mailto:") ||
      reference.startsWith("data:")
    ) {
      continue;
    }

    const [resourcePath, fragment] = reference.split("#");
    const targetFile = resourcePath
      ? resolve(dirname(htmlFile), resourcePath)
      : htmlFile;

    assert.ok(existsSync(targetFile), `${relativeName}: missing local resource ${reference}`);

    if (fragment && extname(targetFile) === ".html") {
      assert.ok(
        pageIds.get(targetFile)?.has(fragment),
        `${relativeName}: missing fragment target ${reference}`
      );
    }
  }
}

const homepage = readFileSync(join(root, "index.html"), "utf8");

for (const sectionId of ["home", "about", "focus", "projects", "contact"]) {
  assert.match(homepage, new RegExp(`id=["']${sectionId}["']`), `homepage: missing #${sectionId}`);
}

assert.match(homepage, /自动代码审查/, "homepage: missing featured project");
assert.match(homepage, /href=["']https:\/\/github\.com\/Eternally72["']/, "homepage: missing GitHub link");
assert.doesNotMatch(homepage, /data-placeholder-link/, "homepage: placeholder link remains");

const css = readFileSync(join(root, "style.css"), "utf8");
const openingBraces = (css.match(/{/g) || []).length;
const closingBraces = (css.match(/}/g) || []).length;
assert.equal(openingBraces, closingBraces, "style.css: unbalanced braces");

console.log(`Site smoke test passed: ${htmlFiles.length} HTML pages checked.`);
