import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import MindPalaceMark from '../branding/MindPalaceMark';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Начало' },
  { to: '/spaces', label: 'Моите места' },
  { to: '/spaces/new', label: 'Създай пространство' },
  { to: '/recall', label: 'Recall Mode' },
  { to: '/quizzes', label: 'Викторини и тестове' },
];

export default function AppShell({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  const allNav = [
    ...navItems,
    ...(user?.role === 'admin' ? [{ to: '/administration', label: 'Управление' }] : []),
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              <MindPalaceMark />
            </span>
            <div className="brand-copy">
              <strong>Mind Palace</strong>
            </div>
          </Link>

          <nav className="main-nav">
            {allNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            {isAuthenticated ? (
              <>
                <div className="user-pill">
                  <span className="user-avatar">
                    {(user?.username || user?.email || 'П').slice(0, 1).toUpperCase()}
                  </span>

                  <div className="user-meta">
                    <strong>{user?.username || 'Потребител'}</strong>
                    <span>{user?.role === 'admin' ? 'Управител' : 'Потребител'}</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                >
                  Изход
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                Вход / Регистрация
              </button>
            )}

            <button
              className="mobile-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Меню"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-nav" id="mobile-navigation">
            {allNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="page-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-footer-brand-mark" aria-hidden="true">
              <MindPalaceMark size={34} />
            </span>
            <div>
              <strong>Mind Palace</strong>
              <span>Мисловни пространства за учене</span>
            </div>
          </div>

          <div className="site-footer-copy">
            <p>© {year} Mind Palace. Всички права запазени.</p>
            <p>Съдържанието, дизайнът и функционалността са защитени.</p>
          </div>

          <address className="site-footer-contact">
            <strong>Контакти</strong>
            <span className="site-footer-email">anna.uzunova02@gmail.com</span>
            <span>Пловдив, България</span>
          </address>
        </div>
      </footer>

      <style>{`
        .mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: rgba(155,140,246,0.12);
          border: 1px solid var(--border);
          color: var(--text);
          transition: background 0.15s;
        }
        .mobile-menu-btn:hover { background: rgba(155,140,246,0.18); }
        .mobile-nav {
          display: none;
          flex-direction: column;
          padding: 10px 20px 16px;
          gap: 6px;
          border-top: 1px solid var(--border);
          background: rgba(255,255,255,0.96);
          box-shadow: 0 18px 34px rgba(81, 65, 136, 0.12);
        }
        .mobile-nav-link {
          min-height: 42px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 14px;
          color: var(--muted);
          transition: background 0.15s, color 0.15s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(155,140,246,0.14);
          color: var(--text);
        }
        @media (max-width: 1080px) {
          .mobile-menu-btn { display: flex; }
          .mobile-nav { display: flex; }
        }
        @media (max-width: 720px) {
          .mobile-menu-btn {
            width: 38px;
            height: 38px;
          }
          .mobile-nav {
            padding: 8px 12px 12px;
          }
        }
      `}</style>
    </div>
  );
}
