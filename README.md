# NovelAI Helper

NovelAI 绘图页的本地增强扩展：界面汉化、标签联想与 Danbooru 分类配色、提示词权重快捷调整，以及生成图片历史管理。

- 扩展版本：1.05
- 油猴脚本版本：1.0
- 作者：Hayasakai
- 许可：MIT

## 两种使用方式

### 浏览器扩展

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启开发者模式。
3. 选择「加载已解压的扩展程序」，指向 `extension/` 目录。
4. 打开 <https://novelai.net/image>。

也可以直接使用 [v1.05 Release](https://github.com/S4DN3S3/NovelAI-Helper/releases/tag/v1.05) 中的 ZIP。

详细说明见 [`extension/README.md`](extension/README.md)。

### 油猴脚本

需要先安装 Tampermonkey 或 Violentmonkey，然后直接安装：

<https://raw.githubusercontent.com/S4DN3S3/NovelAI-Helper/master/userscript/NovelAI-Helper.user.js>

脚本文件位于 `userscript/NovelAI-Helper.user.js`，只需这一个 JS 文件。

## 目录

- `src/`：扩展源码（base、bridge、background、session 模块）。
- `extension/`：构建后的可加载扩展目录（含 `manifest.json`）。
- `userscript/NovelAI-Helper.user.js`：油猴脚本版本，只需这一个文件。
- `tools/build-extension.mjs`：构建脚本。
- `tools/package-extension.ps1`：打包 ZIP。
- `release/`：扩展发布包。

## 开发

```powershell
node tools/build-extension.mjs
```

构建只输出实际运行所需的脚本，不包含源码注释和油猴兼容层。

## 第三方许可

见 `THIRD_PARTY_NOTICES.md` 与 `LICENSE`。
