import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import './LanguageSwitcher.css';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  if (compact) {
    return (
      <div className="lang-switcher-compact">
        <FiGlobe size={16} />
        <select value={i18n.language} onChange={handleChange} className="lang-select-compact">
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="lang-switcher">
      {languages.map(lang => (
        <button
          key={lang.code}
          className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(lang.code)}
        >
          <span className="lang-flag">{lang.flag}</span>
          <span className="lang-name">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
