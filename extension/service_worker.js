
const DEFAULT_API = 'http://localhost:3001';
async function getApi() {
  return new Promise(resolve => chrome.storage.sync.get(['API_BASE'], v => resolve(v.API_BASE || DEFAULT_API)));
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    const api = await getApi();
    const resp = await fetch(`${api}/scan-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: details.url })
    });
    const data = await resp.json();
    if (data.verdict === 'block' || data.verdict === 'warn') {
      const url = chrome.runtime.getURL('block.html') + `?host=${encodeURIComponent(data.host)}&why=${encodeURIComponent((data.reasons||[]).join(','))}&v=${data.verdict}`;
      chrome.tabs.update(details.tabId, { url });
    }
  } catch (e) {
    // fail open
  }
});
