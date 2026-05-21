const crypto = require('crypto');

const STORE_KEY = 'machineId';

function getMachineId(store) {
  return store.get(STORE_KEY) || null;
}

function hasMachineId(store) {
  return !!store.get(STORE_KEY);
}

/** Generate once per install; returns existing ID if already set. */
function generateMachineId(store) {
  const existing = store.get(STORE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(STORE_KEY, id);
  return id;
}

module.exports = {
  getMachineId,
  hasMachineId,
  generateMachineId,
};
