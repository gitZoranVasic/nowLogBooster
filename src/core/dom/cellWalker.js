const PROCESSED_ATTR = 'data-nlb-processed';

/**
 * Yield candidate cells for enhancement, skipping ones already processed.
 * @param {Element} root
 * @param {number} colIndex - 1-based column index
 */
export function* walkMessageCells(root, colIndex) {
  const sel = `tbody tr td:nth-child(${colIndex}), .list_row .list_cell:nth-child(${colIndex})`;
  const cells = root.querySelectorAll(sel);
  for (const td of cells) {
    if (td.getAttribute(PROCESSED_ATTR) === '1') continue;
    yield td;
  }
}

/**
 * Mark a cell as processed to ensure idempotency across re-runs.
 */
export function markProcessed(td) {
  td.setAttribute(PROCESSED_ATTR, '1');
}
