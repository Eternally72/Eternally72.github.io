import { readFileSync, writeFileSync } from 'node:fs';

export const pages = [
  { file: 'index.html', source: 'home', title: '白俊 Bai Jun · AI Agent 与后端开发', description: '白俊的个人主页，北京交通大学本科生，关注 AI Agent、后端工程与持久化记忆。', section: 'home' },
  { file: 'projects.html', source: 'projects', title: '项目 · 白俊', description: '多租户 Agent 平台、自动代码审查 Agent 与 mem-plugin 记忆服务。', section: 'projects' },
  { file: 'platform.html', source: 'platform', title: '多租户 Agent 平台 · 白俊', description: '多租户隔离、IM 接入、无状态 Worker 与故障恢复的实现及验证。', section: 'projects', dialog: true },
  { file: 'review.html', source: 'review', title: '自动代码审查 Agent · 白俊', description: 'tRPC-Agent-Python 中结合 Skills、权限检查与 Docker 沙箱的代码审查示例。', section: 'projects', dialog: true },
  { file: 'memory.html', source: 'memory', title: 'mem-plugin 记忆服务 · 白俊', description: '面向 Personal Agent 的持久化记忆服务：MCP 接入、分层记忆、混合检索与来源追溯。', section: 'projects' },
  { file: 'about.html', source: 'about', title: '关于我 · 白俊', description: '白俊的教育背景、科研参与、技术栈与联系方式。', section: 'about' }
];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('system.css').trimEnd();
const brand = '<span class="brand-mark" aria-hidden="true">b.</span><span>白俊 <span class="brand-en">Bai Jun</span></span>';
const navigation = [['home', 'index.html', '首页'], ['projects', 'projects.html', '项目'], ['about', 'about.html', '关于我']];
for (const page of pages) {
  const canonical = `https://eternally72.github.io/${page.file === 'index.html' ? '' : page.file}`;
  const nav = navigation.map(([section, file, label]) => `<a href="${file}"${section === page.section ? ` aria-current="${file === page.file ? 'page' : 'location'}"` : ''}>${label}</a>`).join('');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${page.description}">
  <meta name="author" content="白俊">
  <meta name="theme-color" content="#f8fafc">
  <meta name="color-scheme" content="light">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/bai-sans.woff2" as="font" type="font/woff2" crossorigin>
  <!-- homepage styles:start -->
  <style id="homepage-styles">
${css}
  </style>
  <!-- homepage styles:end -->
  <script src="script.js" defer></script>
${page.source === 'home' ? '  <script src="particles.js" defer></script>' : ''}
  <title>${page.title}</title>
</head>
<body data-page="${page.source}">
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header">
    <nav class="nav wrap" aria-label="主导航">
      <a class="brand" href="index.html" aria-label="白俊，返回首页">${brand}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="打开导航菜单" hidden><span></span><span></span></button>
      <div class="nav-links" id="nav-links">${nav}<a class="nav-contact" href="about.html#contact">联系我</a></div>
    </nav>
  </header>
  <main id="main" tabindex="-1">
${read(`site/${page.source}.html`).trimEnd()}
  </main>
  <footer class="footer wrap"><a class="brand footer-brand" href="index.html">${brand}</a><p>北京交通大学 · 计算机科学与技术</p><span>© <span data-year>2026</span> Bai Jun</span><a class="back-top" href="#main" aria-label="返回顶部">↑</a></footer>
${page.dialog ? read('site/dialog.html').trimEnd() : ''}
</body>
</html>
`;
  if (process.argv.includes('--check')) {
    if (read(page.file) !== html) {
      console.error(`${page.file} needs rebuilding: node scripts/build-site.mjs`);
      process.exitCode = 1;
    }
  } else {
    writeFileSync(new URL(`../${page.file}`, import.meta.url), html);
  }
}
