# Assets

此目录用于存放主页使用的本地静态资源。

- `hero-abstract.webp`：首页和项目详情页实际加载的优化版背景图，不依赖外部图片服务。
- `hero-abstract.png`：保留的高质量源图，方便后续重新压缩或裁切。
- 如需替换 Hero 视觉，建议使用约 16:9 的宽幅图片并更新 `style.css` 中的文件名。
- 如需添加简历，可以把 PDF 文件放在此目录，并在首页更新 Resume 链接。

项目专属图片放在各项目自己的 `projects/<project>/assets/` 目录中。根目录 `assets/` 只保存首页或多个页面共用的资源。
