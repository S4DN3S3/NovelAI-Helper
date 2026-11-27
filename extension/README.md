# NovelAI Helper

NovelAI 绘图页的本地增强扩展：界面汉化、标签联想、提示词增强与历史管理。

- 版本：1.3
- 作者：Hayasakai
- 许可：MIT
- 支持：Chrome / Edge（Chromium 105+）

## 安装

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本目录（包含 `manifest.json`）。
4. 打开或刷新 <https://novelai.net/image>。

若加载时提示「不是 UTF-8 编码格式」，请先在 `chrome://extensions` 彻底移除旧的失败条目，再重新加载本目录。本包已剔除所有 Chrome 拒绝的非字符（中文以正常 UTF-8 输出），并通过 `node tools/verify-extension.mjs` 与 Chrome 实际加载验证。

## 功能

- 页面界面汉化，`Alt + Shift + C` 切换。
- 标签联想：类型、词条、翻译、热度四列展示，中文译名来自 Danbooru 云端词库。
- 标签操作：方向键切换词条；右键收藏或排除；`Ctrl` + 左键单击词条打开 Danbooru 页面。
- 标签浮层：可拖动标题栏移动，可拖拽右下角自由缩放（字号与卡片尺寸随之等比联动），也可一键最大化/还原；支持列表/卡片视图切换；列数与候选数量随窗口自动调整，尺寸、位置、视图和最大化状态会记住并在刷新后恢复。
- 标签详情面板：浮层头部「详情面板」开关控制，开启后紧贴浮层右侧显示，宽度为浮层的一半、高度与浮层一致、顶底对齐，位置随浮层拖动/缩放同步；简介区拉伸填满面板，操作按钮按内容宽度居中收拢不占整行；展示当前标签详情（翻译、分类、数量、说明，可插入/复制/百科），移向面板点按钮时详情不会被途经的其他卡片替换，关闭后隐藏；开关状态会记住。
- 提示词增强：权重快捷调整、自动格式化、收藏/排除标签。
- 原生提示词分类配色：通用、画师、作品、角色、元标签。
- 历史管理：生成图片保存在浏览器 IndexedDB，可复制、导出 ZIP、画廊查看。
- 弹窗主题跟随 NovelAI 自定义主题。

## 权限说明

- `storage`：保存汉化开关、分类缓存和扩展设置。
- `danbooru.donmai.us`、`gelbooru.com`：标签联想与分类补全。
- `raw.githubusercontent.com`、`cdn.jsdelivr.net`：下载 Danbooru 中文词库。

所有历史图片与提示词数据只保存在本机浏览器，不会上传到第三方服务器。

## 开发

在仓库根目录运行：

```powershell
node tools/build-extension.mjs
node tools/build-userscript.mjs
```

生成 `extension/content/*`、`extension/background.js` 与油猴脚本。第三方组件与许可信息见 `THIRD_PARTY_NOTICES.md`。
