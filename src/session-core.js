// NovelAI 图像生成会话工具：核心模块（IndexedDB 读写 + ZIP）。
// 运行在 novelai.net 页面源中（内容脚本或 DevTools 控制台）。
globalThis.SessionTool = (() => {
  const HIST_DB = 'generated-image-history';
  const IMG_DB = 'generated-images';

  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const done = (tx) => new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error('事务已中止'));
  });

  async function openDb(name) {
    // 对不存在的数据库调用 indexedDB.open() 会创建一个空库，所以先检查一下。
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === name)) throw new Error(`未找到 IndexedDB "${name}"（请先打开一次 NovelAI 的图像生成页面）`);
    return req(indexedDB.open(name));
  }
  const prefixRange = (id) => IDBKeyRange.bound(id + ':', id + ':\uffff');

  // 写入记录：区分内联 keyPath（值自身携带键）与外部键两种情况
  function putRec(store, value, key) {
    if (store.keyPath) return store.put(value);
    return store.put(value, key);
  }

  async function listSessions() {
    const db = await openDb(HIST_DB);
    try {
      const metas = await req(db.transaction('history-meta').objectStore('history-meta').getAll());
      return metas
        .filter((m) => m && m.id)
        .sort((a, b) => new Date(b.lastSavedAt) - new Date(a.lastSavedAt));
    } finally { db.close(); }
  }

  async function readSession(id) {
    const hdb = await openDb(HIST_DB);
    let meta, groups, boards;
    try {
      const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards']);
      meta = await req(tx.objectStore('history-meta').get(id));
      const gs = tx.objectStore('history-groups');
      const gkeys = await req(gs.getAllKeys(prefixRange(id)));
      const gvals = await req(gs.getAll(prefixRange(id)));
      groups = gkeys.map((k, i) => [String(k).slice(id.length + 1), gvals[i]]);
      boards = await req(tx.objectStore('history-boards').get(id));
    } finally { hdb.close(); }
    if (!meta) throw new Error('未找到历史记录：' + id);
    const idb = await openDb(IMG_DB);
    let images;
    try {
      const st = idb.transaction('images').objectStore('images');
      const ikeys = await req(st.getAllKeys(prefixRange(id)));
      const ivals = await req(st.getAll(prefixRange(id)));
      images = ikeys.map((k, i) => [String(k).slice(id.length + 1), ivals[i]]);
    } finally { idb.close(); }
    for (const [iid, v] of images) if (!(v instanceof Blob)) throw new Error(`图像 ${iid} 不是 Blob 对象 (${Object.prototype.toString.call(v)})`);
    return { meta, groups, boards, images };
  }

  async function deleteSessionData(id) {
    const idb = await openDb(IMG_DB);
    try {
      const tx = idb.transaction('images', 'readwrite');
      tx.objectStore('images').delete(prefixRange(id));
      await done(tx);
    } finally { idb.close(); }
    const hdb = await openDb(HIST_DB);
    try {
      const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards'], 'readwrite');
      tx.objectStore('history-groups').delete(prefixRange(id));
      tx.objectStore('history-boards').delete(id);
      tx.objectStore('history-meta').delete(id);
      await done(tx);
    } finally { hdb.close(); }
  }

  // 先写图像、最后写 meta，这样只写了一半的会话不会出现在列表里。
  async function writeSession(newId, data, name) {
    try {
      const idb = await openDb(IMG_DB);
      try {
        const tx = idb.transaction('images', 'readwrite');
        const st = tx.objectStore('images');
        for (const [iid, blob] of data.images) putRec(st, blob, `${newId}:${iid}`);
        await done(tx);
      } finally { idb.close(); }
      const hdb = await openDb(HIST_DB);
      try {
        const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards'], 'readwrite');
        const gs = tx.objectStore('history-groups');
        for (const [gid, v] of data.groups) putRec(gs, v, `${newId}:${gid}`);
        if (data.boards) {
          const bs = tx.objectStore('history-boards');
          putRec(bs, bs.keyPath ? { ...data.boards, [bs.keyPath]: newId } : data.boards, newId);
        }
        const ms = tx.objectStore('history-meta');
        putRec(ms, { ...data.meta, id: newId, name: name ?? data.meta.name }, newId);
        await done(tx);
      } finally { hdb.close(); }
    } catch (e) {
      try { await deleteSessionData(newId); } catch (_) { }
      throw e;
    }
    return newId;
  }

  // ---- 存储配额（本工具自己的保护机制；统计本浏览器中所有会话的图像字节数）----
  const GB = 1e9;
  const QUOTA_KEY = 'nsm-quota-bytes';
  const fmtBytes = (b) => (b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : (b / 1e6).toFixed(b >= 1e8 ? 0 : 1) + ' MB');

  async function imageUsage() {
    const db = await openDb(IMG_DB);
    try {
      const st = db.transaction('images').objectStore('images');
      const keys = await req(st.getAllKeys());
      const vals = await req(st.getAll());
      const bySession = new Map();
      let total = 0;
      keys.forEach((k, i) => {
        const sid = String(k).split(':')[0], n = (vals[i] && vals[i].size) || 0;
        bySession.set(sid, (bySession.get(sid) || 0) + n);
        total += n;
      });
      return { total, bySession, count: keys.length };
    } finally { db.close(); }
  }
  const readQuotaSetting = () => { try { const v = Number(localStorage.getItem(QUOTA_KEY)); return v > 0 ? v : null; } catch (_) { return null; } };
  function setQuotaBytes(bytes) {
    try { if (bytes == null) localStorage.removeItem(QUOTA_KEY); else localStorage.setItem(QUOTA_KEY, String(Math.round(bytes))); } catch (_) { }
  }

  // 默认上限：固定 10 GB。（navigator.storage.estimate().quota 不能作为依据：Chrome 在那里给出的
  // 是「已用量 + 10 GiB」这种人为数值，与真实执行的上限和淘汰机制无关。）
  async function quotaInfo() {
    const u = await imageUsage();
    const auto = 10 * GB;
    const set = readQuotaSetting();
    const quota = set ?? auto;
    return { used: u.total, count: u.count, bySession: u.bySession, quota, auto, custom: set != null, over: u.total > quota };
  }

  async function assertRoom(extra, what) {
    const q = await quotaInfo();
    if (q.used + extra > q.quota) {
      const e = new Error(`${what}失败：上限为 ${fmtBytes(q.quota)}，当前已用 ${fmtBytes(q.used)} ＋ 本次新增 ${fmtBytes(extra)} = ${fmtBytes(q.used + extra)}。请删除不需要的历史记录，或提高上限。`);
      e.code = 'QUOTA';
      throw e;
    }
    return q;
  }
  const sumBlobs = (images) => images.reduce((a, [, b]) => a + b.size, 0);

  async function duplicateSession(id) {
    const data = await readSession(id);
    await assertRoom(sumBlobs(data.images), '复制');
    const newId = crypto.randomUUID();
    await writeSession(newId, data, (data.meta.name || 'History') + ' (副本)');
    return newId;
  }

  // ---- JSON 与结构化值互转（这里只有 Date 需要特殊处理）----
  const enc = (v) => {
    if (v instanceof Date) return { $date: v.toISOString() };
    if (Array.isArray(v)) return v.map(enc);
    if (v && typeof v === 'object') {
      if (v instanceof Blob || v instanceof ArrayBuffer) throw new Error('包含无法转换为 JSON 的值（Blob/ArrayBuffer）');
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
    }
    return v;
  };
  const dec = (v) => {
    if (Array.isArray(v)) return v.map(dec);
    if (v && typeof v === 'object') {
      if (Object.keys(v).length === 1 && '$date' in v) return new Date(v.$date);
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]));
    }
    return v;
  };

  // ---- 精简 ZIP 实现（写入只做存储，读取支持存储 / deflate）----
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  const crc32 = (u8) => { let c = -1; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const utf8 = (s) => new TextEncoder().encode(s);

  function zipBuild(entries) {
    const parts = [], central = [];
    let offset = 0;
    for (const { name, data } of entries) {
      const nb = utf8(name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nb, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nb.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nb);
      offset += 30 + nb.length + data.length;
    }
    const cdSize = central.reduce((a, p) => a + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }

  async function zipRead(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let e = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('无法作为 ZIP 文件读取');
    const count = dv.getUint16(e + 10, true);
    let p = dv.getUint32(e + 16, true);
    const out = new Map();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP 的目录信息已损坏');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const lo = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      let data = u8.subarray(start, start + csize);
      if (method === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else if (method !== 0) throw new Error('不支持的压缩方式：' + method);
      out.set(name, data);
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  const extOf = (type) => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[type] || 'bin');

  async function exportSessionZip(id) {
    const { meta, groups, boards, images } = await readSession(id);
    const entries = [];
    const imgList = [];
    for (const [iid, blob] of images) {
      const file = `images/${iid}.${extOf(blob.type)}`;
      entries.push({ name: file, data: new Uint8Array(await blob.arrayBuffer()) });
      imgList.push({ id: iid, file, type: blob.type });
    }
    const doc = { format: 'novelai-session-tool/1', exportedAt: new Date().toISOString(), meta: enc(meta), groups: groups.map(([g, v]) => [g, enc(v)]), boards: enc(boards), images: imgList };
    entries.unshift({ name: 'session.json', data: utf8(JSON.stringify(doc)) });
    const stamp = new Date(meta.lastSavedAt).toISOString().replace(/[-:]/g, '').slice(0, 15);
    return { blob: zipBuild(entries), filename: `novelai-session_${stamp}_${id.slice(0, 8)}.zip` };
  }

  async function importSessionZip(file) {
    const files = await zipRead(await file.arrayBuffer());
    const j = files.get('session.json');
    if (!j) throw new Error('未包含 session.json');
    const doc = JSON.parse(new TextDecoder().decode(j));
    if (doc.format !== 'novelai-session-tool/1') throw new Error('这不是本工具导出的 ZIP');
    const images = doc.images.map((m) => {
      const bytes = files.get(m.file);
      if (!bytes) throw new Error('缺少图像：' + m.file);
      return [m.id, new Blob([bytes], { type: m.type })];
    });
    const data = { meta: dec(doc.meta), groups: doc.groups.map(([g, v]) => [g, dec(v)]), boards: dec(doc.boards), images };
    await assertRoom(sumBlobs(images), '导入');
    const newId = crypto.randomUUID();
    await writeSession(newId, data, (data.meta.name || 'History') + ' (导入)');
    return newId;
  }

  return { listSessions, readSession, duplicateSession, exportSessionZip, importSessionZip, deleteSessionData, quotaInfo, setQuotaBytes, fmtBytes, GB, _zip: { zipBuild, zipRead, crc32 } };
})();

