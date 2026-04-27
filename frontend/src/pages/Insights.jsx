import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiZap, FiAlertCircle, FiTrendingDown, FiPackage } from 'react-icons/fi';
import InsightCard from '../components/InsightCard';
import api from '../services/api';
import './Insights.css';

export default function Insights() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    const data = await api.getInsights();
    setInsights(data);
  };

  const filtered = filter === 'all' ? insights : insights.filter(i => i.type === filter);

  const typeCount = (type) => insights.filter(i => i.type === type).length;

  return (
    <div className="page-container" id="insights-page">
      <div className="page-header">
        <h1>
          <span className="gradient-text">{t('insights.title')}</span>
        </h1>
        <p>{t('insights.subtitle')}</p>
      </div>

      {/* Summary Strip */}
      <div className="insights-summary animate-fade-in-up delay-1">
        <div className="summary-item" onClick={() => setFilter('all')}>
          <div className="summary-icon-wrapper all">
            <FiZap size={18} />
          </div>
          <div className="summary-text">
            <span className="summary-count">{insights.length}</span>
            <span className="summary-label">Total Insights</span>
          </div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item" onClick={() => setFilter('restock')}>
          <div className="summary-icon-wrapper restock">
            <FiPackage size={18} />
          </div>
          <div className="summary-text">
            <span className="summary-count">{typeCount('restock')}</span>
            <span className="summary-label">{t('insights.stock_prediction')}</span>
          </div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item" onClick={() => setFilter('payment')}>
          <div className="summary-icon-wrapper payment">
            <FiAlertCircle size={18} />
          </div>
          <div className="summary-text">
            <span className="summary-count">{typeCount('payment')}</span>
            <span className="summary-label">{t('insights.payment_analysis')}</span>
          </div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item" onClick={() => setFilter('sales_drop')}>
          <div className="summary-icon-wrapper sales">
            <FiTrendingDown size={18} />
          </div>
          <div className="summary-text">
            <span className="summary-count">{typeCount('sales_drop') + typeCount('anomaly')}</span>
            <span className="summary-label">{t('insights.anomaly_detection')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="insights-filters animate-fade-in-up delay-2">
        {[
          { key: 'all', label: 'All Insights' },
          { key: 'restock', label: t('insights.stock_prediction') },
          { key: 'payment', label: t('insights.payment_analysis') },
          { key: 'sales_drop', label: t('insights.sales_trends') },
          { key: 'anomaly', label: t('insights.anomaly_detection') },
        ].map(f => (
          <button
            key={f.key}
            className={`insight-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* AI Badge */}
      <div className="ai-badge animate-fade-in-up delay-2">
        <div className="ai-pulse"></div>
        <span className="ai-badge-text">🤖 AI Engine Active — Analyzing {insights.length} patterns</span>
      </div>

      {/* Insights Grid */}
      <div className="insights-grid">
        {filtered.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} delay={Math.min(i + 1, 5)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <FiZap size={48} />
          <p>No insights for this category yet.</p>
        </div>
      )}
    </div>
  );
}
