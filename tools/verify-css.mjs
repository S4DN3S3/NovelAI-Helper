import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minifyCss, minifyCssTemplates } from './minify.mjs';

const require = createRequire(import.meta.url);
const { parse } = require('acorn');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function collectTemplates(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((item) => collectTemplates(item, acc)); return; }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const raw = node.quasis[0].value.cooked;
    if (typeof raw === 'string' && raw.length > 400) acc.push(raw);
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    collectTemplates(node[key], acc);
  }
}

function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === '\\') { current += text[i + 1] || ''; i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === separator && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  parts.push(current);
  return parts;
}

function normalizeSelector(selector) {
  return selector
    .replace(/\s+/g, ' ')
    .replace(/\s*([>+~])\s*/g, '$1')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

function normalizeValue(value) {
  // 去掉逗号与括号两侧的空格（无语义），保留 calc() 内运算符空格与引号内空格
  let out = '';
  let quote = null;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quote) {
      out += ch;
      if (ch === '\\') { out += value[i + 1] || ''; i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; out += ch; continue; }
    if (/\s/.test(ch)) {
      let j = i;
      while (j < value.length && /\s/.test(value[j])) j += 1;
      const prev = out[out.length - 1];
      const next = value[j] || '';
      const drop = (prev === ',' || next === ',' || prev === '(' || next === ')');
      if (!drop) out += ' ';
      i = j - 1;
      continue;
    }
    out += ch;
  }
  return out.trim();
}

function normalizeDeclarations(body) {
  return splitTopLevel(body, ';')
    .map((item) => {
      const text = item.replace(/\s+/g, ' ').trim();
      const colon = text.indexOf(':');
      if (colon < 0) return text;
      const property = text.slice(0, colon).trim();
      const value = normalizeValue(text.slice(colon + 1));
      return `${property}:${value}`;
    })
    .filter(Boolean)
    .sort();
}

function parseRules(css, prefix = '') {
  const rules = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const selector = css.slice(i, open);
    let depth = 1;
    let j = open + 1;
    let quote = null;
    while (j < n && depth > 0) {
      const ch = css[j];
      if (quote) {
        if (ch === '\\') { j += 2; continue; }
        if (ch === quote) quote = null;
        j += 1;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; j += 1; continue; }
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    const trimmedSelector = selector.trim();
    if (trimmedSelector.startsWith('@')) {
      // 嵌套 at-rule：递归展开内部规则，保证 @media 里的后代选择器也被校验
      const inner = parseRules(body, `${prefix}${trimmedSelector} `);
      if (inner.length) {
        rules.push(...inner);
      } else {
        rules.push({ at: `${prefix}${trimmedSelector}`, body: body.replace(/\s+/g, ' ').trim() });
      }
    } else {
      for (const one of splitTopLevel(trimmedSelector, ',')) {
        rules.push({ selector: `${prefix}${normalizeSelector(one)}`, declarations: normalizeDeclarations(body) });
      }
    }
    i = j;
  }
  return rules;
}

function compare(original, minified, label) {
  const before = parseRules(original);
  const after = parseRules(minified);
  const problems = [];
  if (before.length !== after.length) {
    problems.push(`规则数不一致：原始 ${before.length} → 压缩后 ${after.length}`);
  }
  const beforeMap = new Map();
  for (const rule of before) {
    const key = rule.selector || rule.at;
    if (!beforeMap.has(key)) beforeMap.set(key, []);
    beforeMap.get(key).push(rule);
  }
  const afterMap = new Map();
  for (const rule of after) {
    const key = rule.selector || rule.at;
    if (!afterMap.has(key)) afterMap.set(key, []);
    afterMap.get(key).push(rule);
  }
  for (const [key, list] of beforeMap) {
    if (!afterMap.has(key)) {
      problems.push(`选择器丢失或被改写：${key}`);
      continue;
    }
    const target = afterMap.get(key);
    if (target.length !== list.length) {
      problems.push(`选择器重复次数不一致：${key}（${list.length} → ${target.length}）`);
    }
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const b = target[i];
      if (a.at) continue;
      if (a.declarations.join('|') !== b.declarations.join('|')) {
        problems.push(`声明不一致：${key}\n    原始：${a.declarations.join(' | ')}\n    压缩：${b.declarations.join(' | ')}`);
      }
    }
  }
  for (const key of afterMap.keys()) {
    if (!beforeMap.has(key)) problems.push(`压缩后出现新选择器：${key}`);
  }
  return problems;
}

const files = ['src/base.js', 'src/bridge.js', 'src/background.js', 'src/session-core.js', 'src/session-viewer.js', 'src/session-content.js'];
let totalTemplates = 0;
let totalProblems = 0;

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const code = fs.readFileSync(abs, 'utf8');
  let ast;
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (_) {
    continue;
  }
  const templates = [];
  collectTemplates(ast, templates);
  const cssTemplates = templates.filter((raw) => raw.includes('{') && raw.includes('}'));
  for (const raw of cssTemplates) {
    totalTemplates += 1;
    const minified = minifyCss(raw);
    const problems = compare(raw, minified, rel);
    if (problems.length) {
      totalProblems += problems.length;
      console.log(`\n[${rel}] 发现 ${problems.length} 处差异：`);
      for (const p of problems.slice(0, 12)) console.log('  - ' + p);
      if (problems.length > 12) console.log(`  ... 其余 ${problems.length - 12} 处省略`);
    }
  }
}

console.log(`\n检查 CSS 模板 ${totalTemplates} 个，差异 ${totalProblems} 处。`);
process.exit(totalProblems ? 1 : 0);
