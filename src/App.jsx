import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ComposePage from './components/ComposePage';
import SettingsPage from './components/SettingsPage';
import HistoryPage from './components/HistoryPage';
import AboutPage from './components/AboutPage';
import Toast from './components/Toast';
import { emptyProfile, emptyMail } from './constants/presets';

const api = window.pacMailer;

export default function App() {
  const [page, setPage] = useState('compose');
  const [meta, setMeta] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [draft, setDraft] = useState(emptyMail());
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState('system');
  const [toasts, setToasts] = useState([]);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    async function init() {
      if (!api) return;
      const [appMeta, store, themeInfo] = await Promise.all([
        api.getMeta(),
        api.getStore(),
        api.getTheme(),
      ]);

      setMeta(appMeta);
      document.documentElement.dataset.theme =
        store.theme === 'system'
          ? themeInfo.shouldUseDarkColors
            ? 'dark'
            : 'light'
          : store.theme;

      let profs = store.smtpProfiles || [];
      if (!profs.length) {
        profs = [emptyProfile()];
        profs[0].name = 'Default';
      }
      setProfiles(profs);
      setActiveProfileId(store.activeProfileId || profs[0]?.id);
      setDraft(store.composerDraft || emptyMail());
      setHistory(store.history || []);
      setTheme(store.theme || 'system');
      setLoaded(true);
    }
    init();
  }, []);

  const persist = useCallback(async (key, value) => {
    if (api) await api.set(key, value);
  }, []);

  const handleProfilesChange = (next) => {
    setProfiles(next);
    persist('smtpProfiles', next);
  };

  const handleActiveProfileChange = (id) => {
    setActiveProfileId(id);
    persist('activeProfileId', id);
  };

  const handleDraftChange = (next) => {
    const { _attachments, ...saveDraft } = next;
    setDraft(next);
    persist('composerDraft', saveDraft);
  };

  const handleTest = async (profile) => {
    setTesting(true);
    setTestResult(null);
    const result = await api.testSmtp(profile);
    setTestResult(result);
    setTesting(false);
    showToast(result.message, result.ok ? 'success' : 'error');
  };

  const handleSend = async (payload) => {
    setSending(true);
    const result = await api.sendMail(payload);
    setSending(false);

    if (result.history) setHistory(result.history);

    if (result.ok) {
      showToast('Email sent successfully!', 'success');
      const cleared = emptyMail();
      setDraft(cleared);
      persist('composerDraft', cleared);
      persist('history', result.history);
    } else {
      showToast(result.message || 'Failed to send email.', 'error');
      if (result.history) persist('history', result.history);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    persist('history', []);
    showToast('History cleared.', 'info');
  };

  const handleThemeChange = (value) => {
    setTheme(value);
    api.setTheme(value);
    persist('theme', value);
    if (value === 'system') {
      api.getTheme().then((t) => {
        document.documentElement.dataset.theme = t.shouldUseDarkColors ? 'dark' : 'light';
      });
    } else {
      document.documentElement.dataset.theme = value;
    }
  };

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span className="spinner" style={{ width: 24, height: 24, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  const developer = meta?.developer || 'Developer Pac';

  return (
    <div className="app-shell">
      <Sidebar active={page} onNavigate={setPage} developer={developer} />

      <main className="main-content">
        {page === 'compose' && (
          <ComposePage
            profiles={profiles}
            activeProfileId={activeProfileId}
            onProfileChange={handleActiveProfileChange}
            draft={draft}
            onDraftChange={handleDraftChange}
            onSend={handleSend}
            onPickAttachments={() => api.pickAttachments()}
            sending={sending}
            showToast={showToast}
          />
        )}
        {page === 'settings' && (
          <SettingsPage
            profiles={profiles}
            activeProfileId={activeProfileId}
            onProfilesChange={handleProfilesChange}
            onActiveProfileChange={handleActiveProfileChange}
            onTest={handleTest}
            testing={testing}
            testResult={testResult}
            showToast={showToast}
          />
        )}
        {page === 'history' && (
          <HistoryPage history={history} onClear={handleClearHistory} />
        )}
        {page === 'about' && (
          <AboutPage meta={meta} theme={theme} onThemeChange={handleThemeChange} />
        )}
      </main>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
