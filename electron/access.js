const { ACCESS_CONFIG_URL, OFFLINE_GRACE_MS } = require('./config');

const DEFAULT_BLOCKED_MESSAGE =
  'Support has expired. Contact Developer Pac.';

const DEFAULT_OFFLINE_MESSAGE =
  'Unable to verify access. Check your internet connection and try again. Contact Developer Pac.';

function isPlaceholderUrl(url) {
  return !url || url.includes('YOUR_GITHUB_USER');
}

async function fetchRemoteAccess(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Remote config returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const allowed = data.active !== false;
    const message =
      typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : DEFAULT_BLOCKED_MESSAGE;

    return { allowed, message, minVersion: data.minVersion || null };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * @param {import('electron-store')} store
 * @param {{ skip?: boolean }} options
 */
async function checkAccess(store, options = {}) {
  if (options.skip) {
    return { allowed: true, message: '', source: 'skipped' };
  }

  let remote;
  try {
    remote = await fetchRemoteAccess(ACCESS_CONFIG_URL);
  } catch (err) {
    const cached = store.get('accessCache');
    const cacheAge = cached?.checkedAt ? Date.now() - cached.checkedAt : Infinity;

    if (cached && cacheAge < OFFLINE_GRACE_MS) {
      return {
        allowed: cached.allowed,
        message: cached.message,
        source: 'cache',
        offline: true,
      };
    }

    return {
      allowed: false,
      message: cached?.allowed
        ? DEFAULT_OFFLINE_MESSAGE
        : cached?.message || DEFAULT_OFFLINE_MESSAGE,
      source: 'offline',
      error: err.message,
    };
  }

  store.set('accessCache', {
    allowed: remote.allowed,
    message: remote.message,
    checkedAt: Date.now(),
  });

  return {
    allowed: remote.allowed,
    message: remote.message,
    source: 'remote',
    minVersion: remote.minVersion,
  };
}

function shouldSkipAccessCheck(isDev) {
  if (process.env.ENFORCE_ACCESS === '1') return false;
  if (isDev && isPlaceholderUrl(ACCESS_CONFIG_URL)) return true;
  if (isPlaceholderUrl(ACCESS_CONFIG_URL)) return isDev;
  return false;
}

module.exports = {
  checkAccess,
  shouldSkipAccessCheck,
  isPlaceholderUrl,
  ACCESS_CONFIG_URL,
};
