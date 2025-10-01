/**
 * Find a table-like region and resolve the column index for a header name.
 * Returns { tableEl, headers, index } or null if not found.
 * Looks for various ServiceNow list/table patterns.
 */
export function findTableAndMessageIndex(doc = document) {
  const headerCandidates = Array.from(doc.querySelectorAll('thead th, .list_header_cell'));
  if (!headerCandidates.length) return null;
  const headers = headerCandidates.map((h) => h.textContent.trim().toLowerCase());
  let index = headers.findIndex((txt) => txt.includes('message'));
  if (index === -1) return null;
  index = index + 1; // nth-child is 1-based
  const tableEl = doc.querySelector('table.list_table, table[data-list_id], table');
  return { tableEl, headers: headerCandidates, index };
}
