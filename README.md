# 白俊的个人主页

面向 GitHub Pages 的静态个人网站，展示个人背景、工程能力，以及两个代表项目：多租户 Agent 平台和基于 Skills / Docker 沙箱的自动代码审查 Agent。

## 本地预览

```bash
python3 -m http.server 4173
```

打开 http://localhost:4173。也可以直接打开 `index.html`；复制邮箱功能需要 HTTPS 或 localhost，其他内容不依赖 JavaScript。

## 页面与内容

- `index.html`：个人信息、项目介绍、架构示意、教育与科研经历、联系方式。
- `system.css`：配色、字体、响应式布局、首屏入场和悬停反馈。
- `script.js`：移动导航、当前章节提示、复制邮箱和页脚年份。
- `assets/`：本地图标、经过字符裁剪的 Noto Sans SC 可变字体及 SIL 许可。
- `tests/`：静态资源检查、可选的真实浏览器测试。
- `dev/`：本地参考资料，继续由 `.gitignore` 忽略，不参与发布。

项目资料来自本地源码与文档，个人背景参考简历。多租户 Agent 平台的源码、文档和测试记录均链接到 `feature/baijun` 分支。代码审查项目 PR #164 的合并状态已于 2026-10-02 核对。平台的 4,028 次请求与 18 项可靠性场景来自 2026-09 历史测试记录；页面注明模拟 / 真实模型请求以及单机压测条件。项目中的界面图为流程示意。

修改介绍和链接时直接编辑 HTML，不需要构建。新增中文字符如果不在字体子集中，会回退到访客的系统字体；大幅修改内容时可重新裁剪 Noto Sans SC。保留 `assets/OFL.txt`。

## 性能与可访问性

原生 HTML、CSS、JavaScript，无框架、运行时第三方请求、外部字体服务或大型图片。主视觉用内联 SVG，只有一次首屏入场和鼠标悬停响应，没有持续动画或逐帧滚动逻辑。章节导航通过 IntersectionObserver 更新。

支持 320px 起的布局、键盘焦点、跳转到正文、减少动态效果偏好、无 JavaScript 阅读及导航。邮箱链接一直可用，复制按钮仅在支持剪贴板的安全上下文出现。

## 检查

基础检查仅需 Node.js：

```bash
node tests/site-smoke.mjs
node --check script.js
git diff --check
```

浏览器检查为可选开发工具，需要 Python、Playwright 与 Chromium。使用 uv 可以在临时环境中运行：

```bash
uv run --with playwright python -m playwright install chromium
uv run --with playwright python tests/browser-check.py --screenshots /tmp/person-page-preview
```

测试会启动并关闭临时 HTTP 服务，检查 9 种屏幕宽度、导航与 Escape 交互、复制成功 / 失败、减少动态效果、无 JavaScript 回退、资源加载与浏览器错误。截图输出到指定目录，不写入站点。

## 发布

将网站文件提交并推送到 GitHub Pages 仓库。在仓库 Settings → Pages 中选择对应分支及根目录即可，无需构建工作流。发布时不要复制 `dev/` 或本地测试工具到公开资源中。
