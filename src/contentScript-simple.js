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
  
  // Wait for page to load, then enhance
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceMessageColumnWithMonaco);
  } else {
    // Page already loaded, wait a bit for dynamic content
    setTimeout(enhanceMessageColumnWithMonaco, 1000);
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
    enhanceMessageColumnWithMonaco();
  });
  
  document.body.appendChild(button);
}

// ---------- 1) Find the next JSON slice at/after a given offset ----------
function findNextJSON(str, from = 0) {
  while (from < str.length) {
    const iObj = str.indexOf('{', from);
    const iArr = str.indexOf('[', from);
    const starts = [iObj, iArr].filter(i => i !== -1);
    if (!starts.length) return null;
    const start = Math.min(...starts);
    const open = str[start];
    const close = open === '{' ? '}' : ']';

    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < str.length; i++) {
      const ch = str[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === open) depth++;
      else if (ch === close) depth--;
      if (depth === 0) {
        const slice = str.slice(start, i + 1);
        try {
          const obj = JSON.parse(slice);
          return { ok: true, start, end: i, pretty: JSON.stringify(obj, null, 2), nextFrom: i + 1 };
        } catch (e) {
          // Balanced but not valid JSON: skip this and continue after end
          return { ok: false, start, end: i, error: e.message, nextFrom: i + 1 };
        }
      }
    }
    // Unbalanced from this start — move past it and keep searching
    from = start + 1;
  }
  return null;
}

