import { useState, useEffect } from 'react';
import { APP_ICON } from '../constants/brand';

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
            <img src={APP_ICON} alt="" className="about-logo" width={80} height={80} />
            <h2>{meta?.name || 'Pac Mailer'}</h2>
            <p className="developer">Developed by {meta?.developer || 'Developer Pac'} +2347045802442</p>
       
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
              <strong>DEVELOPER PAC</strong>
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

        

          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          By <strong style={{ color: 'var(--accent)' }}>Developer Pac</strong>
          </p>
        </div>
      </div>
    </>
  );
}
