import { useTranslation } from 'react-i18next';
import { FiBell } from 'react-icons/fi';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  
  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <div className="brand-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size={24} color="#1F7A63" />
          </div>
          <div className="brand-text">
            <span className="brand-name">{t('app_name')}</span>
            <span className="brand-tagline">{t('tagline')}</span>
          </div>
        </div>
      </div>
      
      <div className="navbar-right">
        <LanguageSwitcher compact />

      </div>
    </nav>
  );
}
