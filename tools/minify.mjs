import { minify } from 'terser';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { parse } = require('acorn');

// Chrome rejects noncharacters (U+FFFF/U+FFFE, surrogates, U+FDD0..U+FDEF) in
// content scripts with "It isn't UTF-8 encoded". Ordinary CJK text is fine, so
// keeping it as UTF-8 saves ~45KB vs \uXXXX escapes. Every output is scanned for
// noncharacters below; any occurrence aborts the build.
export function hasNonCharacter(text) {
  for (let i = 0; i < text.length; i += 1) {
    const cp = text.codePointAt(i);
    if (cp > 0xffff) i += 1;
    if (cp === 0xfffe || cp === 0xffff
      || (cp >= 0xd800 && cp <= 0xdfff)
      || (cp >= 0xfdd0 && cp <= 0xfdef)) return cp;
  }
  return -1;
}

export const TERSER_OPTIONS = {
  ecma: 2020,
  compress: {
    passes: 3,
    drop_debugger: true,
    keep_fargs: false,
    unsafe: false,
  },
  mangle: {
    toplevel: false,
  },
  format: {
    comments: false,
    ascii_only: false,
  },
};

export function minifyCss(css) {
  const NO_SPACE_BEFORE = '{}[],;>';
  // 注意：']' 后面若跟空格，语义是后代选择器（.a[x] .b），绝不能删除；
  // 只有 '{' '}' ';' ',' '>' 之后才能安全地去掉空格。
  const NO_SPACE_AFTER = '{};>';
  let out = '';
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      out += ch;
      i += 1;
      while (i < n) {
        const c = css[i];
        if (c === '\\') { out += c + (css[i + 1] || ''); i += 2; continue; }
        out += c;
        i += 1;
        if (c === quote) break;
      }
      continue;
    }
    if (/\s/.test(ch)) {
      let j = i;
      while (j < n && /\s/.test(css[j])) j += 1;
      const prev = out[out.length - 1];
      const next = css[j] || '';
      if (prev && next && !NO_SPACE_AFTER.includes(prev) && !NO_SPACE_BEFORE.includes(next)
        && prev !== '"' && prev !== "'" && next !== '"' && next !== "'") {
        out += ' ';
      }
      i = j;
      continue;
    }
    if (ch === '}') {
      while (out.endsWith(' ') || out.endsWith(';')) out = out.slice(0, -1);
    }
    out += ch;
    i += 1;
  }
  return out.trim();
}

function looksLikeCss(text) {
  if (!text.includes('{') || !text.includes('}')) return false;
  if (text.includes('${')) return false;
  if (/\bfunction\b|=>|\bconst\b|\breturn\b/.test(text.slice(0, 300))) return false;
  return /[.#a-zA-Z][^{};]*\{/.test(text);
}

function collectTemplates(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((item) => collectTemplates(item, acc)); return; }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const raw = node.quasis[0].value.cooked;
    if (typeof raw === 'string' && raw.length > 400 && looksLikeCss(raw)) acc.push(node);
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    collectTemplates(node[key], acc);
  }
}

export function minifyCssTemplates(code, filename = 'script.js') {
  let ast;
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (_) {
    return code;
  }
  const templates = [];
  collectTemplates(ast, templates);
  if (!templates.length) return code;
  let out = code;
  for (const node of templates.sort((a, b) => b.start - a.start)) {
    const raw = node.quasis[0].value.cooked;
    const minified = minifyCss(raw);
    if (!minified || minified.length >= raw.length) continue;
    const escaped = minified.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    out = out.slice(0, node.start) + '`' + escaped + '`' + out.slice(node.end);
  }
  return out;
}

export async function minifyCode(code, filename = 'script.js') {
  const cssTrimmed = minifyCssTemplates(code, filename);
  const result = await minify(cssTrimmed, { ...TERSER_OPTIONS, sourceMap: false });
  if (!result.code) throw new Error(`压缩失败: ${filename}`);
  const bad = hasNonCharacter(result.code);
  if (bad >= 0) throw new Error(`产物含 Chrome 拒绝的非字符 U+${bad.toString(16).toUpperCase().padStart(4, '0')}: ${filename}`);
  return result.code;
}
