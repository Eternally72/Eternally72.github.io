# 白俊的个人主页

面向 GitHub Pages 的静态个人网站。首页展示简介与项目入口，项目列表、三个项目详情和个人背景分别独立成页。

## 页面

| 页面 | 内容 |
| --- | --- |
| `index.html` | 简介、分层主视觉、轻量粒子与三个项目入口 |
| `projects.html` | mem-plugin、多租户 Agent 平台与自动代码审查 Agent 的概览 |
| `memory.html` | 记忆服务架构、L0–L3 层级、混合检索、生命周期及验证边界 |
| `platform.html` | 原有平台介绍、架构示意、历史测试与交互详情 |
| `review.html` | 原有代码审查介绍、开源合并记录与交互详情 |
| `about.html` | 原有教育背景、科研参与、技术栈及联系方式 |

本次只新增 mem-plugin，依据本地 v1.0.0（2026-11-12）的源码与文档整理。该仓库目前为私有，页面不提供不可访问的源码入口。关于中文小语料、结构化过滤和租户隔离的集成验证与尚待完成的语义效果及大数据性能评测分开说明。

多租户平台的全部源码与记录链接继续固定到 `feature/baijun`。4,028 次请求与 18 项可靠性场景保留为 2026-09 历史记录，不作为当前重新执行的测试结果。代码审查 PR #164 和原有个人、科研资料保持原有口径。

## 编辑与预览

正文源文件在 `site/`；导航、页脚、元信息和内联样式由 `scripts/build-site.mjs` 统一生成。修改正文、共享导航或 `system.css` 后运行：

```bash
node scripts/build-site.mjs
python3 -m http.server 4173
```

打开 http://localhost:4173。生成的六个 HTML 已纳入版本控制，GitHub Pages 无需安装依赖或执行构建。`scripts/sync-styles.mjs` 保留为兼容入口。

- `script.js`：移动导航、复制邮箱、年份及项目详情弹窗管理。
- `particles.js`：仅首页加载的轻量粒子与暂停管理。
- `project-data.js`：原有两个项目的架构、时序与历史验证说明。
- `project-details.js` / `project-details.css` / `project-diagrams.js`：打开详情时才加载的交互、样式与预制 SVG。
- `assets/`：字体、图标和原有架构图；字体遵循 SIL OFL，保留 `assets/OFL.txt`。
- `dev/`：被 Git 忽略的本地参考资料，不参与发布。

字体已覆盖本次六个页面及弹窗使用的中文。增加字符时需要补齐字体子集，否则回退到访客的系统字体。

## 性能与可访问性

使用普通静态链接，每个页面可以直接访问和刷新，无需 JavaScript 路由。正文、图示和导航在禁用脚本时仍可阅读。所有页面均内联样式，避免外部样式请求挂起时阻止首次绘制；首屏文字不依赖入场动画结束才能显示。

粒子只在首页主视觉周围运行，窄屏减少数量，绘制上限 30 fps、像素密度上限 1.5。离屏、标签页隐藏时停止，支持暂停、保存偏好和系统减少动态效果设置。其他页面不加载粒子脚本。

原有两项目保留按需加载的原生 dialog：键盘标签切换、焦点循环、Escape / 遮罩关闭及关闭后焦点恢复；加载失败或禁用脚本时仍可打开对应 GitHub 文档。记忆服务使用原生 details 展开补充说明，页内目录适配手机。

## 检查

```bash
node scripts/build-site.mjs --check
node tests/site-smoke.mjs
node --check script.js
node --check particles.js
git diff --check
```

可选真实浏览器检查需要 Python、Playwright 与 Chromium：

```bash
uv run --with playwright python -m playwright install chromium
uv run --with playwright python tests/browser-check.py --screenshots /tmp/person-page-preview
uv run --with playwright python tests/render-check.py
```

静态检查覆盖六页资源、链接、跨页锚点、ARIA、分支链接、内容范围和单页资源预算。浏览器检查覆盖六页直接访问与刷新、320–1920px 布局、跨页导航、移动菜单、无脚本阅读、粒子暂停及原有弹窗交互。首次绘制检查覆盖资源挂起和暂停动画，避免只判断 DOM 存在而漏掉白屏。

发布后可追加 `--url https://eternally72.github.io/` 对线上版本运行相同检查。将生成后的文件推送到 GitHub Pages 对应分支即可发布。
