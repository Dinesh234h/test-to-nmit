import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FiGrid, FiPackage, FiCreditCard, FiBookOpen,
  FiZap, FiSettings, FiShoppingBag
} from 'react-icons/fi';
import Logo from './Logo';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: FiGrid, labelKey: 'nav.dashboard' },
  { path: '/pos', icon: FiShoppingBag, labelKey: 'nav.pos' },
  { path: '/inventory', icon: FiPackage, labelKey: 'nav.inventory' },
  { path: '/khata', icon: FiBookOpen, labelKey: 'nav.khata' },
  { path: '/payments', icon: FiCreditCard, labelKey: 'nav.payments' },
  { path: '/insights', icon: FiZap, labelKey: 'nav.insights' },
  { path: '/settings', icon: FiSettings, labelKey: 'nav.settings' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  
  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ color: '#1F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Logo size={28} />
          </div>
          <div className="logo-text">
            <span className="logo-name">{t('app_name')}</span>
            <span className="logo-tagline">{t('tagline')}</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  id={`nav-${item.path.slice(1) || 'dashboard'}`}
                >
                  <div className="nav-icon-wrapper">
                    <Icon size={18} />
                    {isActive && <div className="nav-icon-glow"></div>}
                  </div>
                  <span className="nav-label">{t(item.labelKey)}</span>
                  {isActive && <div className="nav-active-indicator"></div>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
