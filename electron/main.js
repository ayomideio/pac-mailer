const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Store = require('electron-store');
const { checkAccess, shouldSkipAccessCheck } = require('./access');
const { getMachineId, hasMachineId, generateMachineId } = require('./machineId');

const store = new Store({
  defaults: {
    smtpProfiles: [],
    activeProfileId: null,
    theme: 'system',
    history: [],
    composerDraft: null,
  },
});

const isDev = !app.isPackaged;
let mainWindow = null;
let blockedWindow = null;
let activationWindow = null;
let accessAllowed = false;

function gateWindowOptions(width, height) {
  return {
    width,
    height,
    resizable: false,
    maximizable: false,
    minimizable: true,
    title: 'Pac Mailer',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}

function showActivationWindow() {
  if (activationWindow) return;

  activationWindow = new BrowserWindow({
    ...gateWindowOptions(500, 520),
  });

  activationWindow.loadFile(path.join(__dirname, 'activation.html'));

  activationWindow.on('closed', () => {
    activationWindow = null;
    if (!accessAllowed) app.quit();
  });
}

function showBlockedWindow(message, machineId) {
  if (blockedWindow) {
    blockedWindow.focus();
    return;
  }

  blockedWindow = new BrowserWindow({
    ...gateWindowOptions(480, machineId ? 400 : 340),
  });

  const query = { m: message };
  if (machineId) query.id = machineId;

  blockedWindow.loadFile(path.join(__dirname, 'blocked.html'), { query });

  blockedWindow.on('closed', () => {
    blockedWindow = null;
    if (!accessAllowed) app.quit();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: 'Pac Mailer',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools Autofill.* CDP calls are unsupported in Electron and log harmless errors.
    if (process.env.OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function buildTransport(profile) {
  const port = parseInt(profile.port, 10) || (profile.security === 'ssl' ? 465 : 587);
  const opts = { host: profile.host, port };

  if (profile.security === 'ssl') {
    opts.secure = true;
  } else if (profile.security === 'none') {
    opts.secure = false;
    opts.ignoreTLS = true;
  } else {
    opts.secure = false;
    opts.requireTLS = profile.security === 'starttls';
    if (profile.allowInsecure) {
      opts.tls = { rejectUnauthorized: false };
    }
  }

  if (profile.auth && profile.username) {
    opts.auth = { user: profile.username, pass: profile.password || '' };
  }

  return nodemailer.createTransport(opts);
}

function parseRecipients(value) {
  if (!value || !value.trim()) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function addHistory(entry) {
  const history = store.get('history', []);
  history.unshift({ ...entry, id: Date.now().toString(), timestamp: new Date().toISOString() });
  store.set('history', history.slice(0, 100));
  return history.slice(0, 100);
}

async function tryLaunchMainApp() {
  const skip = shouldSkipAccessCheck(isDev);

  if (!skip && !hasMachineId(store)) {
    showActivationWindow();
    return false;
  }

  const machineId = getMachineId(store);
  const access = await checkAccess(store, { skip, machineId });

  if (!access.allowed) {
    if (activationWindow) {
      activationWindow.close();
      activationWindow = null;
    }
    showBlockedWindow(access.message, machineId);
    return false;
  }

  accessAllowed = true;

  if (blockedWindow) {
    blockedWindow.close();
    blockedWindow = null;
  }
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }

  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }

  return true;
}

app.whenReady().then(async () => {
  await tryLaunchMainApp();

  app.on('activate', async () => {
    if (!accessAllowed) {
      await tryLaunchMainApp();
      return;
    }
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC handlers ---

ipcMain.on('app:quit', () => app.quit());

ipcMain.handle('machine:get', () => getMachineId(store));

ipcMain.handle('machine:generate', () => generateMachineId(store));

ipcMain.handle('access:recheck', async () => {
  const skip = shouldSkipAccessCheck(isDev);
  const machineId = getMachineId(store);

  if (!skip && !machineId) {
    return {
      allowed: false,
      message: 'Generate a Machine ID first.',
      machineId: null,
      reason: 'no_machine_id',
    };
  }

  const access = await checkAccess(store, { skip, machineId });

  if (access.allowed) {
    await tryLaunchMainApp();
  }

  return access;
});

ipcMain.handle('app:get-meta', () => ({
  name: 'Pac Mailer',
  version: app.getVersion(),
  developer: 'Developer Pac',
  platform: process.platform,
}));

ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store:get-all', () => ({
  smtpProfiles: store.get('smtpProfiles'),
  activeProfileId: store.get('activeProfileId'),
  theme: store.get('theme'),
  history: store.get('history'),
  composerDraft: store.get('composerDraft'),
}));

ipcMain.handle('smtp:test', async (_, profile) => {
  const transport = buildTransport(profile);
  try {
    await transport.verify();
    return { ok: true, message: 'SMTP connection verified successfully.' };
  } catch (err) {
    return { ok: false, message: err.message || 'Connection failed.' };
  } finally {
    transport.close();
  }
});

ipcMain.handle('smtp:send', async (_, { profile, mail, attachments }) => {
  const transport = buildTransport(profile);

  const mailOptions = {
    from: profile.fromName
      ? `"${profile.fromName}" <${profile.fromEmail || profile.username}>`
      : profile.fromEmail || profile.username,
    to: parseRecipients(mail.to),
    cc: parseRecipients(mail.cc),
    bcc: parseRecipients(mail.bcc),
    subject: mail.subject || '(no subject)',
    replyTo: mail.replyTo || undefined,
  };

  if (mail.format === 'html') {
    mailOptions.html = mail.body;
    if (mail.altBody) mailOptions.text = mail.altBody;
  } else {
    mailOptions.text = mail.body;
  }

  if (attachments?.length) {
    mailOptions.attachments = attachments.map((a) => ({
      filename: a.name,
      path: a.path,
      contentType: a.type,
    }));
  }

  try {
    const info = await transport.sendMail(mailOptions);
    const history = addHistory({
      status: 'sent',
      to: mail.to,
      subject: mail.subject,
      messageId: info.messageId,
      profileName: profile.name,
    });
    return { ok: true, messageId: info.messageId, history };
  } catch (err) {
    const history = addHistory({
      status: 'failed',
      to: mail.to,
      subject: mail.subject,
      error: err.message,
      profileName: profile.name,
    });
    return { ok: false, message: err.message, history };
  } finally {
    transport.close();
  }
});

ipcMain.handle('dialog:pick-attachments', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select attachments',
  });
  if (result.canceled) return [];

  return result.filePaths.map((filePath) => {
    const stat = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stat.size,
      type: getMimeType(filePath),
    };
  });
});

ipcMain.handle('shell:open-external', (_, url) => shell.openExternal(url));

ipcMain.handle('theme:get', () => ({
  theme: store.get('theme'),
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
}));

ipcMain.on('theme:set', (_, theme) => {
  store.set('theme', theme);
  if (theme === 'dark') nativeTheme.themeSource = 'dark';
  else if (theme === 'light') nativeTheme.themeSource = 'light';
  else nativeTheme.themeSource = 'system';
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}
