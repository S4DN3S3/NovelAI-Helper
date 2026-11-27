import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { minifyCode } from './minify.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const userscriptPath = path.join(root, 'userscript/NovelAI-Helper.user.js');
const version = '1.3';

const HEADER_END = '// ==/UserScript==';
const FOOTER_MARKER = '/* Third-party components (MIT):';

const existing = fs.readFileSync(userscriptPath, 'utf8');
const headerEnd = existing.indexOf(HEADER_END);
const footerStart = existing.indexOf(FOOTER_MARKER);
if (headerEnd < 0 || footerStart < 0 || footerStart < headerEnd) {
  throw new Error('无法定位油猴脚本的头部/尾部，已中止生成。');
}

const header = existing
  .slice(0, headerEnd + HEADER_END.length)
  .replace(/^(\/\/ @version\s+).*$/m, `$1${version}`);
const footer = existing.slice(footerStart);

const sources = [
  ['src/base.js', 'base.js'],
  ['src/session-core.js', 'session-core.js'],
  ['src/session-viewer.js', 'session-viewer.js'],
  ['src/session-content.js', 'session-content.js'],
];

const parts = [];
for (const [source, filename] of sources) {
  const raw = fs.readFileSync(path.join(root, source), 'utf8');
  parts.push(await minifyCode(raw, filename));
}

const output = `${header}\n\n${parts.join('\n')}\n${footer}`;
new vm.Script(output, { filename: 'NovelAI-Helper.user.js' });
fs.writeFileSync(userscriptPath, output, 'utf8');

console.log(`userscript v${version} ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
