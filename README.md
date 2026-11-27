# NovelAI Helper

NovelAI 绘图页的本地增强工具，提供界面汉化、标签联想、提示词增强与生成历史管理。

- 版本：1.3
- 作者：Hayasakai
- 许可：MIT

## 两种使用方式

### 浏览器扩展

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启开发者模式。
3. 选择「加载已解压的扩展程序」，指向 `extension/` 目录。
4. 打开 <https://novelai.net/image>。

如果之前提示「无法为内容脚本加载文件 xxx.js，它不是 UTF-8 编码格式」：

- 根因是旧构建产物含有一个字面量 `U+FFFF` 字符（源码中的 `\uffff` 转义被压缩器还原成真实字符），Chrome 会拒绝这类非字符。现已从源头消除：该处改用 `String.fromCharCode(0xffff)`，构建期还会扫描全部产物，一旦出现非字符（`U+FFFF`/`U+FFFE`/代理项/`U+FDD0..U+FDEF`）立即中止构建。中文以正常 UTF-8 输出（体积更小），并经 Chrome 实际加载验证。
- 加载前可校验：`node tools/verify-extension.mjs extension`，输出「全部校验通过」即可加载。
- 若仍报错，先在扩展管理页把旧的 NovelAI 助手条目**彻底移除**（失败状态会残留），再重新选择 `extension/` 目录加载。

详细说明见 [`extension/README.md`](extension/README.md)。

### 油猴脚本

安装 Tampermonkey 或 Violentmonkey 后，安装 `userscript/NovelAI-Helper.user.js` 即可。

## 功能

- 界面汉化：`Alt + Shift + C` 切换中英文。
- 标签联想：按类型、词条、中文翻译、热度四列展示；支持 Danbooru / Gelbooru 补全与 Danbooru 云端中文词库；云端词库走 GitHub Raw / jsDelivr / HuggingFace 三源兜底，支持按别名检索。
- 标签操作：右键收藏或排除；方向键切换词条；`Ctrl` + 左键单击词条打开对应 Danbooru 页面。
- 浮层自适应：字号与卡片尺寸随浮层自身大小等比联动，拖动右下角缩放浮层即可调整；默认 760×420 为标准比例。
- 标签详情面板：由标签浮层头部「详情面板」开关控制（开关状态会记住）。开启后面板紧贴标签浮层右侧，宽度为浮层的一半、高度与浮层一致、顶底对齐，并随浮层拖动、缩放、最大化同步移动；简介区自动拉伸填满面板、四个操作按钮按内容宽度居中收拢，无多余留白。展示当前标签的英文名、中文翻译、分类、数量与说明（优先用词库 notes，没有时回退 Danbooru wiki），可插入、复制或打开 Danbooru。鼠标移向面板点按钮时详情保持锁定，不会被途经的其他卡片替换；停留在新卡片上则恢复正常切换。关闭后隐藏，不再以浮窗形式显示。
- 标签浮层：可拖动标题栏移动，可拖拽右下角自由缩放，也可一键最大化/还原；支持列表/卡片视图切换；列数与候选数量随窗口自动调整，尺寸、位置、视图和最大化状态会记住并在刷新后恢复。
- 提示词增强：权重快捷调整、自动格式化、收藏/排除标签、画师前缀。
- 分类配色：按通用、画师、作品、角色、元标签为提示词着色。
- 历史管理：生成图片保存在浏览器 IndexedDB，支持复制、导出 ZIP 与画廊查看。

## 目录

- `src/`：扩展源码。
- `extension/`：可加载的浏览器扩展。
- `userscript/NovelAI-Helper.user.js`：油猴脚本。
- `tools/`：构建与打包脚本。
- `release/`：扩展发布包。

## 开发

```powershell
npm install
node tools/verify-css.mjs
node tools/build-extension.mjs
node tools/build-userscript.mjs
node tools/package-extension.mjs
```

构建会调用 terser 压缩代码与内联样式，扩展与油猴脚本复用同一份压缩产物，保证两端功能一致；构建阶段会校验所有产物为合法 UTF-8、扫描并拒绝一切非字符，并且断言 CSS 压缩前后选择器语义一致（防止 `]` 后的后代选择器空格被误删，导致列表模式等样式失效）。打包脚本生成标准 ZIP（正斜杠路径），并同步输出解压目录 `release/NovelAI_Helper_v<版本>/`。

第三方许可见 `THIRD_PARTY_NOTICES.md` 与 `LICENSE`。
