// 画廊查看器：把会话中的原图与生成信息渲染到一个新标签页。
// 新标签页与 novelai.net 同源（由 window.open 打开），因此可以显示这里创建的 blob: URL。
// 全部使用 DOM API 构建（不含内联脚本）。
globalThis.SessionViewer = (() => {
  const CSS = `
:root{color-scheme:dark;--sz:220px}
*{box-sizing:border-box}
body{margin:0;background:#12131c;color:#e8e8f0;font:14px/1.5 system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 14px;background:#1a1c2a;border-bottom:1px solid #33365a}
header h1{font-size:15px;margin:0;flex:1 1 220px}
input,select,button{background:#262944;color:#e8e8f0;border:1px solid #444876;border-radius:6px;padding:4px 8px;font:inherit}
button{cursor:pointer} button:hover{border-color:#8fa5ff} input[type=range]{padding:0;width:120px}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--sz),1fr));gap:10px;padding:14px}
figure{margin:0;background:#1a1c2a;border-radius:8px;overflow:hidden;cursor:pointer;border:1px solid transparent}
figure:hover{border-color:#8fa5ff} figure[hidden]{display:none}
figure img,figure .ph{width:100%;aspect-ratio:1/1;object-fit:contain;background:#000;display:block}
figure .ph{display:flex;align-items:center;justify-content:center;color:#778;font-size:12px}
figcaption{padding:4px 8px;font-size:11px;color:#aab;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lb{position:fixed;inset:0;z-index:10;background:#000e;display:grid;grid-template-columns:1fr minmax(280px,420px);opacity:0;visibility:hidden;pointer-events:none}
#lb.on{opacity:1;visibility:visible;pointer-events:auto}
#lb.closing{opacity:0;visibility:visible;pointer-events:none}
#lbimg{display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;padding:10px;position:relative}
#lbimg img{max-width:100%;max-height:100vh;object-fit:contain}
#lbimg button.nav{position:absolute;top:50%;transform:translateY(-50%);font-size:22px;padding:8px 12px;opacity:.8}
#lbprev{left:8px} #lbnext{right:8px}
#info{overflow:auto;background:#1a1c2a;padding:12px;border-left:1px solid #33365a}
.sec{margin-bottom:10px} .sec b{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#8fa5ff;margin-bottom:2px}
.sec pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#12131c;padding:6px 8px;border-radius:6px;font:12px/1.5 ui-monospace,monospace}
footer{padding:10px 14px;color:#778;font-size:12px}
@media (max-width:800px){#lb{grid-template-columns:1fr;grid-template-rows:55vh 1fr}}
@media (prefers-reduced-motion: reduce){button,figure,#lb{transition:none!important}#lbimg img{animation:none!important}}`;

  const dec = (u8) => new TextDecoder().decode(u8);
  const pad = (n) => String(n).padStart(2, '0');
  const first = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== '' && x !== '<Undefined>');

  function toDate(v) {
    if (v instanceof Date) return v;
    if (typeof v !== 'string') return null;
    const d = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(v) ? v : v + 'Z');
    return isNaN(d) ? null : d;
  }
  const fmtTime = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : '';

  // NovelAI 会把请求参数以 JSON 形式写入 PNG 的 tEXt "Comment" 块，位置在 IDAT 之前。
  async function pngComment(blob) {
    if (!blob) return null;
    const u8 = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
    if (u8[0] !== 0x89 || u8[1] !== 0x50) return null;
    const dv = new DataView(u8.buffer);
    let p = 8;
    while (p + 12 <= u8.length) {
      const n = dv.getUint32(p), t = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]);
      if (t === 'IDAT' || t === 'IEND' || p + 12 + n > u8.length) break;
      if (t === 'tEXt') {
        const d = u8.subarray(p + 8, p + 8 + n), z = d.indexOf(0);
        if (z > 0 && dec(d.subarray(0, z)) === 'Comment') { try { return JSON.parse(dec(d.subarray(z + 1))); } catch (_) { return null; } }
      }
      p += 12 + n;
    }
    return null;
  }

  async function buildItems(data, urls) {
    const blobs = new Map(data.images);
    const byId = new Map(data.groups);
    const order = data.meta.groupOrder || [];
    const gids = [...order.filter((g) => byId.has(g)), ...data.groups.map(([g]) => g).filter((g) => !order.includes(g))];
    const items = [];
    for (const gid of gids) {
      for (const im of byId.get(gid).images || []) {
        const iid = im.data && im.data[0];
        const blob = blobs.get(iid) || null;
        const m = await pngComment(blob);
        const p = im.params || {}, pp = p.params || {};
        const chars = m && m.v4_prompt && m.v4_prompt.caption && m.v4_prompt.caption.char_captions
          ? m.v4_prompt.caption.char_captions.map((c) => c.char_caption)
          : (pp.characterPrompts || []).map((c) => c && c.prompt).filter(Boolean);
        let url = '';
        if (blob) { url = URL.createObjectURL(blob); urls.push(url); }
        items.push({
          iid, url, time: toDate(im.genDateTime),
          thumb: typeof im.thumbnail === 'string' && im.thumbnail.startsWith('data:image/') ? im.thumbnail : '',
          prompt: first(m && m.prompt, p.prompt) || '', negative: first(m && m.uc, p.negPrompt, pp.uc) || '', chars,
          seed: first(m && m.seed, p.seed) ?? '', model: first(p.model) || '',
          steps: first(m && m.steps, pp.steps) ?? '', scale: first(m && m.scale, pp.scale) ?? '',
          sampler: first(m && m.sampler, pp.sampler) || '', noise: first(m && m.noise_schedule, pp.noise_schedule) || '',
          width: first(im.width, m && m.width, pp.width) || '', height: first(im.height, m && m.height, pp.height) || '',
        });
      }
    }
    items.sort((a, b) => (a.time || 0) - (b.time || 0));
    items.forEach((it, i) => { it.no = i + 1; });
    return items;
  }

  async function open(w, data) {
    const d = w.document;
    const urls = [];
    const items = await buildItems(data, urls);
    const el = (tag, props = {}, ...kids) => {
      const e = d.createElement(tag);
      for (const [k, v] of Object.entries(props)) { if (k === 'text') e.textContent = v; else e[k] = v; }
      e.append(...kids);
      return e;
    };
    d.head.textContent = ''; d.body.textContent = '';
    d.head.append(el('meta', { charset: 'utf-8' }), el('style', { textContent: CSS }));
    d.title = `${data.meta.name || 'History'} 列表（${items.length} 张）`;

    const grid = el('div', { id: 'grid' });
    const search = el('input', { type: 'search', placeholder: '按提示词、种子筛选', size: 24 });
    const sizeIn = el('input', { type: 'range', min: 120, max: 520, value: 220, title: '缩略图大小' });
    const sort = el('select', {}, el('option', { value: 'asc', text: '由旧到新' }), el('option', { value: 'desc', text: '由新到旧' }));
    const count = el('span', { text: `${items.length} 张` });
    d.body.append(
      el('header', {}, el('h1', { text: `${data.meta.name || 'History'} — ${fmtTime(toDate(data.meta.lastSavedAt))}` }), search, sort, sizeIn, count),
      grid,
      el('footer', { text: '本标签页中的图像只有在原 NovelAI 标签页保持打开时才能显示。关闭或重新加载原标签页后，这些图像将无法显示。' }),
    );

    const cards = items.map((it, i) => {
      const cap = `#${it.no}  ${fmtTime(it.time)}  seed ${it.seed}`;
      const media = it.url || it.thumb
        ? el('img', { src: it.url || it.thumb, loading: 'lazy', decoding: 'async', alt: `#${it.no}` })
        : el('div', { className: 'ph', text: '无图像' });
      const fig = el('figure', { title: it.prompt }, media, el('figcaption', { text: it.url ? cap : cap + '（无原图）' }));
      fig.dataset.q = [it.prompt, it.negative, it.seed, it.model, ...it.chars].join('\n').toLowerCase();
      fig.addEventListener('click', () => show(i));
      return fig;
    });
    grid.append(...cards);

    // ---- 灯箱（放大查看）----
    const lbImg = el('img'); const nav = (id, t, dir) => { const b = el('button', { id, className: 'nav', text: t, title: dir < 0 ? '上一张 (←)' : '下一张 (→)' }); b.addEventListener('click', (e) => { e.stopPropagation(); step(dir); }); return b; };
    const lbWrap = el('div', { id: 'lbimg' }, nav('lbprev', '◀', -1), lbImg, nav('lbnext', '▶', 1));
    const info = el('div', { id: 'info' });
    const lb = el('div', { id: 'lb' }, lbWrap, info);
    d.body.append(lb);
    let cur = -1;
    function closeLightbox() {
      if (!lb.classList.contains('on')) return;
      lb.classList.remove('on', 'closing');
      cur = -1;
    }
    const visible = () => [...grid.children].map((c) => cards.indexOf(c)).filter((i) => i >= 0 && !cards[i].hidden);
    const copy = async (text) => {
      try { await w.navigator.clipboard.writeText(text); return; } catch (_) { }
      const t = el('textarea', { value: text }); d.body.append(t); t.select(); try { d.execCommand('copy'); } catch (_) { } t.remove();
    };
    const section = (label, text) => {
      const btn = el('button', { text: '复制' });
      btn.addEventListener('click', async () => { await copy(text); btn.textContent = '已复制'; setTimeout(() => { btn.textContent = '复制'; }, 800); });
      return el('div', { className: 'sec' }, el('b', {}, el('span', { text: label }), btn), el('pre', { text }));
    };
    function show(i) {
      cur = i; const it = items[i];
      lbImg.src = it.url || it.thumb || '';
      info.textContent = '';
      info.append(
        el('div', { className: 'sec' }, el('b', { text: `#${it.no} / ${items.length}` }),
          el('pre', { text: `${fmtTime(it.time)}\n${it.model}\n${it.width}×${it.height}  步数 ${it.steps}  缩放 ${it.scale}\n${it.sampler} ${it.noise}\nseed ${it.seed}\n${it.iid}${it.url ? '' : '\n（无原图：显示缩略图）'}` })),
        section('提示词', it.prompt),
        ...it.chars.map((c, k) => section(`角色${k + 1}`, c)),
        section('负面提示词', it.negative),
      );
      lb.classList.remove('closing');
      lb.classList.add('on');
    }
    function step(dir) {
      const v = visible(); if (!v.length) return;
      const pos = v.indexOf(cur); show(v[(pos < 0 ? 0 : (pos + dir + v.length) % v.length)]);
    }
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbWrap) closeLightbox(); });
    d.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
    });

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase(); let n = 0;
      for (const c of cards) { c.hidden = !!q && !c.dataset.q.includes(q); if (!c.hidden) n++; }
      count.textContent = `${n} 张`;
    });
    sizeIn.addEventListener('input', () => grid.style.setProperty('--sz', sizeIn.value + 'px'));
    sort.addEventListener('change', () => {
      const list = sort.value === 'desc' ? [...cards].reverse() : cards;
      grid.append(...list);
    });

    // 查看器标签页关闭后释放 blob URL。
    const timer = setInterval(() => {
      if (w.closed) { clearInterval(timer); urls.forEach((u) => URL.revokeObjectURL(u)); }
    }, 3000);
    return items.length;
  }

  return { open, _pngComment: pngComment };
})();
