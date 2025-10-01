console.log('NowLogBooster: Content script loaded!');

// Run in all frames now to handle ServiceNow's complex iframe structure
initNowLogBooster();

let monacoLoaded = false;

function initNowLogBooster() {
  console.log('NowLogBooster: Initializing...');
  
  // Listen for Monaco ready signal
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type === 'NOWLOGBOOSTER_MONACO_READY') {
      console.log('NowLogBooster: Received Monaco ready signal');
      monacoLoaded = true;
      replaceJsonWithMonaco();
    }
  });
  
  // Load Monaco scripts
  loadMonacoScripts();
}

// Load Monaco scripts by injecting script tags with src (not inline)
function loadMonacoScripts() {
  console.log('NowLogBooster: Loading Monaco...');
  
  const monacoUrl = chrome.runtime.getURL('monaco/vs');
  
  // Step 1: Inject Monaco loader script into the page
  const loaderScript = document.createElement('script');
  loaderScript.src = chrome.runtime.getURL('monaco/vs/loader.js');
  loaderScript.onload = function() {
    console.log('NowLogBooster: Monaco loader script loaded');
    
    // Step 2: Inject Monaco initialization script (with delay like SN-Utils does - 600ms)
    setTimeout(function() {
      const initScript = document.createElement('script');
      initScript.src = chrome.runtime.getURL('monaco-init.js');
      initScript.dataset.monacoUrl = monacoUrl;
      document.head.appendChild(initScript);
    }, 600);
  };
  
  document.head.appendChild(loaderScript);
  
  // Add a test button to verify the extension is working
  addTestButton();
}

// Add a visible test button to the page
function addTestButton() {
  // Don't add multiple buttons
  if (document.querySelector('#nowlogbooster-test-btn')) {
    return;
  }
  
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
    alert('NowLogBooster is active!\n\nMono ready: ' + monacoLoaded + '\nURL: ' + window.location.href);
  });
  
  document.body.appendChild(button);
}

// ---------- Utilities ----------
function findNextJSON(str, from = 0) {
  while (from < str.length) {
    const objectStart = str.indexOf('{', from);
    const arrayStart = str.indexOf('[', from);
    const candidates = [objectStart, arrayStart].filter((index) => index !== -1);
    if (!candidates.length) return null;

    const start = Math.min(...candidates);
    const opener = str[start];
    const closer = opener === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < str.length; i++) {
      const ch = str[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === opener) {
        depth += 1;
      } else if (ch === closer) {
        depth -= 1;
      }

      if (depth === 0) {
        const slice = str.slice(start, i + 1);
        try {
          const parsed = JSON.parse(slice);
          return {
            ok: true,
            start,
            end: i,
            pretty: JSON.stringify(parsed, null, 2),
            raw: slice,
            nextFrom: i + 1
          };
        } catch (error) {
          return { ok: false, start, end: i, error: error.message, nextFrom: i + 1 };
        }
      }
    }

    from = start + 1;
  }

  return null;
}

// Replace JSON text with Monaco editors
function replaceJsonWithMonaco() {
  if (!monacoLoaded) {
    console.log('NowLogBooster: Monaco not loaded yet, waiting...');
    return;
  }

  console.log('NowLogBooster: Looking for JSON to replace with Monaco...');
  
  // Try multiple strategies to find the table
  let headers = Array.from(document.querySelectorAll('thead th'));
  
  if (headers.length === 0) {
    // Try alternative selectors for ServiceNow's dynamic UI
    headers = Array.from(document.querySelectorAll('th[role="columnheader"]'));
    console.log('NowLogBooster: Using role="columnheader" selector, found:', headers.length);
  }
  
  if (headers.length === 0) {
    console.log('NowLogBooster: No table headers found. Waiting for DOM...');
    // Retry after a delay
    setTimeout(replaceJsonWithMonaco, 1000);
    return;
  }
  
  console.log('NowLogBooster: Found', headers.length, 'headers');
  
  // Find the Message column header
  const targetHeader = headers.find((th) => {
    const byName = th.getAttribute('name');
    if (byName && byName.toLowerCase() === 'message') return true;
    const byGlideLabel = th.getAttribute('glide_label');
    if (byGlideLabel && byGlideLabel.toLowerCase() === 'message') return true;
    const text = th.textContent ? th.textContent.trim().toLowerCase() : '';
    return text === 'message';
  });

  if (!targetHeader) {
    console.log('NowLogBooster: Message column not found. Headers:', headers.map(h => ({
      name: h.getAttribute('name'),
      glide_label: h.getAttribute('glide_label'),
      text: h.textContent?.trim()
    })));
    showNotification(`🔍 NowLogBooster: Message column not found`, '#ff9900');
    return 0;
  }

  console.log('NowLogBooster: Found Message column header:', targetHeader);
  
  const columnIndex = headers.indexOf(targetHeader) + 1;
  const cells = document.querySelectorAll(`tbody tr td:nth-child(${columnIndex})`);
  
  console.log('NowLogBooster: Found', cells.length, 'cells in Message column');
  
  let replacedCount = 0;

  cells.forEach((cell, idx) => {
    // Skip if already processed
    if (cell.dataset.nowlogboosterProcessed) return;

    const cellText = cell.textContent || '';
    if (!cellText) return;
    
    // Quick check for JSON-like content
    if (!cellText.includes('{') && !cellText.includes('[')) return;

    // Try to find JSON in the cell
    const jsonMatch = findNextJSON(cellText, 0);
    
    if (jsonMatch && jsonMatch.ok) {
      // Mark as processed
      cell.dataset.nowlogboosterProcessed = 'true';
      
      // Create container for Monaco
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '300px';
      container.style.border = '1px solid #ccc';
      container.id = `monaco-container-${idx}`;
      
      // Clear cell and add container
      cell.innerHTML = '';
      cell.appendChild(container);
      
      // Store the JSON data as a data attribute
      container.dataset.jsonContent = jsonMatch.pretty;
      
      // Signal the page to create the editor using postMessage
      window.postMessage({
        type: 'NOWLOGBOOSTER_CREATE_EDITOR',
        editorId: editorId,
        jsonContent: jsonMatch.pretty
      }, '*');
      
      replacedCount += 1;
    }
  });

  console.log('NowLogBooster: Replaced', replacedCount, 'JSON cells with Monaco');
  
  if (replacedCount > 0) {
    showNotification(`🚀 NowLogBooster: Enhanced ${replacedCount} JSON log entries!`, '#00cc00');
  } else {
    showNotification(`🔍 NowLogBooster: No JSON found in logs`, '#ff9900');
  }
  
  return replacedCount;
}

function showNotification(message, color) {
  const box = document.createElement('div');
  box.innerHTML = message;
  box.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
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

function initialize() {
  console.log('NowLogBooster: Initializing...');
  loadMonacoScripts();
  showNotification(`🚀 NowLogBooster: Loading Monaco editor...`, '#0066cc');
}

// Start when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
