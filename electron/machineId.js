const crypto = require('crypto');

const STORE_KEY = 'machineId';

function getMachineId(store) {
  const id = store.get(STORE_KEY);
  return id ? String(id).trim() : null;
}

function hasMachineId(store) {
  return !!store.get(STORE_KEY);
}

/** Generate once per install; returns existing ID if already set. */
function generateMachineId(store) {
  const existing = store.get(STORE_KEY);
  if (existing) return existing.trim();

  const id = crypto.randomUUID();
  store.set(STORE_KEY, id);
  store.delete('accessCache');
  return id;
}

module.exports = {
  getMachineId,
  hasMachineId,
  generateMachineId,
};
