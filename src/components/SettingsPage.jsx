import { useState } from 'react';
import { SMTP_PRESETS, emptyProfile } from '../constants/presets';

export default function SettingsPage({
  profiles,
  activeProfileId,
  onProfilesChange,
  onActiveProfileChange,
  onTest,
  testing,
  testResult,
  showToast,
}) {
  const [editing, setEditing] = useState(null);

  const selected = editing ?? profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const updateField = (field, value) => {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setEditing(updated);
    persistProfiles(
      profiles.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const applyPreset = (presetKey) => {
    const preset = SMTP_PRESETS[presetKey];
    if (!preset || !selected) return;
    const updated = {
      ...selected,
      preset: presetKey,
      host: preset.host ?? selected.host,
      port: preset.port ?? selected.port,
      security: preset.security ?? selected.security,
      username: preset.username ?? selected.username,
    };
    setEditing(updated);
    persistProfiles(profiles.map((p) => (p.id === updated.id ? updated : p)));
  };

  const persistProfiles = (next) => {
    onProfilesChange(next);
  };

  const addProfile = () => {
    const profile = emptyProfile();
    const next = [...profiles, profile];
    persistProfiles(next);
    setEditing(profile);
    onActiveProfileChange(profile.id);
  };

  const deleteProfile = (id) => {
    if (profiles.length <= 1) {
      showToast('You need at least one profile.', 'error');
      return;
    }
    const next = profiles.filter((p) => p.id !== id);
    persistProfiles(next);
    if (activeProfileId === id) {
      onActiveProfileChange(next[0]?.id);
      setEditing(next[0]);
    } else if (editing?.id === id) {
      setEditing(null);
    }
  };

  const selectProfile = (profile) => {
    setEditing(profile);
    onActiveProfileChange(profile.id);
  };

  const handleTest = () => {
    if (!selected?.host) {
      showToast('Enter SMTP host before testing.', 'error');
      return;
    }
    onTest(selected);
  };

  if (!profiles.length) {
    return (
      <>
        <header className="page-header">
          <h2>SMTP Settings</h2>
          <button type="button" className="btn btn-primary" onClick={addProfile}>
            + New Profile
          </button>
        </header>
        <div className="page-body">
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <p>No SMTP profiles yet. Create one to start sending mail.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={addProfile}>
              Create Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  const current = editing ?? selected;

  return (
    <>
      <header className="page-header">
        <h2>SMTP Settings</h2>
        <div className="toolbar">
          <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={testing}>
            {testing ? <span className="spinner" /> : null}
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          <button type="button" className="btn btn-primary" onClick={addProfile}>
            + New Profile
          </button>
        </div>
      </header>

      <div className="page-body">
        {testResult && (
          <p className={`connection-status ${testResult.ok ? 'ok' : 'err'}`} style={{ marginBottom: 16 }}>
            {testResult.ok ? '✓' : '✗'} {testResult.message}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          <div className="profile-list">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`profile-item ${current?.id === p.id ? 'active' : ''}`}
                onClick={() => selectProfile(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && selectProfile(p)}
              >
                <div className="profile-item-info">
                  <strong>{p.name}</strong>
                  <span>{p.host || 'Not configured'}:{p.port}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProfile(p.id);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {current && (
            <div className="card">
              <div className="card-title">Edit Profile</div>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="profile-name">Profile Name</label>
                  <input
                    id="profile-name"
                    value={current.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="preset">Provider Preset</label>
                  <select
                    id="preset"
                    value={current.preset || 'custom'}
                    onChange={(e) => applyPreset(e.target.value)}
                  >
                    {Object.entries(SMTP_PRESETS).map(([key, p]) => (
                      <option key={key} value={key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {SMTP_PRESETS[current.preset]?.hint && (
                    <p className="hint">{SMTP_PRESETS[current.preset].hint}</p>
                  )}
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-row">
                    <label htmlFor="host">SMTP Host *</label>
                    <input
                      id="host"
                      value={current.host}
                      onChange={(e) => updateField('host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="port">Port</label>
                    <input
                      id="port"
                      value={current.port}
                      onChange={(e) => updateField('port', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="security">Security</label>
                  <select
                    id="security"
                    value={current.security}
                    onChange={(e) => updateField('security', e.target.value)}
                  >
                    <option value="starttls">STARTTLS (587)</option>
                    <option value="ssl">SSL/TLS (465)</option>
                    <option value="tls">TLS</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-row">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      value={current.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={current.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="toggle-row">
                  <input
                    id="auth"
                    type="checkbox"
                    checked={current.auth}
                    onChange={(e) => updateField('auth', e.target.checked)}
                  />
                  <label htmlFor="auth" style={{ margin: 0, textTransform: 'none' }}>
                    Use authentication
                  </label>
                </div>

                <div className="toggle-row">
                  <input
                    id="allowInsecure"
                    type="checkbox"
                    checked={current.allowInsecure}
                    onChange={(e) => updateField('allowInsecure', e.target.checked)}
                  />
                  <label htmlFor="allowInsecure" style={{ margin: 0, textTransform: 'none' }}>
                    Allow self-signed certificates
                  </label>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-row">
                    <label htmlFor="fromEmail">From Email</label>
                    <input
                      id="fromEmail"
                      type="email"
                      value={current.fromEmail}
                      onChange={(e) => updateField('fromEmail', e.target.value)}
                      placeholder={current.username || 'sender@example.com'}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="fromName">From Name</label>
                    <input
                      id="fromName"
                      value={current.fromName}
                      onChange={(e) => updateField('fromName', e.target.value)}
                      placeholder="Your Name"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
