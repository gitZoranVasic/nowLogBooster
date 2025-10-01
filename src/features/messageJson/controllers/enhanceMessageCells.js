import { findTableAndMessageIndex } from '../../../core/dom/tableLocator';
import { walkMessageCells, markProcessed } from '../../../core/dom/cellWalker';
import { scanJsonSegments } from '../../../core/detect/jsonScanner';

/**
 * Enhance the Message column cells by replacing JSON segments with Monaco viewers.
 * - Idempotent: cells get a data attribute to skip on re-runs.
 * - Multiple JSON per cell supported.
 */
export function enhanceMessageCells() {
  const loc = findTableAndMessageIndex(document);
  if (!loc) return 0;
  const { tableEl, index } = loc;

  let count = 0;
  for (const td of walkMessageCells(tableEl || document, index)) {
    const text = td.textContent || '';
    if (!text || (!text.includes('{') && !text.includes('['))) continue;

    const frag = document.createDocumentFragment();
    let offset = 0;
    const editors = [];
    for (const seg of scanJsonSegments(text)) {
      if (seg.start > offset) frag.appendChild(document.createTextNode(text.slice(offset, seg.start)));
      if (seg.ok) {
        const wrap = document.createElement('div'); wrap.className = 'sn-monaco-inline';
        const container = document.createElement('div'); container.className = 'sn-monaco-editor';
        wrap.appendChild(container); frag.appendChild(wrap);
        editors.push({ container, pretty: seg.pretty });
      } else {
        frag.appendChild(document.createTextNode(text.slice(seg.start, seg.end + 1)));
      }
      offset = seg.end + 1;
    }
    if (offset < text.length) frag.appendChild(document.createTextNode(text.slice(offset)));
    if (!editors.length) continue;

    td.textContent = '';
    td.appendChild(frag);
    markProcessed(td);
    count++;

    // Ask page bundle to create editors in containers
    editors.forEach(({ container, pretty }) => {
      const editorId = `nlb_${Math.random().toString(36).slice(2)}`;
      container.setAttribute('data-nowlogbooster-editor', editorId);
      window.postMessage({ type: 'NOWLOGBOOSTER_CREATE_EDITOR', editorId, jsonContent: pretty }, '*');
    });
  }
  return count;
}
