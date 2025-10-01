/**
 * Convert a simple wildcard (e.g., *://*.service-now.com/*) into RegExp.
 * Escapes regex chars, replaces * with .*
 * @param {string} pattern
 * @returns {RegExp}
 */
export function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const re = '^' + escaped.replace(/\*/g, '.*') + '$';
  return new RegExp(re);
}

/**
 * Test a URL against an array of wildcard patterns.
 * @param {string[]} patterns
 * @param {string} url
 */
export function urlMatches(patterns, url) {
  return patterns.some((p) => wildcardToRegExp(p).test(url));
}
