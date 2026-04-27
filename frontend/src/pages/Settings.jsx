import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiCheck } from 'react-icons/fi';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Settings.css';

export default function Settings() {
  const { t } = useTranslation();
  const [shopName, setShopName] = useState('Rajesh General Store');
  const [ownerName, setOwnerName] = useState('Rajesh Sharma');
  const [notifications, setNotifications] = useState(true);
  const [threshold, setThreshold] = useState(5);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-container" id="settings-page">
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </div>

      <div className="settings-grid">
        {/* Language Settings */}
        <div className="settings-card glass-card animate-fade-in-up delay-1">
          <div className="settings-card-header">
            <div className="settings-card-icon">🌐</div>
            <div>
              <h3>{t('settings.language')}</h3>
              <p>{t('settings.language_desc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <LanguageSwitcher />
          </div>
        </div>



        {/* Notifications */}
        <div className="settings-card glass-card animate-fade-in-up delay-3">
          <div className="settings-card-header">
            <div className="settings-card-icon">🔔</div>
            <div>
              <h3>{t('settings.notifications')}</h3>
              <p>{t('settings.notifications_desc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="toggle-row">
              <span className="toggle-label">Stock Alerts</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <span className="toggle-label">Payment Mismatch Alerts</span>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <span className="toggle-label">AI Insight Notifications</span>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Stock Threshold */}
        <div className="settings-card glass-card animate-fade-in-up delay-4">
          <div className="settings-card-header">
            <div className="settings-card-icon">📦</div>
            <div>
              <h3>{t('settings.stock_threshold')}</h3>
              <p>{t('settings.stock_threshold_desc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="threshold-control">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={threshold} 
                onChange={e => setThreshold(e.target.value)}
                className="range-slider"
                id="threshold-slider"
              />
              <div className="threshold-display">
                <span className="threshold-value">{threshold}</span>
                <span className="threshold-unit">units</span>
              </div>
            </div>
            <p className="threshold-hint">
              Alert will trigger when item stock falls below <strong>{threshold}</strong> units.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-actions animate-fade-in-up delay-5">
        <button 
          className={`btn btn-primary btn-save ${saved ? 'saved' : ''}`} 
          onClick={handleSave}
          id="save-settings-btn"
        >
          {saved ? (
            <>
              <FiCheck size={16} />
              {t('settings.saved')}
            </>
          ) : (
            <>
              <FiSave size={16} />
              {t('settings.save')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
