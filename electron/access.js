const { ACCESS_CONFIG_URL, OFFLINE_GRACE_MS } = require('./config');

const DEFAULT_BLOCKED_MESSAGE =
  'Support has expired. Contact Developer Pac.';

const DEFAULT_CONTACT_MESSAGE =
  'Contact Developer Pac to activate this device.';

const DEFAULT_OFFLINE_MESSAGE =
  'Unable to verify access. Check your internet connection and try again. Contact Developer Pac.';

function isPlaceholderUrl(url) {
  return !url || url.includes('YOUR_GITHUB_USER');
}

function evaluateUserAccess(data, machineId) {
  if (!machineId) {
    return {
      allowed: false,
      message: DEFAULT_CONTACT_MESSAGE,
      reason: 'no_machine_id',
    };
  }

  const users = data.users && typeof data.users === 'object' ? data.users : {};
  const entry = users[machineId];

  if (!entry) {
    return {
      allowed: false,
      message:
        (typeof data.contactMessage === 'string' && data.contactMessage.trim()) ||
        DEFAULT_CONTACT_MESSAGE,
      reason: 'not_registered',
    };
  }

  if (entry.allowed === false) {
    return {
      allowed: false,
      message:
        (typeof entry.message === 'string' && entry.message.trim()) ||
        (typeof data.message === 'string' && data.message.trim()) ||
        DEFAULT_BLOCKED_MESSAGE,
      reason: 'blocked',
    };
  }

  return {
    allowed: true,
    message: '',
    reason: 'ok',
    name: entry.name || null,
  };
}

async function fetchRemoteConfig(url) {
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

    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * @param {import('electron-store')} store
 * @param {{ skip?: boolean, machineId?: string | null }} options
 */
async function checkAccess(store, options = {}) {
  if (options.skip) {
    return { allowed: true, message: '', source: 'skipped', reason: 'skipped' };
  }

  const machineId = options.machineId ?? null;

  if (!machineId) {
    return {
      allowed: false,
      message: DEFAULT_CONTACT_MESSAGE,
      source: 'local',
      reason: 'no_machine_id',
      needsActivation: true,
    };
  }

  let data;
  try {
    data = await fetchRemoteConfig(ACCESS_CONFIG_URL);
  } catch (err) {
    const cached = store.get('accessCache');
    const cacheAge = cached?.checkedAt ? Date.now() - cached.checkedAt : Infinity;
    const cacheValid =
      cached &&
      cached.machineId === machineId &&
      cacheAge < OFFLINE_GRACE_MS;

    if (cacheValid) {
      return {
        allowed: cached.allowed,
        message: cached.message,
        source: 'cache',
        offline: true,
        reason: cached.reason,
        machineId,
      };
    }

    return {
      allowed: false,
      message: DEFAULT_OFFLINE_MESSAGE,
      source: 'offline',
      error: err.message,
      reason: 'offline',
      machineId,
    };
  }

  if (data.active === false) {
    const message =
      (typeof data.message === 'string' && data.message.trim()) ||
      DEFAULT_BLOCKED_MESSAGE;
    store.set('accessCache', {
      allowed: false,
      message,
      checkedAt: Date.now(),
      machineId,
      reason: 'global_off',
    });
    return {
      allowed: false,
      message,
      source: 'remote',
      reason: 'global_off',
      machineId,
    };
  }

  const userResult = evaluateUserAccess(data, machineId);

  store.set('accessCache', {
    allowed: userResult.allowed,
    message: userResult.message,
    checkedAt: Date.now(),
    machineId,
    reason: userResult.reason,
  });

  return {
    allowed: userResult.allowed,
    message: userResult.message,
    source: 'remote',
    reason: userResult.reason,
    machineId,
    userName: userResult.name,
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
  DEFAULT_CONTACT_MESSAGE,
};
