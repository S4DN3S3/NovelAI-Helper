import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'extension');
const contentDir = path.join(outDir, 'content');

function stripComments(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let inBlock = false;
  for (const line of lines) {
    if (inBlock) {
      if (line.includes('*/')) inBlock = false;
      continue;
    }
    if (/^\s*\/\*/.test(line)) {
      if (!line.includes('*/')) inBlock = true;
      continue;
    }
    if (/^\s*\/\//.test(line)) continue;
    out.push(line);
  }
  return out.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function write(relativePath, content) {
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  return Buffer.byteLength(content);
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
  const code = stripComments(fs.readFileSync(path.join(root, source), 'utf8'));
  const bytes = write(target, code);
  new vm.Script(code, { filename: target });
  total += bytes;
  console.log(`${target.padEnd(32)} ${(bytes / 1024).toFixed(1)} KB`);
}

const background = stripComments(fs.readFileSync(path.join(root, 'src/background.js'), 'utf8'));
new vm.Script(background, { filename: 'background.js' });
total += write('background.js', background);

total += copy('LICENSE');
total += copy('THIRD_PARTY_NOTICES.md');
const manifest = fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8');
JSON.parse(manifest);

console.log(`extension total ${(total / 1024).toFixed(1)} KB`);
