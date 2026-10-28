const ALLOWED_HOSTS = new Set([
  'danbooru.donmai.us',
  'gelbooru.com',
  'raw.githubusercontent.com',
  'cdn.jsdelivr.net',
]);

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname);
  } catch (_) {
    return false;
  }
}

async function fetchText(url, headers, timeout) {
  if (!isAllowedUrl(url)) {
    return { ok: false, status: 0, statusText: '不允许的请求地址' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow',
      headers,
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error && error.name === 'AbortError' ? '请求超时' : '网络错误',
    };
  } finally {
    clearTimeout(timer);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  if (message.type === 'NAI_FETCH') {
    fetchText(message.url, message.headers || {}, Math.min(Number(message.timeout) || 20000, 30000))
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false, status: 0, statusText: '网络错误' }));
    return true;
  }

  if (message.type === 'NAI_OPEN_TAB') {
    try {
      const url = new URL(String(message.url));
      if (url.protocol !== 'https:' || url.hostname !== 'danbooru.donmai.us') {
        throw new Error('invalid url');
      }
      chrome.tabs.create({ url: url.href, active: message.active !== false });
      sendResponse({ ok: true });
    } catch (_) {
      sendResponse({ ok: false });
    }
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://novelai.net/image', active: true });
});
