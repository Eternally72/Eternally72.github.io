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

for (const sectionId of ["home", "about", "approach", "work", "contact"]) {
  assert.match(homepage, new RegExp(`id=["']${sectionId}["']`), `homepage: missing #${sectionId}`);
}

assert.match(homepage, /<body\s+class=["']personal-page["']>/, "homepage: personal page theme is missing");
assert.match(homepage, /<title>白俊[^<]*<\/title>/, "homepage: title is not person-first");
assert.match(
  homepage,
  /name=["']description["'][^>]*content=["'][^"']*白俊的个人主页/,
  "homepage: description is not person-first"
);
assert.match(homepage, /<h1[^>]*>\s*白俊/, "homepage: subject name is missing from h1");
assert.match(homepage, /白俊是一名计算机科学学生/, "homepage: third-person identity is missing");
assert.match(homepage, /计算机科学/, "homepage: education identity is missing");
assert.match(homepage, /AI Agent/, "homepage: AI Agent focus is missing");
assert.match(homepage, /后端开发/, "homepage: backend focus is missing");
assert.match(homepage, /AI Infrastructure/, "homepage: AI infrastructure focus is missing");
assert.match(homepage, /自动代码审查/, "homepage: missing featured project");
assert.match(homepage, /阶段成果/, "homepage: featured project results are missing");
assert.match(homepage, /开发中/, "homepage: project status is missing");
const bodyMarkup = homepage.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
assert.ok(bodyMarkup, "homepage: body content is missing");

const namedHtmlEntities = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["lt", "<"],
  ["nbsp", " "],
  ["quot", '"'],
]);
const decodeHtmlEntities = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, value) => {
    if (value.toLowerCase().startsWith("#x")) {
      return String.fromCodePoint(parseInt(value.slice(2), 16));
    }
    if (value.startsWith("#")) return String.fromCodePoint(parseInt(value.slice(1), 10));
    return namedHtmlEntities.get(value.toLowerCase()) ?? entity;
  });
assert.equal(
  decodeHtmlEntities("&#X6211;"),
  "我",
  "homepage test: uppercase hexadecimal HTML entity decoding failed"
);
const bodyNarrativeText = decodeHtmlEntities(
  bodyMarkup
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
);
const normalizeNarrativeWord = (word) =>
  word.toLowerCase().replace(/[’‘]/g, "'");
assert.equal(
  normalizeNarrativeWord("I’m"),
  "i'm",
  "homepage test: typographic apostrophe normalization failed"
);
const narrativeWords = [
  ...new Intl.Segmenter("zh-CN", { granularity: "word" }).segment(bodyNarrativeText),
]
  .filter(({ isWordLike }) => isWordLike)
  .map(({ segment }) => normalizeNarrativeWord(segment));
const conversationalPronouns = new Set([
  "i", "i'd", "i'll", "i'm", "i've", "me", "mine", "my", "myself",
  "our", "ours", "ourselves", "us", "we", "we'd", "we'll", "we're", "we've",
  "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "let's",
  "我", "我的", "我们", "我们的", "本人",
  "你", "你的", "你们", "你们的", "你好",
  "您", "您的", "您好",
  "咱", "咱的", "咱俩", "咱们", "咱们的",
]);
const narrationViolations = [
  ...new Set(narrativeWords.filter((word) => conversationalPronouns.has(word))),
];
assert.deepEqual(
  narrationViolations,
  [],
  `homepage: conversational narration remains (${narrationViolations.join(", ")})`
);
assert.equal(
  (homepage.match(/data-featured-work/g) || []).length,
  1,
  "homepage: expected exactly one featured project"
);
assert.ok(
  homepage.indexOf('id="about"') < homepage.indexOf("data-featured-work"),
  "homepage: personal introduction must appear before the featured project"
);
assert.doesNotMatch(
  homepage,
  /System Overview|Review Pipeline|System Architecture/,
  "homepage: product landing-page narrative remains"
);
assert.doesNotMatch(
  homepage,
  /<blockquote\b/i,
  "homepage: unverified first-person quotation remains"
);
const navToggleTag = homepage.match(/<button\s[^>]*data-nav-toggle[^>]*>/i)?.[0];
assert.ok(navToggleTag, "homepage: navigation toggle is missing");
const controlledNavigationId = navToggleTag.match(/aria-controls=["']([^"']+)["']/i)?.[1];
assert.ok(controlledNavigationId, "homepage: navigation toggle is missing aria-controls");
assert.match(
  homepage,
  new RegExp(`id=["']${controlledNavigationId}["']`),
  "homepage: aria-controls target is missing"
);
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
const customProperties = [
  ...homepageCss.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim),
].map((match) => match[1]);

for (const customProperty of customProperties) {
  assert.match(
    homepageCss,
    new RegExp(`var\\(${customProperty}(?:[,\\)])`),
    `system.css: unused custom property ${customProperty}`
  );
}
assert.doesNotMatch(
  homepageCss,
  /url\s*\(/i,
  "system.css: image or external asset URL remains"
);
assert.match(
  homepageCss,
  /@media\s*\(max-width:\s*820px\)/,
  "system.css: tablet breakpoint is missing"
);
assert.match(
  homepageCss,
  /@media\s*\(max-width:\s*560px\)/,
  "system.css: mobile breakpoint is missing"
);
assert.match(
  homepageCss,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
  "system.css: reduced-motion fallback is missing"
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
