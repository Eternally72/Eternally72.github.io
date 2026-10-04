# 白俊的个人主页

面向 GitHub Pages 的静态个人网站，展示个人背景、工程能力，以及两个代表项目：多租户 Agent 平台和基于 Skills / Docker 沙箱的自动代码审查 Agent。

## 本地预览

```bash
python3 -m http.server 4173
```

打开 http://localhost:4173。也可以直接打开 `index.html`；复制邮箱功能需要 HTTPS 或 localhost，其他内容不依赖 JavaScript。

## 页面与内容

- `index.html`：个人信息、项目介绍、架构示意、教育与科研经历、联系方式。
- `system.css`：配色、字体、响应式布局、首屏入场和悬停反馈的唯一编辑源；同步到 HTML 内联样式后发布。
- `script.js`：移动导航、当前章节提示、复制邮箱、页脚年份，以及项目详情的按需加载与弹窗管理。
- `particles.js`：首屏分层图周围的轻量粒子、暂停控制与动画生命周期管理。
- `project-data.js`：两个项目的组件说明、时序说明、验证数据及源码链接。
- `project-details.js` / `project-details.css`：详情标签页、可点击的架构图、组件说明和验证结果展示。
- `project-diagrams.js`：预先生成的 SVG 时序图，不依赖图表库。
- `assets/`：本地图标、经过字符裁剪的 Noto Sans SC 可变字体及 SIL 许可。
- `tests/`：静态资源检查、可选的真实浏览器测试。
- `dev/`：本地参考资料，继续由 `.gitignore` 忽略，不参与发布。

项目资料来自本地源码与文档，个人背景参考简历。多租户 Agent 平台的源码、文档和测试记录均链接到 `feature/baijun` 分支。代码审查项目 PR #164 的合并状态已于 2026-10-02 核对。平台的 4,028 次请求与 18 项可靠性场景来自 2026-09 历史测试记录；页面注明模拟 / 真实模型请求以及单机压测条件。项目中的界面图为流程示意。

修改介绍和链接时直接编辑 HTML。修改 `system.css` 后运行 `node scripts/sync-styles.mjs`，将样式同步到 HTML；静态检查会阻止两者不一致。仓库提交了完整可发布文件，GitHub Pages 无需构建。新增中文字符如果不在字体子集中，会回退到访客的系统字体；大幅修改内容时可重新裁剪 Noto Sans SC。保留 `assets/OFL.txt`。

## 项目详情

每个项目有“架构设计、执行时序、验证结果”三个入口。点击后打开原生 dialog，桌面为居中弹窗，手机为全屏详情。架构节点可查看职责和源码，时序页可展开异常处理说明，验证页展示测试条件与记录入口。

- 详情模块、样式和补充字体首次打开时才请求，后续打开复用已加载资源。
- 没有 JavaScript、浏览器不支持 dialog 或使用 Ctrl / Command 点击时，入口直接打开对应 GitHub 文档。
- 加载失败时显示文档入口；加载过程中关闭弹窗不会被异步响应重新打开。
- 支持 Escape 关闭、点击遮罩关闭、焦点循环与返回入口；标签页支持方向键、Home、End。
- 关闭后保留首页阅读位置，长图仅在图表区域内横向滚动。手机架构图适应宽度，组件说明位于图下方。
- 多租户平台的所有源码与记录入口固定使用 `feature/baijun` 分支。

详情中的结果为项目历史验证记录，不是访问主页时重新执行的测试。维护数字时同时更新样本条件与证据来源。

## 性能与可访问性

原生 HTML、CSS、JavaScript，无框架、运行时第三方请求、外部字体服务或大型图片。主视觉用内联 SVG，章节导航通过 IntersectionObserver 更新。

首页样式直接包含在 HTML 中，避免外部样式请求一直挂起时浏览器整页白屏。字体使用系统回退，正文不依赖脚本、字体下载或入场动画结束才显示。首屏动画只改变位置，不将文字设为透明。项目详情样式仍按需加载。

粒子只在首屏分层图周围缓慢流动：宽屏 24 个，窄屏 15 个，Canvas 绘制最多 30 fps，像素密度上限 1.5。鼠标靠近时轻微避让；触屏不追踪手势。离开可视区域、标签页隐藏或打开项目弹窗时取消动画帧，返回后继续。右下角按钮可暂停并记住偏好；系统开启“减少动态效果”时隐藏粒子及控制按钮。不引入粒子库、全屏画布或模糊滤镜。

支持 320px 起的布局、键盘焦点、跳转到正文、减少动态效果偏好、无 JavaScript 阅读及导航。邮箱链接一直可用，复制按钮仅在支持剪贴板的安全上下文出现。

## 检查

基础检查仅需 Node.js：

```bash
node tests/site-smoke.mjs
node scripts/sync-styles.mjs --check
node --check script.js
node --check particles.js
git diff --check
```

浏览器检查为可选开发工具，需要 Python、Playwright 与 Chromium。使用 uv 可以在临时环境中运行：

```bash
uv run --with playwright python -m playwright install chromium
uv run --with playwright python tests/browser-check.py --screenshots /tmp/person-page-preview
uv run --with playwright python tests/render-check.py
uv run --with playwright python tests/render-check.py --url https://eternally72.github.io/
```

测试会启动并关闭临时 HTTP 服务，检查 9 种首页屏幕宽度、导航与 Escape 交互、复制成功 / 失败、减少动态效果、无 JavaScript 回退、资源加载与浏览器错误；也覆盖六个详情入口、全部架构节点、标签页键盘切换、弹窗焦点和滚动恢复、手机布局、按需加载、慢请求切换及加载失败回退。粒子检查涵盖绘制帧率、暂停偏好保存、离屏 / 页面隐藏 / 弹窗打开时停止调度，以及动态切换系统动效偏好。截图输出到指定目录，不写入站点。

`render-check.py` 检查真正的首次内容绘制，而非只判断 DOM 存在。覆盖样式请求挂起、全部子资源挂起，以及入场动画停在起点的场景；`--url` 可对线上部署执行相同检查。

## 发布

将网站文件提交并推送到 GitHub Pages 仓库。在仓库 Settings → Pages 中选择对应分支及根目录即可，无需构建工作流。发布时不要复制 `dev/` 或本地测试工具到公开资源中。
