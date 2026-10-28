# NovelAI Helper

NovelAI 绘图页的本地增强扩展：界面汉化、标签联想、Danbooru 分类配色、提示词增强与历史管理。

- 版本：1.05
- 作者：Hayasakai
- 许可：MIT
- 支持：Chrome / Edge（Chromium 105+）

## 安装

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本目录（包含 `manifest.json` 的目录）。
4. 打开或刷新 <https://novelai.net/image>。

## 功能

- 页面界面汉化，`Alt + Shift + C` 切换。
- 标签联想：Danbooru / Gelbooru 在线补全，中文翻译来自 Danbooru 云端词库。
- 原生提示词分类配色：通用、画师、作品、角色、元标签。
- 收藏 / 排除标签，支持权重和画师前缀。
- 历史管理：生成图片保存在浏览器 IndexedDB，可复制、导出 ZIP、画廊查看。
- 弹窗主题跟随 NovelAI 自定义主题。

## 权限说明

- `storage`：保存汉化开关、分类缓存和扩展设置。
- `danbooru.donmai.us`、`gelbooru.com`：标签联想与分类补全。
- `raw.githubusercontent.com`、`cdn.jsdelivr.net`：下载 Danbooru 中文词库。

所有历史图片与提示词数据只保存在本机浏览器，不会上传到第三方服务器。

## 开发

```powershell
node tools/build-extension.mjs
```

生成 `extension/content/*`、`extension/background.js`。修改 `src/` 后重新构建，再在扩展管理页点击「重新加载」。

第三方组件与许可信息见 `THIRD_PARTY_NOTICES.md`。
