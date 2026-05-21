const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pacMailer', {
  quit: () => ipcRenderer.send('app:quit'),
  getMachineId: () => ipcRenderer.invoke('machine:get'),
  generateMachineId: () => ipcRenderer.invoke('machine:generate'),
  recheckAccess: () => ipcRenderer.invoke('access:recheck'),
  getMeta: () => ipcRenderer.invoke('app:get-meta'),
  getStore: () => ipcRenderer.invoke('store:get-all'),
  get: (key) => ipcRenderer.invoke('store:get', key),
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  testSmtp: (profile) => ipcRenderer.invoke('smtp:test', profile),
  sendMail: (payload) => ipcRenderer.invoke('smtp:send', payload),
  pickAttachments: () => ipcRenderer.invoke('dialog:pick-attachments'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => ipcRenderer.send('theme:set', theme),
});
