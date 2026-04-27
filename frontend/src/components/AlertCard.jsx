import './AlertCard.css';

export default function AlertCard({ alert, delay = 0 }) {
  const severityClass = {
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low'
  }[alert.severity] || 'severity-low';
  
  return (
    <div className={`alert-card ${severityClass} animate-slide-in delay-${delay}`}>
      <div className="alert-icon-wrapper">
        <span className="alert-card-icon">{alert.icon}</span>
      </div>
      <div className="alert-card-content">
        <div className="alert-card-header">
          <h4 className="alert-card-title">{alert.title}</h4>
          <span className="alert-card-time">{alert.time}</span>
        </div>
        <p className="alert-card-message">{alert.message}</p>
      </div>
      <div className={`alert-severity-badge ${severityClass}`}>
        {alert.severity}
      </div>
    </div>
  );
}
