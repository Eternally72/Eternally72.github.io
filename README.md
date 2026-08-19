# 白俊的个人主页

这是白俊的 GitHub Pages 个人主页。页面以个人介绍为主线，呈现我的身份、关注方向与做事方式；自动代码审查系统作为唯一的代表作品，用来说明我正在建立的工程能力。

主页使用原生 HTML、CSS 和少量 JavaScript 实现，不依赖框架、构建工具、外部字体或图片资源。

## 页面内容

- 首屏：个人身份、技术兴趣与当前状态
- 关于我：学习背景、思考方式与个人偏好
- 我的方向：AI Agent、后端开发与 AI Infrastructure
- 代表作品：自动代码审查系统，以及它所体现的能力
- 联系我：邮箱与 GitHub

## 设计原则

- 先介绍人，再介绍能力，最后用项目提供证据
- 使用自然、克制的第一人称表达，避免产品说明书式叙事
- 网格、字标、轨道与卡片均由 HTML、CSS 和内联 SVG 渲染
- 不使用图片、外部字体或第三方前端依赖
- 动画使用 transform / opacity，并支持 `prefers-reduced-motion`
- 指针光效与轻量 3D 倾斜只在精细指针设备上启用

## 本地预览

可以直接打开 `index.html`，也可以启动静态服务器：

```bash
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。

## 本地检查

```bash
node tests/site-smoke.mjs
node --check script.js
```

冒烟测试会检查个人叙事层级、唯一代表作品、本地链接、页面锚点、静态资源、响应式样式约束，以及“零图片”要求。

## 修改内容

- 首页文案和结构：`index.html`
- 首页视觉和响应式布局：`system.css`
- 导航、滚动显现、指针光效：`script.js`
- 联系邮箱：在 `index.html` 中替换 `charon2879@gmail.com`

## 目录结构

```text
.
├── index.html
├── system.css
├── script.js
├── README.md
└── tests/
    └── site-smoke.mjs
```

## 部署到 GitHub Pages

1. 将变更推送到 `main` 分支。
2. 打开仓库的 **Settings > Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择 `main` 和 `/(root)`，保存后等待部署完成。
