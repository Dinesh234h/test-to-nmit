import { useTranslation } from 'react-i18next';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import './InsightCard.css';

export default function InsightCard({ insight, delay = 0 }) {
  const { t } = useTranslation();
  
  const severityColor = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--info)'
  }[insight.severity];
  
  const severityClass = {
    high: 'insight-high',
    medium: 'insight-medium',
    low: 'insight-low'
  }[insight.severity];
  
  return (
    <div className={`insight-card ${severityClass} animate-fade-in-up delay-${delay}`}>
      <div className="insight-card-header">
        <div className="insight-icon-badge">
          <span>{insight.icon}</span>
        </div>
        <div className="insight-meta">
          <span className={`insight-severity-tag ${severityClass}`}>
            {t(`insights.${insight.severity}`)}
          </span>
          <span className="insight-confidence">
            {t('insights.confidence')}: {insight.confidence}%
          </span>
        </div>
      </div>
      
      <h3 className="insight-title">{t(insight.title)}</h3>
      <p className="insight-message">{t(insight.message, insight.messageParams)}</p>
      
      <div className="insight-recommendation">
        <FiAlertCircle size={14} />
        <span>{t(insight.recommendation, insight.recommendationParams || {})}</span>
      </div>
      
      <div className="insight-footer">
        <div className="insight-trend">
          {insight.trend === 'up' 
            ? <FiTrendingUp size={16} color="var(--danger)" />
            : <FiTrendingDown size={16} color="var(--success)" />
          }
          <span className="insight-trend-label">
            {insight.trend === 'up' ? 'Increasing Risk' : 'Decreasing'}
          </span>
        </div>
        <div className="insight-confidence-bar">
          <div 
            className="insight-confidence-fill"
            style={{ 
              width: `${insight.confidence}%`,
              background: severityColor
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
