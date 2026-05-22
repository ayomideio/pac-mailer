import { APP_ICON } from '../constants/brand';

const NAV = [
  { id: 'compose', label: 'Compose', icon: '✉️' },
  { id: 'settings', label: 'SMTP Settings', icon: '⚙️' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export default function Sidebar({ active, onNavigate, developer }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={APP_ICON} alt="" className="sidebar-brand-icon" width={36} height={36} />
        <div>
          <h1>Pac Mailer</h1>
          <span>by {developer}</span>
        </div>
      </div>

      <ul className="nav-list">
        {NAV.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        © {new Date().getFullYear()} {developer}
      </div>
    </aside>
  );
}
