import { useState } from 'react';
import { formatBytes } from '../utils/format';

export default function ComposePage({
  profiles,
  activeProfileId,
  onProfileChange,
  draft,
  onDraftChange,
  onSend,
  onPickAttachments,
  sending,
  showToast,
}) {
  const [attachments, setAttachments] = useState([]);
  const [showCc, setShowCc] = useState(!!draft?.cc);
  const [showBcc, setShowBcc] = useState(!!draft?.bcc);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const update = (field, value) => {
    onDraftChange({ ...draft, [field]: value });
  };

  const handlePickAttachments = async () => {
    const picked = await onPickAttachments();
    if (picked?.length) {
      setAttachments((prev) => {
        const paths = new Set(prev.map((a) => a.path));
        return [...prev, ...picked.filter((a) => !paths.has(a.path))];
      });
    }
  };

  const removeAttachment = (path) => {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
  };

  const handleSend = async () => {
    if (!activeProfile) {
      showToast('Configure an SMTP profile first.', 'error');
      return;
    }
    if (!draft.to?.trim()) {
      showToast('Recipient (To) is required.', 'error');
      return;
    }
    if (!draft.body?.trim()) {
      showToast('Message body cannot be empty.', 'error');
      return;
    }
    await onSend({ profile: activeProfile, mail: { ...draft, format: 'plain' }, attachments });
    setAttachments([]);
  };

  return (
    <>
      <header className="page-header">
        <h2>Compose Email</h2>
        <div className="toolbar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowCc(!showCc)}
          >
            {showCc ? 'Hide CC' : 'CC'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBcc(!showBcc)}
          >
            {showBcc ? 'Hide BCC' : 'BCC'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !profiles.length}
          >
            {sending ? <span className="spinner" /> : null}
            {sending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="select-profile-bar">
          <label htmlFor="profile-select" style={{ margin: 0, textTransform: 'none' }}>
            SMTP Profile
          </label>
          <select
            id="profile-select"
            value={activeProfileId || ''}
            onChange={(e) => onProfileChange(e.target.value)}
          >
            <option value="" disabled>
              Select a profile…
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.host || 'not configured'})
              </option>
            ))}
          </select>
          {!profiles.length && (
            <span className="connection-status err">No SMTP profiles — add one in Settings</span>
          )}
        </div>

        <div className="card">
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="to">To *</label>
              <textarea
                id="to"
                className="compose-recipients"
                rows={3}
                placeholder="recipient@example.com, another@example.com"
                value={draft.to}
                onChange={(e) => update('to', e.target.value)}
              />
            </div>

            {showCc && (
              <div className="form-row">
                <label htmlFor="cc">CC</label>
                <input
                  id="cc"
                  type="text"
                  placeholder="cc@example.com"
                  value={draft.cc}
                  onChange={(e) => update('cc', e.target.value)}
                />
              </div>
            )}

            {showBcc && (
              <div className="form-row">
                <label htmlFor="bcc">BCC</label>
                <input
                  id="bcc"
                  type="text"
                  placeholder="bcc@example.com"
                  value={draft.bcc}
                  onChange={(e) => update('bcc', e.target.value)}
                />
              </div>
            )}

            <div className="form-row">
              <label htmlFor="replyTo">Reply-To</label>
              <input
                id="replyTo"
                type="email"
                placeholder="Optional reply address"
                value={draft.replyTo}
                onChange={(e) => update('replyTo', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                placeholder="Email subject"
                value={draft.subject}
                onChange={(e) => update('subject', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="body">Message *</label>
              <textarea
                id="body"
                rows={12}
                placeholder="Write your message here…"
                value={draft.body}
                onChange={(e) => update('body', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Attachments</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handlePickAttachments}>
                + Add files
              </button>
              {attachments.length > 0 && (
                <div className="attachment-list">
                  {attachments.map((a) => (
                    <span key={a.path} className="attachment-chip">
                      📎 {a.name} ({formatBytes(a.size)})
                      <button type="button" onClick={() => removeAttachment(a.path)} title="Remove">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
