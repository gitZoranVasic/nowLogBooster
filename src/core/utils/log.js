/**
 * Tiny namespaced logger with levels.
 * Levels: error(0), warn(1), info(2), debug(3)
 * Usage: const log = createLogger('NLB'); log.debug('...')
 */
export function createLogger(ns, level = 2) {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const out = {};
  Object.keys(levels).forEach((k) => {
    out[k] = (...args) => {
      if (levels[k] <= level) {
        // eslint-disable-next-line no-console
        console[k === 'debug' ? 'log' : k](`[${ns}]`, ...args);
      }
    };
  });
  out.setLevel = (lv) => (level = lv);
  return out;
}
