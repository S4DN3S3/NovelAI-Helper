import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'extension');
const decoder = new TextDecoder('utf-8', { fatal: true });
let failed = 0;

// Chrome rejects noncharacters (U+FFFF/U+FFFE, lone surrogates, U+FDD0..U+FDEF)
// in content scripts with "It isn't UTF-8 encoded" even when bytes are valid
// UTF-8. Ordinary CJK text is accepted; only these noncharacters are fatal.
function jsIssues(text) {
  const issues = [];
  for (let i = 0; i < text.length; i += 1) {
    const cp = text.codePointAt(i);
    if (cp > 0xffff) i += 1;
    if (cp === 0xfffe || cp === 0xffff
      || (cp >= 0xd800 && cp <= 0xdfff)
      || (cp >= 0xfdd0 && cp <= 0xfdef)) {
      issues.push(`U+${cp.toString(16).toUpperCase().padStart(4, '0')} @${i}`);
      if (issues.length >= 3) break;
    }
  }
  return issues;
}

function fail(message) {
  failed += 1;
  console.log(`✗ ${message}`);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!fs.existsSync(target)) {
  console.log(`✗ 目录不存在: ${target}`);
  process.exit(1);
}
ok(`目录: ${target}`);

const manifestPath = path.join(target, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  fail('缺少 manifest.json');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  ok(`manifest.json 可解析 (version ${manifest.version})`);
} catch (error) {
  fail(`manifest.json 解析失败: ${error.message}`);
  process.exit(1);
}

const referenced = [];
for (const entry of manifest.content_scripts || []) {
  for (const file of entry.js || []) referenced.push(file);
}
for (const entry of manifest.background?.service_worker ? [manifest.background.service_worker] : []) referenced.push(entry);
for (const icon of Object.values(manifest.icons || {})) referenced.push(icon);

for (const rel of referenced) {
  const file = path.join(target, rel);
  if (!fs.existsSync(file)) {
    fail(`缺少文件: ${rel}`);
    continue;
  }
  const buffer = fs.readFileSync(file);
  if (rel.endsWith('.js')) {
    try {
      const text = decoder.decode(buffer);
      const issues = jsIssues(text);
      if (issues.length) {
        fail(`${rel} 含 Chrome 不接受的字符: ${issues.join(', ')}`);
        continue;
      }
    } catch (error) {
      fail(`${rel} 不是合法 UTF-8: ${error.message}`);
      continue;
    }
  }
  ok(`${rel} 存在且编码正常 (${buffer.length} 字节)`);
}

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

for (const file of walk(target)) {
  if (file.endsWith('.tmp')) fail(`存在临时残留文件: ${path.relative(target, file)}`);
  if (file.endsWith('.js')) {
    const buffer = fs.readFileSync(file);
    const rel = path.relative(target, file);
    try {
      const issues = jsIssues(decoder.decode(buffer));
      if (issues.length) fail(`${rel} 含 Chrome 不接受的字符: ${issues.join(', ')}`);
    } catch (error) {
      fail(`${rel} 不是合法 UTF-8: ${error.message}`);
    }
  }
}

console.log(failed ? `\n校验未通过：${failed} 项问题` : '\n全部校验通过，可以直接加载该目录。');
process.exit(failed ? 1 : 0);
