import { enhanceMessageCells } from './features/messageJson/controllers/enhanceMessageCells';
import './features/messageJson/styles/monacoInline.css';

console.log('NowLogBooster: Simple content script loaded!');

let pageBundleReady = false;
window.addEventListener('message', (ev) => {
  if (!ev || !ev.data || ev.source !== window) return;
  if (ev.data.type === 'NOWLOGBOOSTER_MONACO_READY') {
    pageBundleReady = true;
    console.log('NowLogBooster: Page bundle reported ready');
  }
});

const enabledKey = 'nowlogbooster_enabled';
chrome.storage.sync.get({ [enabledKey]: true }, (res) => {
  const enabled = !!res[enabledKey];
  if (!enabled) {
    console.log('NowLogBooster: Disabled by user setting');
    return;
  }
  // Prevent multiple initializations
  if (window.nowLogBoosterInitialized) {
    console.log('NowLogBooster: Already initialized, skipping');
    return;
  }
  if (!window.location.href.includes('syslog_list.do')) {
    console.log('NowLogBooster: Not on syslog page, exiting');
    return;
  }
  console.log('NowLogBooster: On syslog page, initializing...');
  window.nowLogBoosterInitialized = true;
  initNowLogBooster();
});

function initNowLogBooster() {
  // Add test button first
  addTestButton();
  injectPageBundle();
  setupDynamicObserver();
  
  // Wait for page to load, then enhance
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runEnhancement);
  } else {
    // Page already loaded, wait a bit for dynamic content
    setTimeout(runEnhancement, 1000);
  }
}

function injectPageBundle() {
  if (document.getElementById('nowlogbooster-page-bundle')) return;
  const script = document.createElement('script');
  script.id = 'nowlogbooster-page-bundle';
  script.src = chrome.runtime.getURL('monaco-page-bundle.js');
  script.onload = () => console.log('NowLogBooster: Page bundle injected');
  script.onerror = (e) => console.error('NowLogBooster: Failed to inject page bundle', e);
  (document.head || document.documentElement).appendChild(script);
}

// Add a visible test button
function addTestButton() {
  if (document.querySelector('#nowlogbooster-test-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'nowlogbooster-test-btn';
  button.textContent = '🚀 NowLogBooster Active';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    background: #0066cc;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  button.addEventListener('click', function() {
    console.log('NowLogBooster: Manual trigger button clicked');
    runEnhancement();
  });
  
  document.body.appendChild(button);
}

// Core JSON scanning moved to core/detect/jsonScanner.js

// ---------- Page bundle inject + enhancement orchestration ----------

// CSS is bundled via import './features/messageJson/styles/monacoInline.css'

// Per-cell replacement moved into features/messageJson/controllers/enhanceMessageCells.js

async function runEnhancement() {
  try {
    if (!pageBundleReady) {
      console.log('NowLogBooster: Waiting for page bundle to be ready...');
      await new Promise((res) => {
        const t = setInterval(() => {
          if (pageBundleReady) { clearInterval(t); res(); }
        }, 50);
      });
    }
    const count = enhanceMessageCells();
    if (count > 0) showNotification(`🚀 Enhanced ${count} JSON logs!`, '#00cc00');
    else showNotification('🔍 No JSON found in Message cells', '#ff9900');
  } catch (error) {
    console.error('NowLogBooster: Error enhancing columns:', error);
    showNotification('❌ Error enhancing with Monaco', '#cc0000');
  }
}

// Observe dynamic updates and re-run enhancement with debounce
function setupDynamicObserver() {
  if (window.nowLogBoosterObserver) return;
  let scheduled = false;
  const debouncedRun = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      try { runEnhancement(); } catch (e) { /* noop */ }
    }, 600);
  };

  const observer = new MutationObserver((mutations) => {
    // Only react if rows or cells are added/changed
    for (const m of mutations) {
      if (m.type === 'childList' && (m.addedNodes && m.addedNodes.length)) { debouncedRun(); break; }
      if (m.type === 'attributes' && m.target && (m.target.matches && m.target.matches('td, tr'))) { debouncedRun(); break; }
    }
  });
  try {
    observer.observe(document.body, { subtree: true, childList: true, attributes: false });
    window.nowLogBoosterObserver = observer;
  } catch {}
}

function showNotification(message, color) {
  const box = document.createElement('div');
  box.innerHTML = message;
  box.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    background: ${color};
    color: white;
    padding: 10px 14px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    max-width: 320px;
  `;

  document.body.appendChild(box);

  setTimeout(() => {
    if (box.parentNode) {
      box.parentNode.removeChild(box);
    }
  }, 4000);
}