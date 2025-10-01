console.log('NowLogBooster: Content script loaded!');

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

// ---------- Simple red border highlighting ----------
function highlightJsonCells() {
  console.log('NowLogBooster: Looking for Message column...');
  
  // Find the Message column header
  const headers = Array.from(document.querySelectorAll('thead th'));
  console.log('NowLogBooster: Found headers:', headers.length);
  
  const targetHeader = headers.find((th) => {
    const byName = th.getAttribute('name');
    if (byName && byName.toLowerCase() === 'message') return true;
    const text = th.textContent ? th.textContent.trim().toLowerCase() : '';
    return text === 'message';
  });

  if (!targetHeader) {
    console.log('NowLogBooster: Message column not found');
    return 0;
  }

  console.log('NowLogBooster: Found Message column:', targetHeader);
  
  const columnIndex = headers.indexOf(targetHeader) + 1;
  const cells = document.querySelectorAll(`tbody tr td:nth-child(${columnIndex})`);
  console.log('NowLogBooster: Found cells in Message column:', cells.length);

  let highlightedCount = 0;

  cells.forEach((cell) => {
    // Skip if already highlighted
    if (cell.style.border && cell.style.border.includes('red')) return;

    const cellText = cell.textContent || '';
    if (!cellText) return;
    
    // Quick check for JSON-like content
    if (!cellText.includes('{') && !cellText.includes('[')) return;

    // Try to find JSON in the cell
    const jsonMatch = findNextJSON(cellText, 0);
    
    if (jsonMatch && jsonMatch.ok) {
      // Add red border to indicate JSON was found
      cell.style.border = '3px solid red';
      cell.style.padding = '8px';
      cell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      highlightedCount += 1;
      console.log('NowLogBooster: Highlighted cell with JSON:', cell);
    }
  });

  console.log('NowLogBooster: Highlighted', highlightedCount, 'cells');
  return highlightedCount;
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
  
  const initialCount = highlightJsonCells();
  
  if (initialCount > 0) {
    showNotification(`🚀 NowLogBooster: Found ${initialCount} JSON log entries!`, '#ff0000');
  } else {
    showNotification(`🔍 NowLogBooster: No JSON found yet`, '#ff9900');
  }
}

// Start when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
