/**
 * Safely parse a JSON string and return { ok, value?, error? }.
 * @param {string} input
 */
export function tryParseJson(input) {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e) {
    return { ok: false, error: e && e.message };
  }
}

/**
 * Pretty-print a value as JSON with 2-space indent.
 * @param {any} value
 */
export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}
