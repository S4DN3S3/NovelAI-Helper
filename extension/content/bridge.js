(function () {
  'use strict';

  const PREFIX = 'nai-ext:';

  function readValue(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeValue(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (_) { }
  }

  globalThis.GM_getValue = function (key, fallback) {
    return readValue(key, fallback);
  };

  globalThis.GM_setValue = function (key, value) {
    writeValue(key, value);
  };

  globalThis.GM_deleteValue = function (key) {
    try { localStorage.removeItem(PREFIX + key); } catch (_) { }
  };

  globalThis.GM_addStyle = function (css) {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    return style;
  };

  globalThis.GM_openInTab = function (url, options) {
    try {
      chrome.runtime.sendMessage({
        type: 'NAI_OPEN_TAB',
        url: String(url),
        active: !options || options.active !== false,
      });
    } catch (_) { }
  };

  globalThis.GM_xmlhttpRequest = function (details) {
    let aborted = false;
    try {
      chrome.runtime.sendMessage({
        type: 'NAI_FETCH',
        url: String(details.url),
        headers: details.headers || {},
        timeout: details.timeout || 20000,
      }, (response) => {
        if (aborted) return;
        if (chrome.runtime.lastError || !response) {
          try { details.onerror && details.onerror({ status: 0, statusText: '网络错误' }); } catch (_) { }
          return;
        }
        const payload = {
          status: response.status || 0,
          statusText: response.statusText || '',
          responseText: response.text || '',
          responseHeaders: response.headers || '',
        };
        if (response.ok) {
          try { details.onload && details.onload(payload); } catch (_) { }
        } else {
          try { details.onerror && details.onerror(payload); } catch (_) { }
        }
      });
    } catch (_) {
      try { details.onerror && details.onerror({ status: 0, statusText: '扩展通信失败' }); } catch (_) { }
    }
    return { abort() { aborted = true; } };
  };
})();