// ---------- 2) Monaco loader (local files to bypass CSP) ----------
function ensureMonaco() {
  if (window.monaco && monaco.editor) return Promise.resolve();

  console.log('NowLogBooster: Loading Monaco from local extension files...');

  // Get the extension URL for Monaco files
  const monacoBase = chrome.runtime.getURL('monaco');

  // Inject CSS first
  if (!document.getElementById('monaco-css')) {
    const link = document.createElement('link');
    link.id = 'monaco-css';
    link.rel = 'stylesheet';
    link.href = `${monacoBase}/vs/editor/editor.main.css`;
    document.head.appendChild(link);
  }

  // Setup Monaco environment
  self.MonacoEnvironment = {
    getWorkerUrl: (moduleId, label) => {
      // Map specific workers to extension URLs
      const workerMap = {
        'json': `${monacoBase}/vs/language/json/json.worker.js`,
        'css': `${monacoBase}/vs/language/css/css.worker.js`,
        'html': `${monacoBase}/vs/language/html/html.worker.js`,
        'ts': `${monacoBase}/vs/language/typescript/ts.worker.js`,
        'js': `${monacoBase}/vs/language/typescript/ts.worker.js`
      };
      
      return workerMap[label] || `${monacoBase}/vs/editor/editor.worker.js`;
    }
  };

  return new Promise((resolve, reject) => {
    // Load the Monaco loader from extension files
    if (document.getElementById('monaco-loader')) {
      // Loader already exists, but make sure require is available
      if (typeof require === 'function') {
        require(['vs/editor/editor.main'], () => {
          console.log('NowLogBooster: Monaco loaded successfully from extension files!');
          resolve();
        }, reject);
      } else {
        // Wait for require to become available
        const waitForRequire = () => {
          if (typeof require === 'function') {
            require(['vs/editor/editor.main'], () => {
              console.log('NowLogBooster: Monaco loaded successfully from extension files!');
              resolve();
            }, reject);
          } else {
            setTimeout(waitForRequire, 50);
          }
        };
        waitForRequire();
      }
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'monaco-loader';
    script.src = `${monacoBase}/vs/loader.js`;
    script.onload = () => {
      console.log('NowLogBooster: Monaco loader script loaded');
      // Wait for require to become available after loader loads
      const waitForRequire = () => {
        if (typeof require === 'function') {
          console.log('NowLogBooster: require function is available, configuring paths...');
          // Configure require paths
          require.config({
            paths: { vs: `${monacoBase}/vs` }
          });
          
          console.log('NowLogBooster: Loading Monaco editor main...');
          require(['vs/editor/editor.main'], () => {
            console.log('NowLogBooster: Monaco loaded successfully from extension files!');
            resolve();
          }, (error) => {
            console.error('NowLogBooster: Error loading Monaco main:', error);
            reject(error);
          });
        } else {
          console.log('NowLogBooster: Waiting for require function...');
          setTimeout(waitForRequire, 50);
        }
      };
      waitForRequire();
    };
    script.onerror = (error) => {
      console.error('NowLogBooster: Failed to load Monaco loader:', error);
      reject(new Error('Failed to load Monaco loader'));
    };
    console.log('NowLogBooster: Loading Monaco loader from:', script.src);
    document.head.appendChild(script);
  });
}

// ---------- 3) Minimal CSS for inline editors ----------
(function ensureInlineCss(){
  if (document.getElementById('sn-monaco-inline-css')) return;
  const st = document.createElement('style');
  st.id = 'sn-monaco-inline-css';
  st.textContent = `
    .sn-monaco-inline { margin: 6px 0; border: 1px solid #ddd; border-radius: 4px; background: rgba(0,0,0,0.04); }
    .sn-monaco-editor { height: 0px; } /* set dynamically per content */
  `;
  document.head.appendChild(st);
})();

// ---------- 4) Replace ALL JSON substrings in a TD with Monaco viewers ----------
function replaceAllJsonWithMonacoInTd(td) {
  // Walk text nodes first so we don't match inside the editors we insert
  const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n; while ((n = walker.nextNode())) textNodes.push(n);

  textNodes.forEach(node => {
    if (!node.isConnected) return;
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    // Find all valid JSON slices inside this text node
    let pos = 0;
    const parts = [];              // sequence of {type:'text'|'json', value}
    const editorsToInit = [];      // later init monaco after insertion

    while (true) {
      const found = findNextJSON(text, pos);
      if (!found) { // no more JSON
        const tail = text.slice(pos);
        if (tail) parts.push({ type: 'text', value: tail });
        break;
      }
      // push text before JSON
      if (found.start > pos) parts.push({ type: 'text', value: text.slice(pos, found.start) });

      if (found.ok) {
        // a placeholder to mount monaco later
        parts.push({ type: 'json', pretty: found.pretty });
      } else {
        // invalid JSON — keep original substring as text
        parts.push({ type: 'text', value: text.slice(found.start, found.end + 1) });
      }
      pos = found.nextFrom;
    }

    // If we didn't find any JSON in this text node, skip
    if (!parts.some(p => p.type === 'json')) return;

    // Build replacement fragment
    const frag = document.createDocumentFragment();
    parts.forEach(p => {
      if (p.type === 'text') {
        frag.appendChild(document.createTextNode(p.value));
      } else {
        const wrap = document.createElement('div'); wrap.className = 'sn-monaco-inline';
        const container = document.createElement('div'); container.className = 'sn-monaco-editor';
        wrap.appendChild(container);
        frag.appendChild(wrap);
        editorsToInit.push({ container, pretty: p.pretty });
      }
    });

    // Replace the original text node with our fragment
    node.parentNode.replaceChild(frag, node);

        // Init all editors via page bundle (after containers exist in DOM)
        editorsToInit.forEach(({ container, pretty }) => {
          const editorId = `nlb_${Math.random().toString(36).slice(2)}`;
          container.setAttribute('data-nowlogbooster-editor', editorId);
          window.postMessage({
            type: 'NOWLOGBOOSTER_CREATE_EDITOR',
            editorId,
            jsonContent: pretty,
          }, '*');
        });
  });
}

// ---------- 5) Find "Message" column and enhance every cell ----------
async function enhanceMessageColumnWithMonaco() {
  console.log('NowLogBooster: Looking for Message column...');
  
  try {
    if (!pageBundleReady) {
      console.log('NowLogBooster: Waiting for page bundle to be ready...');
      await new Promise((res) => {
        const t = setInterval(() => {
          if (pageBundleReady) { clearInterval(t); res(); }
        }, 50);
      });
    }
    console.log('NowLogBooster: Page bundle ready, proceeding to enhance');

    // Try multiple selectors for finding the Message column header
    const selectors = [
      'thead th[name="message"]',
      'thead th:contains("Message")',
      'th[data-field="message"]',
      '.list_header_cell:contains("Message")'
    ];
    
    let th = null;
    let ths = [];
    
    // Try each selector
    for (const selector of selectors) {
      if (selector.includes(':contains')) {
        // Manual contains check since CSS doesn't support :contains
        ths = Array.from(document.querySelectorAll('thead th, .list_header_cell'));
        th = ths.find(t => t.textContent.trim().toLowerCase().includes('message'));
        if (th) break;
      } else {
        th = document.querySelector(selector);
        if (th) {
          ths = Array.from(document.querySelectorAll('thead th, .list_header_cell'));
          break;
        }
      }
    }
    
    if (!th) {
      console.log('NowLogBooster: Message column not found. Available headers:', 
        Array.from(document.querySelectorAll('thead th, .list_header_cell')).map(h => h.textContent.trim()));
      showNotification('🔍 Message column not found', '#ff9900');
      return;
    }
    
    console.log('NowLogBooster: Found Message column:', th.textContent.trim());
    const colIndex = ths.indexOf(th) + 1;
    
    const messageCells = document.querySelectorAll(`tbody tr td:nth-child(${colIndex}), .list_row .list_cell:nth-child(${colIndex})`);
    console.log('NowLogBooster: Found', messageCells.length, 'message cells');
    
    let enhancedCount = 0;
    messageCells.forEach(td => {
      // Skip if already enhanced
      if (td.querySelector('.sn-monaco-editor')) return;
      
      const originalText = td.textContent.trim();
      if (originalText && (originalText.includes('{') || originalText.includes('['))) {
        replaceAllJsonWithMonacoInTd(td);
        enhancedCount++;
      }
    });
    
    if (enhancedCount > 0) {
      showNotification(`🚀 Enhanced ${enhancedCount} JSON logs!`, '#00cc00');
    } else {
      showNotification('🔍 No JSON found in Message cells', '#ff9900');
    }
    
  } catch (error) {
    console.error('NowLogBooster: Error enhancing columns:', error);
    showNotification('❌ Error loading Monaco Editor', '#cc0000');
  }
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