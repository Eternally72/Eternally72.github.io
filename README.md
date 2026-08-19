# 白俊的个人主页

这是白俊的 GitHub Pages 个人主页。页面以客观介绍为主线，呈现个人身份、能力方向与工程实践；自动代码审查系统作为唯一代表项目，用于说明相关能力与阶段成果。

主页使用原生 HTML、CSS 和少量 JavaScript 实现，不依赖框架、构建工具、外部字体或图片资源。

## 页面内容

- 首屏：个人身份、技术兴趣与当前状态
- 个人简介：学习背景、技术取向与实践方式
- 能力方向：AI Agent、后端开发与 AI Infrastructure
- 代表项目：自动代码审查系统、能力体现与阶段成果
- 联系方式：邮箱与 GitHub

## 设计原则

- 先介绍个人身份，再说明能力方向，最后用项目提供证据
- 全部介绍采用客观第三视角，避免对话式表达和产品说明书式叙事
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

冒烟测试会检查第三视角叙事、唯一代表项目、阶段成果、本地链接、页面锚点、静态资源、响应式样式约束，以及“零图片”要求。

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
