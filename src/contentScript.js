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

// ---------- 2) CSS for inline JSON viewers ----------
(function ensureInlineCss(){
  if (document.getElementById('sn-json-inline-css')) return;
  const st = document.createElement('style');
  st.id = 'sn-json-inline-css';
  st.textContent = `
    .sn-json-inline { 
      margin: 6px 0; 
      border: 1px solid #0066cc; 
      border-radius: 4px; 
      background: rgba(0, 102, 204, 0.05);
      position: relative;
    }
    .sn-json-viewer { 
      background: #f8f9fa;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      padding: 8px;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 200px;
      overflow-y: auto;
      color: #333;
    }
    .sn-json-header {
      background: #0066cc;
      color: white;
      font-size: 11px;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 3px 3px 0 0;
      margin: 0;
    }
    .sn-json-toggle {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      float: right;
      font-size: 11px;
      padding: 0;
    }
    .sn-json-viewer.collapsed {
      max-height: 40px;
      overflow: hidden;
    }
  `;
  document.head.appendChild(st);
})();

// ---------- 3) Replace ALL JSON substrings in a TD with enhanced viewers ----------
function replaceAllJsonWithViewersInTd(td) {
  // Walk text nodes first so we don't match inside the viewers we insert
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
        parts.push({ type: 'json', pretty: found.pretty, original: text.slice(found.start, found.end + 1) });
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
    parts.forEach((p, index) => {
      if (p.type === 'text') {
        frag.appendChild(document.createTextNode(p.value));
      } else {
        const wrap = document.createElement('div'); 
        wrap.className = 'sn-json-inline';
        
        const header = document.createElement('div');
        header.className = 'sn-json-header';
        header.innerHTML = `JSON Object <button class="sn-json-toggle" onclick="this.parentNode.nextSibling.classList.toggle('collapsed'); this.textContent = this.textContent === '▼' ? '▲' : '▼'">▼</button>`;
        
        const viewer = document.createElement('pre');
        viewer.className = 'sn-json-viewer';
        viewer.textContent = p.pretty;
        
        wrap.appendChild(header);
        wrap.appendChild(viewer);
        frag.appendChild(wrap);
      }
    });

    // Replace the original text node with our fragment
    node.parentNode.replaceChild(frag, node);
  });
}

// ---------- 4) Find "Message" column and enhance every cell ----------
function enhanceMessageColumnWithViewers() {
  const frameInfo = window === window.parent ? 'main frame' : 'iframe'
  console.log(`NowLogBooster: Starting JSON enhancement in ${frameInfo}`)
  console.log(`NowLogBooster: Frame URL: ${window.location.href}`)

  const ths = Array.from(document.querySelectorAll('thead th'));
  const th = ths.find(t => t.getAttribute('name') === 'message' || t.textContent.trim() === 'Message');
  
  if (!th) {
    console.log('NowLogBooster: No "Message" column found')
    return 0;
  }
  
  console.log('NowLogBooster: Found Message column!')
  const colIndex = ths.indexOf(th) + 1;
  const messageCells = document.querySelectorAll(`tbody tr td:nth-child(${colIndex})`);
  
  console.log(`NowLogBooster: Found ${messageCells.length} message cells to enhance`)
  
  let enhancedCount = 0;
  messageCells.forEach(td => {
    // Skip if already enhanced
    if (td.querySelector('.sn-json-viewer')) return;
    
    const originalText = td.textContent;
    if (originalText && (originalText.includes('{') || originalText.includes('['))) {
      replaceAllJsonWithViewersInTd(td);
      enhancedCount++;
    }
  });
  
  console.log(`NowLogBooster: Enhanced ${enhancedCount} cells with JSON content`)
  return enhancedCount;
}


// Function to observe for dynamically added content
function observeForNewContent() {
  const observer = new MutationObserver((mutations) => {
    let hasNewTableContent = false
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node
          // Look for table content changes
          if (element.tagName === 'TD' || element.tagName === 'TH' || 
              element.querySelectorAll('td, th, tbody').length > 0) {
            hasNewTableContent = true
          }
        }
      })
    })
    
    if (hasNewTableContent) {
      console.log('NowLogBooster: New table content detected, re-enhancing')
      setTimeout(enhanceMessageColumnWithViewers, 1000) // Delay to let DOM settle
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  console.log('NowLogBooster: Started observing for new content')
}

// Function to retry enhancement multiple times
function retryEnhancement() {
  let attempts = 0
  const maxAttempts = 8
  const retryInterval = 2000 // 2 seconds between attempts
  
  function tryEnhance() {
    attempts++
    console.log(`NowLogBooster: Attempt ${attempts}/${maxAttempts} to enhance JSON content`)
    
    const enhancedCount = enhanceMessageColumnWithViewers()
    
    if (enhancedCount > 0) {
      console.log(`NowLogBooster: Success! Enhanced ${enhancedCount} cells on attempt ${attempts}`)
      
      // Show success notification
      showNotification(`🚀 NowLogBooster: Enhanced ${enhancedCount} JSON log entries!`, '#0066cc')
      return // Stop retrying once we enhance something
    }
    
    if (attempts < maxAttempts) {
      setTimeout(tryEnhance, retryInterval)
    } else {
      console.log('NowLogBooster: No JSON content found after all attempts.')
      showNotification('⏳ NowLogBooster: No JSON logs found to enhance', '#ff6600')
    }
  }
  
  tryEnhance()
}

// Function to show notification
function showNotification(message, color) {
  const notification = document.createElement('div')
  notification.innerHTML = message
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${color};
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
  `
  document.body.appendChild(notification)
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 4000)
}

// Initialize the script
function initialize() {
  console.log('NowLogBooster: JSON Enhancement script loaded!')
  
  // Start observing for new content immediately
  observeForNewContent()
  
  // Start the retry enhancement mechanism
  retryEnhancement()
}

// Wait for the page to load and then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}