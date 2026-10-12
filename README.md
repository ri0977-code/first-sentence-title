# First Sentence Title · 首句自动标题

> 保存笔记时，自动把「正文第一句」或「标题行」填成文件名（在 Obsidian 中，标题就是文件名）。
> Automatically renames your note to its first sentence or title line on save — in Obsidian the note title *is* the filename.

很多笔记软件都有这个能力：写完第一句话，文件名就自动变成这句话。本插件把这个体验带到 Obsidian，而且是**自动的**——你正常写、正常保存（或自动保存），标题自己就填好了，不需要任何手动操作。
**English:** Many note apps turn your first sentence into the file name automatically. This plugin brings that experience to Obsidian, and it's **automatic** — you just write and save (or let auto-save run), and the title fills itself in with no manual step.

## 它能做什么 · What it does

新建 / 粘贴笔记后，满足下面任一条件就会自动重命名文件（即设置标题）：
**English — After you create or paste a note, the file is renamed automatically whenever either condition below is met:**

1. **第一句以句末标点结尾**：正文里出现第一个句末标点，就取该标点之前的内容作为文件名。句末标点**同时支持中文与英文**——中文的「。」「！」「？」和英文的 `.` `!` `?`（含全角 `．`），所以中英文笔记都能用。英文句点 `.` 做了防误判处理：`Mr.` `Dr.` `vs.`、`v1.0.0`、`e.g.` 这类缩写 / 版本号 / 缩写词不会误截断。
2. **标题行 + 回车换行**：正文第一行（会自动忽略 `#` 标题语法）较短、且后面还跟着正文——比如你从别处粘贴了一份带标题的报告，第一行那句标题就会直接变成文件名。

**English:**
1. **First sentence ends with sentence-ending punctuation.** The moment the first sentence-ending punctuation appears in the body, the text before it becomes the file name. Punctuation is **bilingual** — Chinese 「。」「！」「？」 and English `.` `!` `?` (including fullwidth `．`), so both Chinese and English notes work. English periods `.` are protected against mis-cuts: abbreviations / version numbers like `Mr.` `Dr.` `vs.` `v1.0.0` `e.g.` won't be split prematurely.
2. **Title line + newline.** The first line of the note (the `#` heading syntax is ignored automatically) is short and followed by body text — e.g. when you paste in a report that has a title on its first line, that title becomes the file name directly.

重命名通过 Obsidian 原生 `fileManager.renameFile` 完成，**指向这篇笔记的 `[[双链]]` 会自动同步更新**，不会断链。
**English:** Renaming goes through Obsidian's native `fileManager.renameFile`, so any `[[wikilinks]]` pointing to this note **update automatically** — no broken links.

## 设计上的几个防误触 · Guardrails

- **不会半句就改名**：第一句规则只在出现句末标点后才触发；标题行规则要求第一行「短 + 后面有正文」，所以你正在打一个长段落时不会 premature 改名。
- **同名保护**：目标文件名已存在时放弃重命名，不会覆盖别人的笔记。
- **可跳过目录**：默认跳过 `.obsidian`、`.workbuddy`、`copilot`、`对话稿/原始ai对话txt`，可在设置里增删。
- **非法字符清洗**：文件名里的 `\ / : * ? " < > | # ^ [ ]` 会自动去掉，符合 Windows 命名规则。

**English:**
- **No mid-sentence renaming.** The first-sentence rule only fires after sentence-ending punctuation; the title-line rule requires a "short line + following body", so typing a long paragraph won't trigger a premature rename.
- **Same-name protection.** If the target file name already exists, the rename is skipped — your other notes are never overwritten.
- **Skippable folders.** By default it skips `.obsidian`, `.workbuddy`, `copilot`, and `对话稿/原始ai对话txt`; you can edit this list in settings.
- **Illegal-character cleaning.** Characters invalid in file names (`\ / : * ? " < > | # ^ [ ]`) are stripped automatically, keeping names Windows-safe.

## 设置项 · Settings

| 设置 | 说明 |
| --- | --- |
| 启用 | 总开关 |
| 标题最大长度 | 最终文件名截断到的字符数（默认 60） |
| 标题行最大长度 | 第一行短于此值且后面有正文时，直接用该行做标题；设为 `0` 可关闭「标题行 + 换行」规则（默认 40） |
| 跳过目录 | 逗号分隔，从 vault 根算起 |

| Setting | Description |
| --- | --- |
| Enable | Master switch |
| Max title length | The file name is truncated to this many characters (default 60) |
| Title-line max length | If the first line is shorter than this and followed by body text, it becomes the title; set to `0` to disable the title-line rule (default 40) |
| Skip directories | Comma-separated, counted from the vault root |

另外，命令面板里还有一条 **「对当前笔记立即执行（第一句/标题行→标题）」**，可对任意已存在的笔记手动触发一次。
**English:** There is also a command-palette action — **"Run now on current note (first sentence / title line → title)"** — that manually triggers the rename once for any existing note.

## 安装 · Installation

### 方式一：BRAT（推荐，立即可用，无需等上架）· BRAT (recommended, instant, no review wait)
1. 在 Obsidian 社区插件市场安装并启用 **BRAT**。
2. 命令面板运行 `BRAT: Add a beta plugin for testing`。
3. 填入本仓库地址：`https://github.com/ri0977-code/first-sentence-title`，确认添加并启用。

**English:**
1. Install and enable **BRAT** from the Obsidian community plugin store.
2. Run `BRAT: Add a beta plugin for testing` from the command palette.
3. Paste this repo URL: `https://github.com/ri0977-code/first-sentence-title`, then confirm and enable.

### 方式二：官方社区插件商店（已上架）· Official community store (published)
直接在 Obsidian `设置 → 第三方插件 → 浏览` 里搜索 **First Sentence Title** 安装即可；或打开 [插件页面](https://community.obsidian.md/plugins/first-sentence-title) 点 **Add to Obsidian**。
**English:** Just search **First Sentence Title** in `Settings → Community plugins → Browse` inside Obsidian, or open the [plugin page](https://community.obsidian.md/plugins/first-sentence-title) and click **Add to Obsidian**.

### 方式三：手动侧载（安卓 / 鸿蒙兼容容器 / 离线）· Manual install (Android / HarmonyOS container / offline)
把本仓库的 `main.js` 和 `manifest.json` 两个文件放进 vault 的 `.obsidian/plugins/first-sentence-title/` 目录，重启 Obsidian 并在 `设置 → 第三方插件` 中启用即可。
**English:** Copy `main.js` and `manifest.json` from this repo into your vault's `.obsidian/plugins/first-sentence-title/` folder, restart Obsidian, and enable it under `Settings → Community plugins`.

> 鸿蒙（HarmonyOS）系统下通过「卓易通」等安卓兼容容器安装的 Obsidian 安卓版，与上述安卓侧载方式完全一致。
> **English:** On HarmonyOS, the Obsidian Android app installed via an Android compatibility container such as "卓易通" works exactly the same as the manual Android sideload above.

## 许可 · License

MIT License. © 2026 WorkBuddy · 小台
**English:** MIT License. © 2026 WorkBuddy · 小台
