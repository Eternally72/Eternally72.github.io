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

const allFiles = walk(root);
const htmlFiles = allFiles.filter((path) => extname(path) === ".html");
assert.equal(htmlFiles.length, 1, "expected the homepage to be the only HTML page");

for (const legacyPath of ["projects", "assets", "style.css"]) {
  assert.equal(
    existsSync(join(root, legacyPath)),
    false,
    `legacy path remains: ${legacyPath}`
  );
}

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

const homepage = pages.find(
  ({ htmlFile }) => htmlFile === join(root, "index.html")
)?.html;
assert.ok(homepage, "homepage: index.html was not discovered");

for (const sectionId of ["home", "about", "focus", "projects", "contact"]) {
  assert.match(homepage, new RegExp(`id=["']${sectionId}["']`), `homepage: missing #${sectionId}`);
}

assert.match(homepage, /自动代码审查/, "homepage: missing featured project");
assert.match(homepage, /href=["']https:\/\/github\.com\/Eternally72["']/, "homepage: missing GitHub link");
assert.doesNotMatch(homepage, /data-placeholder-link/, "homepage: placeholder link remains");
assert.doesNotMatch(
  homepage,
  /href=["'][^"']*projects\//,
  "homepage: legacy project link remains"
);
assert.doesNotMatch(
  homepage,
  /AIWerewolf|LiveGuard|Campus Multi-Agent|Microservice Trading/,
  "homepage: unrelated project content remains"
);
assert.doesNotMatch(homepage, /<img\b/i, "homepage: image element remains");
assert.doesNotMatch(
  homepage,
  /property=["']og:image["']/i,
  "homepage: social preview image remains"
);
assert.match(
  homepage,
  /href=["']system\.css["']/,
  "homepage: dedicated lightweight stylesheet is missing"
);

const cssFiles = allFiles.filter((path) => extname(path) === ".css");
const stylesheets = new Map(
  cssFiles.map((cssFile) => [cssFile, readFileSync(cssFile, "utf8")])
);

for (const cssFile of cssFiles) {
  const css = stylesheets.get(cssFile);
  const openingBraces = (css.match(/{/g) || []).length;
  const closingBraces = (css.match(/}/g) || []).length;
  const relativeName = cssFile.slice(root.length + 1);

  assert.equal(openingBraces, closingBraces, `${relativeName}: unbalanced braces`);
}

const homepageCss = stylesheets.get(join(root, "system.css"));
assert.ok(homepageCss, "system.css: stylesheet was not discovered");
assert.doesNotMatch(
  homepageCss,
  /url\s*\(/i,
  "system.css: image or external asset URL remains"
);

const homepageClassNames = [
  ...new Set(
    [...homepage.matchAll(/\sclass=["']([^"']+)["']/g)].flatMap((match) =>
      match[1].split(/\s+/).filter(Boolean)
    )
  ),
];

for (const className of homepageClassNames) {
  assert.ok(
    homepageCss.includes(`.${className}`),
    `system.css: missing homepage class .${className}`
  );
}

console.log("Site smoke test passed: 1 HTML page checked.");
