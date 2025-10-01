/**
 * Scan a string for balanced JSON blocks starting at/after offset.
 * Returns iterator of segments: { ok, start, end, pretty?, error? }
 * - ok=true: valid JSON slice with pretty
 * - ok=false: balanced but invalid JSON slice
 *
 * Usage:
 *   for (const seg of scanJsonSegments(text)) { ... }
 */
export function* scanJsonSegments(str) {
  let from = 0;
  while (from < str.length) {
    const iObj = str.indexOf('{', from);
    const iArr = str.indexOf('[', from);
    const starts = [iObj, iArr].filter((i) => i !== -1);
    if (!starts.length) break;
    const start = Math.min(...starts);
    const open = str[start];
    const close = open === '{' ? '}' : ']';

    let depth = 0, inStr = false, esc = false;
    let end = -1;
    for (let i = start; i < str.length; i++) {
      const ch = str[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') {
        inStr = true;
      } else if (ch === open) {
        depth++;
      } else if (ch === close) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end === -1) {
      from = start + 1;
      continue;
    }
    const slice = str.slice(start, end + 1);
    try {
      const obj = JSON.parse(slice);
      const pretty = JSON.stringify(obj, null, 2);
      yield { ok: true, start, end, pretty };
    } catch (e) {
      yield { ok: false, start, end, error: e && e.message };
    }
    from = end + 1;
  }
}
