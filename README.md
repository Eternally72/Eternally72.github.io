# 白俊的个人主页

这是一个纯静态个人主页项目，使用 HTML、CSS 和少量 JavaScript 编写。项目不需要 npm、框架、后端或构建工具，可以直接部署到 GitHub Pages。

## 本地预览

### 方法一：直接打开

双击根目录中的 `index.html`，浏览器会直接打开主页。四个项目详情页也可以正常访问。

### 方法二：VS Code Live Server

1. 使用 VS Code 打开项目目录。
2. 安装 Live Server 扩展。
3. 右键 `index.html`，选择 **Open with Live Server**。

## 部署到 GitHub Pages

1. 在 GitHub 创建一个新仓库，并将本项目全部文件上传到仓库根目录。
2. 打开仓库的 **Settings > Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择 `main` 分支和 `/(root)` 目录，然后保存。
5. 等待 GitHub 完成部署，Pages 页面会显示公开访问地址。

本项目使用相对路径，因此放在用户主页仓库或普通项目仓库中都可以工作。

## 修改内容

- 个人信息：编辑根目录的 `index.html`，搜索“白俊”、身份描述或邮箱。
- 项目内容：编辑 `index.html` 中的项目卡片，以及 `projects/` 下对应项目的 `index.html`。
- GitHub 链接：替换首页 GitHub 卡片的 `href="#"`，并删除 `data-placeholder-link` 属性。
- 简历链接：将简历文件放入 `assets/`，例如 `assets/resume.pdf`，再替换 Resume 卡片的 `href` 并删除 `data-placeholder-link`。
- 主题颜色：编辑 `style.css` 顶部 `:root` 中的颜色变量。
- Hero 图片：使用新的图片替换 `assets/hero-abstract.webp`，建议保持宽幅比例。

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
