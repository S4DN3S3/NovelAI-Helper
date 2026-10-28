// 历史管理面板：仅在 NovelAI 的「Load a previous session?」对话框出现时显示，
// 并与该对话框对齐，列出 / 复制 / 导出 / 导入历史。
(() => {
  if (window.top !== window || document.getElementById('nsm-host')) return;
  const T = globalThis.SessionTool;

  const host = document.createElement('div');
  host.id = 'nsm-host';
  host.style.cssText = 'position:fixed;z-index:2147483647;display:none;visibility:hidden;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host {
        --nsm-bg: var(--nai-popup-bg, rgba(22, 23, 38, 0.97));
        --nsm-surface: var(--nai-popup-surface, #20223a);
        --nsm-hint: var(--nai-popup-hint, #141527);
        --nsm-text: var(--nai-popup-text, #e8e8f2);
        --nsm-muted: var(--nai-popup-muted, #8f92ad);
        --nsm-border: var(--nai-popup-border, #3d3f5c);
        --nsm-border-soft: var(--nai-popup-border-soft, #2b2d46);
        --nsm-accent: var(--nai-popup-accent, #e3cc78);
        --nsm-accent-text: var(--nai-popup-accent-text, #17182b);
        --nsm-hover: var(--nai-popup-hover, #262946);
        --nsm-danger: var(--nai-popup-danger, #ff8484);
        --nsm-font: var(--nai-popup-font, system-ui, sans-serif);
        --nsm-shadow: var(--nai-popup-shadow, 0 18px 48px rgba(0, 0, 0, 0.55));
      }
      *{box-sizing:border-box;font-size:13px;line-height:1.4;font-family:var(--nsm-font)}
      button{cursor:pointer;border:1px solid var(--nsm-border);background:var(--nsm-surface);color:var(--nsm-text);border-radius:6px;padding:4px 9px;font-family:inherit}
      button:hover{background:var(--nsm-hover);border-color:var(--nsm-accent)}
      button:disabled{opacity:.5;cursor:default}
      input,select{font-family:inherit}
      #panel{display:block;overflow:auto;background:var(--nsm-bg);color:var(--nsm-text);border:1px solid var(--nsm-border);border-radius:10px;padding:10px;box-shadow:var(--nsm-shadow);scrollbar-color:var(--nai-popup-scroll, #4b4e6b) transparent;opacity:0;pointer-events:none}
      :host(.nsm-open) #panel{opacity:1;pointer-events:auto}
      :host(.nsm-closing) #panel{opacity:0;pointer-events:none}
      .row{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--nsm-border-soft)}
      .thumb{position:relative;width:56px;height:56px;flex:none;border-radius:5px;overflow:hidden;background:var(--nsm-hint)}
      .row img{width:100%;height:100%;object-fit:contain;border-radius:5px;background:var(--nsm-hint);display:block}
      .info{flex:1;min-width:0} .id{color:var(--nsm-muted);font-size:11px;white-space:pre-wrap;word-break:break-all}
      .actions{display:flex;gap:4px;flex-direction:column}
      #msg{margin:6px 0;color:var(--nsm-accent);white-space:pre-wrap} #msg.err{color:var(--nsm-danger)}
      header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;cursor:grab;user-select:none;touch-action:none}
      header:active{cursor:grabbing}
      #qbanner{background:var(--nsm-danger);color:#fff;font-weight:600;padding:8px 10px;border-radius:8px;margin-bottom:6px;box-shadow:0 4px 16px rgba(0,0,0,.25)}
      #qbanner[hidden]{display:none}
      #quota{margin:4px 0 8px;font-size:12px;color:var(--nsm-muted)}
      #qbar{height:6px;background:var(--nai-popup-accent-soft, var(--nsm-border-soft));border-radius:3px;overflow:hidden;margin:4px 0}
      #qbar i{display:block;height:100%;width:0;background:var(--nsm-accent)} #qbar i.warn{background:#f59f00} #qbar i.over{background:var(--nsm-danger)}
      #qset{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      #qin{width:64px;background:var(--nsm-hint);color:var(--nsm-text);border:1px solid var(--nsm-border);border-radius:6px;padding:2px 6px}
    </style>
    <div id="qbanner" hidden></div>
    <div id="panel">
      <header><b>🗂 历史管理</b><span><button id="imp">导入</button> <button id="rel">刷新</button></span></header>
      <div id="quota">
        <div id="qline"></div><div id="qbar"><i></i></div>
        <div id="qset">上限 <input id="qin" type="number" min="0.1" step="0.5"> GB <button id="qsave">设置</button> <button id="qauto">恢复默认值</button></div>
      </div>
      <div id="msg"></div>
      <button id="reload" hidden>重新加载页面</button>
      <div id="list"></div>
      <input id="file" type="file" accept=".zip" hidden>
    </div>`;
  document.documentElement.appendChild(host);

  let lastThemeAt = 0;
  let themeRevealTimer = 0;
  function showThemedHost() {
    host.classList.remove('nsm-open', 'nsm-closing');
    host.style.pointerEvents = 'none';
    host.style.display = 'block';
    host.style.visibility = 'hidden';
    applyPanelTheme(true);
    clearTimeout(themeRevealTimer);
    themeRevealTimer = setTimeout(() => {
      applyPanelTheme(true);
      requestAnimationFrame(() => {
        if (host.style.display === 'none' || host.classList.contains('nsm-closing')) return;
        host.style.visibility = 'visible';
        host.classList.add('nsm-open');
      });
    }, 220);
  }
  function hideThemedHost(immediate = false) {
    clearTimeout(themeRevealTimer);
    host.classList.remove('nsm-open', 'nsm-closing');
    host.style.display = 'none';
    host.style.visibility = 'hidden';
    host.style.pointerEvents = 'none';
  }
  function applyPanelTheme(force = false, requireAccent = false) {
    const now = Date.now();
    if (!force && now - lastThemeAt < 400) return false;
    lastThemeAt = now;
    try {
      if (typeof globalThis.__NAIApplyPopupTheme === 'function') {
        return globalThis.__NAIApplyPopupTheme(host, requireAccent) !== false;
      }
    } catch (_) { }
    return false;
  }

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const panelHeader = panel.querySelector('header');
  // 找到「Load a previous session?」对话框。兼容按钮文字已汉化、
  // 以及对话框不是全屏遮罩的情况。
  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
  function findDialogTitle() {
    return [...document.querySelectorAll('h1,h2,h3,h4,div,span')]
      .find((el) => {
        const text = (el.textContent || '').trim();
        return text.length < 80
          && /^(Load a previous session\?|加载之前的会话[?？])$/i.test(text)
          && isVisible(el);
      }) || null;
  }
  function commonAncestor(a, b) {
    const chain = new Set();
    for (let node = a; node; node = node.parentElement) chain.add(node);
    for (let node = b; node; node = node.parentElement) {
      if (chain.has(node)) return node;
    }
    return null;
  }
  function findDialog() {
    const title = findDialogTitle();
    if (!title) return null;
    const actionText = /^\s*(New Session|新会话)\s*$/i;
    const buttons = [...document.querySelectorAll('button, [role="button"], a')]
      .filter((el) => actionText.test(el.textContent || '') && isVisible(el));
    for (const button of buttons) {
      let node = button.parentElement;
      let candidate = null;
      while (node && node !== document.body) {
        if (/previous session|last saved|加载之前的会话|上次保存/i.test(node.textContent || '')) {
          candidate = node;
        }
        node = node.parentElement;
      }
      if (candidate) {
        // 按钮向上找到的常常是内部“会话卡片”，不是整个对话框。
        // 用标题和“新会话”按钮的最近公共祖先作为外框，才能让面板
        // 顶边真正对齐官方对话框，而不是对齐到中间某张卡片。
        const frame = commonAncestor(title, button);
        const element = frame && frame !== document.body
          ? frame
          : (candidate.closest('[role="dialog"]') || candidate);
        return {
          element: element.closest('[role="dialog"]') || element,
          title,
        };
      }
    }

    return {
      element: title.closest('[role="dialog"]') || title.parentElement?.parentElement || title,
      title,
    };
  }

  // 与官方对话框顶部对齐：优先右侧，其次左侧，最后下方。
  // 面板只吸附一次，之后保持固定位置；页面滚动或生成中的 DOM 更新都不再移动它。
  let pinnedDialogInfo = null;
  function positionPanel(dialog, force = false) {
    if (manualPosition) return;
    if (!force && pinnedDialogInfo && pinnedDialogInfo.element === dialog.element) return;
    pinnedDialogInfo = dialog;
    const rect = dialog.element.getBoundingClientRect();
    const titleRect = dialog.title ? dialog.title.getBoundingClientRect() : null;
    const anchorTop = titleRect && titleRect.height > 0
      ? Math.min(rect.top, titleRect.top)
      : rect.top;
    const GAP = 12;
    const EDGE = 8;
    const MAX_WIDTH = 420;
    const roomRight = innerWidth - rect.right - GAP * 2;
    const roomLeft = rect.left - GAP * 2;
    let left;
    let top;
    let width;
    if (roomRight >= 300) {
      width = Math.min(MAX_WIDTH, roomRight);
      left = rect.right + GAP;
      top = anchorTop;
    } else if (roomLeft >= 300) {
      width = Math.min(MAX_WIDTH, roomLeft);
      left = rect.left - GAP - width;
      top = anchorTop;
    } else if (rect.top > 220) {
      width = Math.min(MAX_WIDTH, innerWidth - EDGE * 2);
      left = clamp(rect.right - width, EDGE, innerWidth - width - EDGE);
      top = Math.max(EDGE, rect.top - GAP - 260);
    } else {
      // 两侧都放不下时放到对话框下方，并尽量和对话框左边对齐。
      width = Math.min(MAX_WIDTH, innerWidth - EDGE * 2);
      left = clamp(rect.left, EDGE, innerWidth - width - EDGE);
      top = Math.max(rect.bottom, anchorTop) + GAP;
    }
    top = clamp(top, EDGE, Math.max(EDGE, innerHeight - 160));
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.width = `${width}px`;
    // 底部留出 260px 给右下角工具栏/生成按钮，避免面板覆盖后无法点击。
    panel.style.maxHeight = `${Math.max(160, Math.min(650, innerHeight - top - 260))}px`;
  }

  // 通过标题栏拖动面板，避开导入/刷新按钮。
  let dragState = null;
  let manualPosition = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  panelHeader.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, input, select, textarea, a')) return;
    const rect = host.getBoundingClientRect();
    dragState = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    manualPosition = true;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    panelHeader.style.cursor = 'grabbing';
    try { panelHeader.setPointerCapture(event.pointerId); } catch (_) { }
    event.preventDefault();
  });
  panelHeader.addEventListener('pointermove', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const left = clamp(event.clientX - dragState.dx, 8, innerWidth - 120);
    const top = clamp(event.clientY - dragState.dy, 8, innerHeight - 60);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  });
  const endDrag = (event) => {
    if (!dragState || (event && event.pointerId !== dragState.pointerId)) return;
    dragState = null;
    panelHeader.style.cursor = 'grab';
    try { panelHeader.releasePointerCapture(event.pointerId); } catch (_) { }
  };
  panelHeader.addEventListener('pointerup', endDrag);
  panelHeader.addEventListener('pointercancel', endDrag);
  const IDLE = '若在多个标签页中打开 NovelAI，内容可能被互相覆盖。请只在单个标签页中操作。';
  const msg = (t, err, needReload) => { $('#msg').textContent = t; $('#msg').className = err ? 'err' : ''; $('#reload').hidden = !needReload; };
  const fmt = (d) => new Date(d).toLocaleString('zh-CN');

  async function guarded(label, fn, btn) {
    if (btn) btn.disabled = true;
    msg(label + ' …');
    try { await fn(); } catch (e) { console.error(e); msg('失败：' + (e.message || e), true); }
    finally { if (btn) btn.disabled = btn.dataset.locked === '1'; }
  }

  // 被锁定的按钮（配额原因）在 guarded() 结束后仍保持禁用。
  function lock(btn, locked, why) { btn.dataset.locked = locked ? '1' : ''; btn.disabled = locked; btn.title = locked ? why : ''; }
  const fb = (b) => T.fmtBytes(b);

  function renderQuota(q) {
    const pct = q.quota ? q.used / q.quota : 0;
    const ban = $('#qbanner');
    ban.hidden = !q.over;
    ban.textContent = q.over ? `历史总配额已超出设定值（当前 ${fb(q.used)} / 设定 ${fb(q.quota)}）。无法复制或导入。` : '';
    $('#qline').textContent = `已用 ${fb(q.used)} / 上限 ${fb(q.quota)}（${q.custom ? '手动设置' : '默认值'}，共 ${q.count} 张图像）`;
    const bar = $('#qbar i');
    bar.style.width = Math.min(100, pct * 100) + '%';
    bar.className = q.over ? 'over' : pct >= 0.8 ? 'warn' : '';
    $('#qin').value = (q.quota / T.GB).toFixed(1);
    lock($('#imp'), q.over, '已超出配额，无法导入');
  }

  let renderToken = 0;
  async function render() {
    const token = ++renderToken;
    const list = $('#list');
    list.textContent = '';

    let sessions;
    try {
      // 先只读历史元数据，面板立刻出现；体积统计放到后台空闲时做。
      sessions = await T.listSessions();
    } catch (e) {
      msg(e.message, true);
      return;
    }
    if (token !== renderToken) return;

    const rows = [];
    for (const s of sessions) {
      const row = document.createElement('div');
      row.className = 'row';
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      if (typeof s.recentThumbnail === 'string' && s.recentThumbnail.startsWith('data:image/')) img.src = s.recentThumbnail;
      thumb.append(img);
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = '<div></div><div class="id"></div>';
      info.firstChild.textContent = `${s.name || 'History'} / ${s.imageCount ?? '?'} 张 / 统计中…`;
      info.lastChild.textContent = `${fmt(s.lastSavedAt)}\n${s.id}`;
      const act = document.createElement('div');
      act.className = 'actions';
      const dup = document.createElement('button'); dup.textContent = '复制';
      const exp = document.createElement('button'); exp.textContent = '保存为 ZIP';
      const view = document.createElement('button'); view.textContent = '列表查看';
      view.onclick = async () => {
        const w = window.open('', '_blank');
        if (!w) { msg('弹出窗口被拦截。请允许本站弹出窗口。', true); return; }
        w.document.title = '加载中 …'; w.document.body.textContent = '加载中 …';
        await guarded('正在生成列表', async () => {
          try {
            const n = await SessionViewer.open(w, await T.readSession(s.id));
            msg(`已在新的标签页中显示 ${n} 张图像。请不要关闭原来的 NovelAI 标签页（否则图像将无法显示）。`);
          } catch (e) { w.close(); throw e; }
        }, view);
      };
      dup.onclick = () => guarded('正在复制', async () => {
        const id = await T.duplicateSession(s.id);
        msg(`已复制：${id}\n重新加载页面后，上方的历史列表会更新。`, false, true);
        await render();
      }, dup);
      exp.onclick = () => guarded('正在导出', async () => {
        const { blob, filename } = await T.exportSessionZip(s.id);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
        msg(`已保存：${filename} (${(blob.size / 1048576).toFixed(1)}MB)`);
      }, exp);
      act.append(view, dup, exp);
      row.append(thumb, info, act);
      list.append(row);
      rows.push({ session: s, info, dup });
    }
    if (!sessions.length) list.textContent = '暂无历史';

    const applyQuota = async () => {
      let q;
      try { q = await T.quotaInfo(); } catch (e) { if (token === renderToken) msg(e.message, true); return; }
      if (token !== renderToken) return;
      renderQuota(q);
      for (const { session, info, dup } of rows) {
        const size = q.bySession.get(session.id) || 0;
        info.firstChild.textContent = `${session.name || 'History'} / ${session.imageCount ?? '?'} 张 / ${fb(size)}`;
        const blocked = q.used + size > q.quota;
        lock(dup, blocked, `复制后将超出上限（当前 ${fb(q.used)} ＋ ${fb(size)} > 上限 ${fb(q.quota)}）`);
        if (blocked) dup.textContent = '不可复制';
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(applyQuota, { timeout: 400 });
    } else {
      setTimeout(applyQuota, 30);
    }
  }

  $('#rel').onclick = render;
  $('#qsave').onclick = () => {
    const v = parseFloat($('#qin').value);
    if (!(v > 0)) { msg('上限必须是以 GB 为单位的正数。', true); return; }
    T.setQuotaBytes(v * T.GB); msg(`上限已设为 ${v} GB。`); render();
  };
  $('#qauto').onclick = () => { T.setQuotaBytes(null); msg('上限已恢复为默认值（10GB）。'); render(); };
  $('#reload').onclick = () => location.reload();
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    guarded('正在导入', async () => {
      const id = await T.importSessionZip(f);
      msg(`已导入：${id}\n重新加载页面后，上方的历史列表会更新。`, false, true);
      await render();
    }, $('#imp'));
  };

  let wasShown = false;
  let nextDialogScanAt = 0;
  let scanForce = false;
  function resetPanelPin() {
    pinnedDialogInfo = null;
    wasShown = false;
    manualPosition = false;
  }
  function update(force = false) {
    if (!wasShown && !force && Date.now() < nextDialogScanAt) return;
    // 已经打开时只做一次廉价的可见性检查，避免生成过程中反复扫描整页
    // 按钮并重新定位面板。面板位置在打开时固定，不再跟着页面抖动。
    if (wasShown && pinnedDialogInfo) {
      const titleGone = pinnedDialogInfo.title
        && (!pinnedDialogInfo.title.isConnected || !isVisible(pinnedDialogInfo.title));
      const frameGone = !pinnedDialogInfo.element.isConnected
        || pinnedDialogInfo.element === document.body
        || pinnedDialogInfo.element === document.documentElement;
      if (!titleGone && !frameGone && isVisible(pinnedDialogInfo.element)) return;
      hideThemedHost();
      resetPanelPin();
      return;
    }

    const dialog = findDialog();
    if (!dialog) {
      nextDialogScanAt = Date.now() + 1200;
      if (host.style.display !== 'none' || wasShown) hideThemedHost();
      resetPanelPin();
      return;
    }
    nextDialogScanAt = 0;

    if (!wasShown) {
      wasShown = true;
      msg(IDLE);
      render();
      showThemedHost();
      positionPanel(dialog, true);
      return;
    }

    pinnedDialogInfo = dialog;
    if (host.style.display === 'none') showThemedHost();
    positionPanel(dialog, true);
  }
  let timer = 0;
  const schedule = (force = false) => {
    if (force) scanForce = true;
    if (!timer) timer = setTimeout(() => {
      timer = 0;
      const runForce = scanForce;
      scanForce = false;
      update(runForce);
    }, 150);
  };
  new MutationObserver(() => schedule()).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('nai-zh-revealed', () => schedule(true));
  addEventListener('resize', () => {
    if (wasShown && pinnedDialogInfo) positionPanel(pinnedDialogInfo, true);
    else schedule(true);
  });
  msg(IDLE);
  schedule(true);
})();

