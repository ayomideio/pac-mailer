import { useState, useEffect } from 'react';

export default function AboutPage({ meta, theme, onThemeChange, showToast }) {
  const [machineId, setMachineId] = useState(null);

  useEffect(() => {
    window.pacMailer?.getMachineId?.().then((id) => setMachineId(id || null));
  }, []);

  const copyMachineId = async () => {
    if (!machineId) return;
    await navigator.clipboard.writeText(machineId);
    showToast?.('Machine ID copied to clipboard.', 'success');
  };

  return (
    <>
      <header className="page-header">
        <h2>About</h2>
      </header>

      <div className="page-body">
        <div className="card">
          <div className="about-hero">
            <div className="about-logo">📬</div>
            <h2>{meta?.name || 'Pac Mailer'}</h2>
            <p className="developer">Developed by {meta?.developer || 'Developer Pac'}</p>
            <p style={{ color: 'var(--text-muted)' }}>
              A desktop SMTP mail client for sending email directly through your mail server.
              No cloud relay — your credentials stay on your machine.
            </p>
          </div>

          <div className="about-meta">
            <div className="about-meta-item">
              <span>Version</span>
              <strong>{meta?.version || '1.0.0'}</strong>
            </div>
            <div className="about-meta-item">
              <span>Platform</span>
              <strong>{meta?.platform || '—'}</strong>
            </div>
            <div className="about-meta-item">
              <span>License</span>
              <strong>MIT</strong>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title">Machine ID</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
              Send this ID to Developer Pac if you need activation or support.
            </p>
            {machineId ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  readOnly
                  value={machineId}
                  style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={copyMachineId}>
                  Copy
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Not generated yet — restart the app and use Activate to generate one.
              </p>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Appearance</div>
            <div className="form-row">
              <label htmlFor="theme">Theme</label>
              <select id="theme" value={theme} onChange={(e) => onThemeChange(e.target.value)}>
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Features</div>
            <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 2 }}>
              <li>Multiple SMTP profiles with provider presets</li>
              <li>Plain text and HTML email composition</li>
              <li>CC, BCC, Reply-To, and file attachments</li>
              <li>Connection testing before you send</li>
              <li>Local send history (stored on your device)</li>
              <li>Dark, light, and system themes</li>
            </ul>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Made with care by <strong style={{ color: 'var(--accent)' }}>Developer Pac</strong>
          </p>
        </div>
      </div>
    </>
  );
}
