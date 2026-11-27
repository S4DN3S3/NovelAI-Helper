import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { minifyCode, minifyCss, hasNonCharacter } from './minify.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse } = require('acorn');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'extension');

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function collectCssTemplates(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((item) => collectCssTemplates(item, acc)); return; }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const raw = node.quasis[0].value.cooked;
    if (typeof raw === 'string' && raw.length > 400 && raw.includes('{') && raw.includes('}')) acc.push(raw);
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    collectCssTemplates(node[key], acc);
  }
}

// 构建前自检：CSS 压缩不得改变选择器语义（尤其是 ] 后的后代选择器空格）
function assertCssSelectorsIntact(raw, label) {
  const templates = [];
  try {
    collectCssTemplates(parse(raw, { ecmaVersion: 'latest', sourceType: 'script' }), templates);
  } catch (_) {
    return;
  }
  const normalize = (rule) => rule
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*([>+~])\s*/g, '$1')
    .trim();
  for (const original of templates) {
    const minified = minifyCss(original);
    const before = (original.match(/[^{}]+\{[^{}]*\}/g) || []).map(normalize);
    const after = (minified.match(/[^{}]+\{[^{}]*\}/g) || []).map(normalize);
    if (before.length !== after.length) {
      throw new Error(`CSS 压缩改变了规则数量 (${label}): ${before.length} -> ${after.length}`);
    }
    const selectorOf = (rule) => rule.slice(0, rule.indexOf('{')).trim();
    for (let i = 0; i < before.length; i += 1) {
      if (selectorOf(before[i]) !== selectorOf(after[i])) {
        throw new Error(`CSS 压缩改变了选择器 (${label}): "${selectorOf(before[i])}" -> "${selectorOf(after[i])}"`);
      }
    }
  }
}

function write(relativePath, content) {
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const buffer = Buffer.from(content, 'utf8');
  try {
    utf8Decoder.decode(buffer);
  } catch (error) {
    throw new Error(`产物不是合法 UTF-8: ${relativePath} (${error.message})`);
  }
  if (relativePath.endsWith('.js')) {
    const bad = hasNonCharacter(content);
    if (bad >= 0) throw new Error(`产物含 Chrome 拒绝的非字符 U+${bad.toString(16).toUpperCase().padStart(4, '0')}: ${relativePath}`);
  }
  const temp = target + '.tmp';
  fs.writeFileSync(temp, buffer);
  fs.renameSync(temp, target);
  return buffer.length;
}

function copy(relativePath) {
  const source = path.join(root, relativePath);
  const content = fs.readFileSync(source);
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return content.length;
}

const scripts = [
  ['src/bridge.js', 'content/bridge.js'],
  ['src/base.js', 'content/base.js'],
  ['src/session-core.js', 'content/session-core.js'],
  ['src/session-viewer.js', 'content/session-viewer.js'],
  ['src/session-content.js', 'content/session-content.js'],
];

let total = 0;
for (const [source, target] of scripts) {
  const raw = fs.readFileSync(path.join(root, source), 'utf8');
  assertCssSelectorsIntact(raw, source);
  const code = await minifyCode(raw, target);
  new vm.Script(code, { filename: target });
  const bytes = write(target, code);
  total += bytes;
  console.log(`${target.padEnd(32)} ${(bytes / 1024).toFixed(1)} KB`);
}

const backgroundRaw = fs.readFileSync(path.join(root, 'src/background.js'), 'utf8');
const background = await minifyCode(backgroundRaw, 'background.js');
new vm.Script(background, { filename: 'background.js' });
total += write('background.js', background);

total += copy('LICENSE');
total += copy('THIRD_PARTY_NOTICES.md');
const manifest = fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8');
JSON.parse(manifest);

console.log(`extension total ${(total / 1024).toFixed(1)} KB`);
