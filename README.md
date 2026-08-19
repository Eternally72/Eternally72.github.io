# 自动代码审查系统主页

这是白俊的 GitHub Pages 主页，内容只围绕自动代码审查系统展开：介绍系统定位、审查流程、架构边界与设计原则。

主页使用原生 HTML、CSS 和少量 JavaScript 实现，不依赖框架、构建工具、外部字体或图片资源。

## 页面内容

- 首屏：系统定位与纯代码审查界面
- 系统概览：问题背景与三个核心目标
- 审查流程：从读取变更到交付反馈的设计链路
- 系统架构：输入、上下文、编排、推理与交付边界
- 联系方式：邮箱与 GitHub

## 性能设计

- 首页只加载 `index.html`、`system.css` 和 `script.js`
- 不使用 `<img>`、CSS 背景图片或社交分享图片
- 网格、连接线、代码界面与图标全部由 HTML、CSS 和内联 SVG 渲染
- 动画使用 CSS transform / opacity，并支持 `prefers-reduced-motion`
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

冒烟测试会检查页面标题、本地链接、锚点、静态资源，以及首页“单一系统、零图片”的约束。

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
