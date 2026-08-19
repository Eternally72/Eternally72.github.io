# 白俊的个人主页

这是一个以「自动代码审查」为核心主题的个人主页，介绍白俊在 AI Agent、后端开发与 AI 基础设施方向的实践。项目使用 HTML、CSS 和少量 JavaScript 编写，不依赖 npm、框架、后端或构建工具，可以直接部署到 GitHub Pages。

## 页面内容

- 首页首屏：个人定位与自动代码审查概念界面
- 关于：学习方向、工程理念与关注领域
- 核心项目：自动代码审查的目标、流程与设计重点
- 精选作品：LiveGuard、AIWerewolf、Campus Multi-Agent 与 Microservice Trading
- 联系方式：邮箱与 GitHub

## 本地预览

### 方法一：直接打开

双击根目录中的 `index.html`，浏览器会直接打开主页。四个项目详情页也可以正常访问。

### 方法二：VS Code Live Server

1. 使用 VS Code 打开项目目录。
2. 安装 Live Server 扩展。
3. 右键 `index.html`，选择 **Open with Live Server**。

## 本地检查

```bash
node tests/site-smoke.mjs
node --check script.js
```

冒烟测试会检查所有 HTML 页面中的本地链接、静态资源、锚点、基础文档信息与首页关键区块。

## 部署到 GitHub Pages

1. 在 GitHub 创建一个新仓库，并将本项目全部文件上传到仓库根目录。
2. 打开仓库的 **Settings > Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择 `main` 分支和 `/(root)` 目录，然后保存。
5. 等待 GitHub 完成部署，Pages 页面会显示公开访问地址。

本项目使用相对路径，因此放在用户主页仓库或普通项目仓库中都可以工作。

## 修改内容

- 个人信息：编辑根目录的 `index.html`，搜索“白俊”、身份描述或邮箱。
- 核心项目：编辑 `index.html` 中 `#focus` 区块；项目公开后可在此补充源码和演示地址。
- 项目内容：编辑 `index.html` 中的项目卡片，以及 `projects/` 下对应项目的 `index.html`。
- GitHub 链接：首页当前指向 `https://github.com/eternally72`，可直接修改对应联系方式卡片的 `href`。
- 联系邮箱：当前使用 GitHub 资料中的 `charon2879@gmail.com`，可在 `index.html` 中统一替换。
- 主题颜色：编辑 `style.css` 顶部 `:root` 中的颜色变量。
- 项目详情页背景：使用新的图片替换 `assets/hero-abstract.webp`，建议保持宽幅比例。

## 目录结构

```text
.
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── hero-abstract.png
│   ├── hero-abstract.webp
│   └── README.md
└── projects/
    ├── ai-werewolf/index.html
    ├── liveguard/index.html
    ├── campus-agent/index.html
    └── microservice-trading/index.html
```
