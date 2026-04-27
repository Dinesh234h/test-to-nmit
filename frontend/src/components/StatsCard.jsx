import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import './StatsCard.css';

export default function StatsCard({ title, value, change, icon, gradient = 'primary', delay = 0 }) {
  const isPositive = change >= 0;
  
  return (
    <div className={`stats-card animate-fade-in-up delay-${delay}`} id={`stat-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="stats-card-inner">
        <div className="stats-card-content">
          <span className="stats-label">{title}</span>
          <span className="stats-value">{value}</span>
          {change !== undefined && (
            <div className={`stats-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <div className={`stats-icon-container gradient-${gradient}`}>
          <span className="stats-icon">{icon}</span>
        </div>
      </div>
      <div className={`stats-glow gradient-${gradient}`}></div>
    </div>
  );
}
