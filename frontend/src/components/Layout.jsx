/**
 * Layout component — sidebar navigation shell with responsive design.
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// SVG Icons as components
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    </svg>
  ),
  UserPlus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Scan: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7V2h5" /><path d="M17 2h5v5" /><path d="M22 17v5h-5" /><path d="M7 22H2v-5" />
      <circle cx="12" cy="10" r="3" /><path d="M7 17s1.5-3 5-3 5 3 5 3" />
    </svg>
  ),
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: Icons.Dashboard },
  { path: '/attendance', label: 'Mark Attendance', icon: Icons.Camera },
  { path: '/timetable', label: 'Timetable Config', icon: Icons.FileText },
  { path: '/register', label: 'Register Student', icon: Icons.UserPlus },
  { path: '/reports', label: 'Reports', icon: Icons.FileText },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Icons.Scan />
            </div>
            {sidebarOpen && (
              <div className="logo-text">
                <h1>FaceTrack</h1>
                <span>Attendance System</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            id="sidebar-toggle-btn"
          >
            <Icons.Menu />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <span className="nav-icon">
                <item.icon />
              </span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div className="sidebar-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="info-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
              <span>System Online</span>
            </div>
            <div className="department-info" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                {localStorage.getItem('attendance_department')}
              </span>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to change your department?')) {
                    localStorage.removeItem('attendance_department');
                    window.location.reload();
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                title="Change Department"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? '' : 'main-expanded'}`}>
        <div className="content-wrapper animate-fade-in" key={location.pathname}>
          {children}
        </div>
      </main>
    </div>
  );
}
