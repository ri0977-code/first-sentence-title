'use strict';

const obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
  enabled: true,
  maxLength: 60,
  debounceMs: 2500,
  titleLineMax: 40,
  skipFolders: '.obsidian, .workbuddy, copilot, 对话稿/原始ai对话txt'
};

class FirstSentenceTitlePlugin extends obsidian.Plugin {
  async onload() {
    this.timers = new Map();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) || {});
    this.addSettingTab(new FSTSettingTab(this.app, this));
    this.addCommand({
      id: 'apply-now',
      name: '对当前笔记立即执行（第一句/标题行→标题）',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) this.applyTitle(file.path);
      }
    });
    // 保存 = Obsidian 自动保存触发 vault modify 事件（约停止输入 2 秒后）
    this.registerEvent(this.app.vault.on('modify', (file) => this.onModify(file)));
  }

  onunload() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  onModify(file) {
    if (!this.settings.enabled) return;
    if (!(file instanceof obsidian.TFile) || file.extension !== 'md') return;
    if (this.isSkipped(file.path)) return;
    const key = file.path;
    const prev = this.timers.get(key);
    if (prev) clearTimeout(prev);
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key);
      this.applyTitle(key);
    }, this.settings.debounceMs));
  }

  isSkipped(path) {
    return this.settings.skipFolders
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .some((n) => path === n || path.startsWith(n + '/'));
  }

  async applyTitle(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof obsidian.TFile) || file.extension !== 'md') return;
    const content = await this.app.vault.cachedRead(file);
    const title = this.extractTitle(content);
    if (!title) return;
    if (title === file.basename) return; // 已是目标名，不动作
    const parentPath = file.parent && file.parent.path !== '/' ? file.parent.path + '/' : '';
    const newPath = parentPath + title + '.md';
    if (this.app.vault.getAbstractFileByPath(newPath)) return; // 同名文件已存在，放弃防覆盖
    try {
      await this.app.fileManager.renameFile(file, newPath);
      new obsidian.Notice('标题已自动更新：' + title);
    } catch (e) {
      console.error('[first-sentence-title] rename failed:', e);
    }
  }

  // 标题候选两条规则：
  //  ① 标题行规则：第一个非空行（去掉 # 标记）较短、不含句末标点、且后面还有正文
  //     —— 对应「粘贴的报告带标题行 + 回车换行」的场景；
  //  ② 第一句规则：正文中第一个句末标点之前的内容。
  //     句末标点同时支持中文与英文：
  //       · 中文：。（U+3002）、！、？
  //       · 英文 / 全角：. （含全角 ． U+FF0E）、!、?
  //     英文句点 "." 做了缩写与数字防误判（Mr. / v1.0.0 / e.g. 不会误截断）。
  //  优先级：明显的标题行 > 第一句
  extractTitle(content) {
    const rawLines = this.stripFrontmatter(content).split('\n');
    let inCode = false;
    const contentParts = []; // 句子检测用：跳过 frontmatter/代码块/标题行/分隔线
    let firstLine = null;    // 第一个非空行（去掉 markdown 标题标记）
    let hasFollowing = false;

    for (const r of rawLines) {
      const line = r.trimEnd();
      if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
      if (inCode) continue;
      if (!line.trim()) continue; // 空行
      if (firstLine === null) {
        firstLine = line.replace(/^\s*#{1,6}\s*/, '').replace(/^[>\-*\+\s]+/, '').trim();
      } else {
        hasFollowing = true;
      }
      if (/^\s*#{1,6}\s/.test(line)) continue;          // 标题行不算句子正文
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) continue;  // 分隔线
      contentParts.push(line.trim());
    }

    const body = contentParts.join('\n');
    const end = this.findFirstSentenceEnd(body);
    const sentence = end > 0
      ? body.slice(0, end).replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
      : null;

    let titleLine = null;
    if (
      this.settings.titleLineMax > 0 &&
      firstLine &&
      !/[。.?!！？]/.test(firstLine) &&   // 含句末标点的行视为「句子」而非标题行
      firstLine.length <= this.settings.titleLineMax &&
      hasFollowing
    ) {
      titleLine = firstLine;
    }

    const title = titleLine || sentence;
    if (!title) return null;
    const cleaned = title
      .slice(0, this.settings.maxLength)
      .trim()
      .replace(/[\\/:*?"<>|#^[\]]/g, '') // Windows 文件名非法字符
      .trim();
    return cleaned || null;
  }

  // 在 body 中找出「第一句」句末标点的下标（返回 -1 表示未找到）。
  // 句末标点不含该字符本身；英文句点 "." 额外做防误判处理。
  findFirstSentenceEnd(body) {
    // 无歧义终止符：中文句号、中文 / 英文 ！？、全角句点
    const stops = ['。', '．', '！', '？', '!', '?'];
    let best = -1;
    for (const s of stops) {
      const i = body.indexOf(s);
      if (i >= 0 && (best === -1 || i < best)) best = i;
    }
    // 英文句点 "."：需后接空白 / 结尾 / 其他终止符，并排除缩写与数字
    const dotRe = /\.(?=\s|$|[。．！？!?])/g;
    let m;
    while ((m = dotRe.exec(body)) !== null) {
      const i = m.index;
      const prev = body[i - 1];
      if (/[0-9]/.test(prev)) continue;                                   // 1.0.0 / 3.5 等数字、版本号
      const wordMatch = body.slice(0, i).match(/[A-Za-z]+$/);             // 句号前紧邻的英文词
      const tokenLen = wordMatch ? wordMatch[0].length : 0;
      if (tokenLen <= 2) continue;                                        // Mr. Dr. St. vs. 等缩写（短词）
      if (best === -1 || i < best) best = i;
      break;
    }
    return best;
  }

  stripFrontmatter(text) {
    if (text.startsWith('---')) {
      const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
      if (m) return text.slice(m[0].length);
    }
    return text;
  }
}

class FSTSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new obsidian.Setting(containerEl)
      .setName('启用')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enabled).onChange(async (v) => {
          this.plugin.settings.enabled = v;
          await this.plugin.saveData(this.plugin.settings);
        }));
    new obsidian.Setting(containerEl)
      .setName('标题最大长度（字符）')
      .setDesc('标题最终截断到的长度')
      .addText((t) =>
        t.setValue(String(this.plugin.settings.maxLength)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (n > 0) {
            this.plugin.settings.maxLength = n;
            await this.plugin.saveData(this.plugin.settings);
          }
        }));
    new obsidian.Setting(containerEl)
      .setName('标题行最大长度（字符）')
      .setDesc('第一个非空行短于此值、且后面还有正文（标题+换行 结构）时，直接用该行做标题；设为 0 可关闭「标题行+换行」检测')
      .addText((t) =>
        t.setValue(String(this.plugin.settings.titleLineMax)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (n >= 0) {
            this.plugin.settings.titleLineMax = n;
            await this.plugin.saveData(this.plugin.settings);
          }
        }));
    new obsidian.Setting(containerEl)
      .setName('跳过目录')
      .setDesc('逗号分隔，从 vault 根算起，这些目录里的笔记不自动改名')
      .addText((t) =>
        t.setValue(this.plugin.settings.skipFolders).onChange(async (v) => {
          this.plugin.settings.skipFolders = v;
          await this.plugin.saveData(this.plugin.settings);
        }));
  }
}

module.exports = FirstSentenceTitlePlugin;
