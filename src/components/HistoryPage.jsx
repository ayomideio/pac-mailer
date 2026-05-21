import { formatDate } from '../utils/format';

export default function HistoryPage({ history, onClear }) {
  return (
    <>
      <header className="page-header">
        <h2>Send History</h2>
        {history.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={onClear}>
            Clear History
          </button>
        )}
      </header>

      <div className="page-body">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No emails sent yet. Your send history will appear here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>When</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Profile</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={`status-badge ${entry.status}`}>
                        {entry.status === 'sent' ? 'Sent' : 'Failed'}
                      </span>
                    </td>
                    <td>{formatDate(entry.timestamp)}</td>
                    <td>{entry.to}</td>
                    <td>{entry.subject || '—'}</td>
                    <td>{entry.profileName}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {entry.status === 'sent'
                        ? entry.messageId?.slice(0, 24) + '…'
                        : entry.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
