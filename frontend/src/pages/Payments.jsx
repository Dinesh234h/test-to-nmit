import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import api from '../services/api';
import './Payments.css';

export default function Payments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const data = await api.getPayments();
    setPayments(data);
  };

  const totalExpected = payments.reduce((sum, p) => sum + p.expected, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.received, 0);
  const totalMismatch = totalExpected - totalReceived;
  const matchRate = totalExpected > 0 ? ((totalReceived / totalExpected) * 100).toFixed(1) : 100;

  const verifiedCount = payments.filter(p => p.status === 'verified').length;
  const mismatchCount = payments.filter(p => p.status === 'mismatch').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const pieData = [
    { name: t('payments.verified'), value: verifiedCount, color: '#10b981' },
    { name: t('payments.mismatch'), value: mismatchCount, color: '#ef4444' },
    { name: t('payments.pending_verification'), value: pendingCount, color: '#f59e0b' },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return <FiCheckCircle size={16} color="var(--success)" />;
      case 'mismatch': return <FiAlertTriangle size={16} color="var(--danger)" />;
      case 'pending': return <FiClock size={16} color="var(--warning)" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const classes = { verified: 'badge-success', mismatch: 'badge-danger', pending: 'badge-warning' };
    const key = status === 'pending' ? 'pending_verification' : status;
    return <span className={`badge ${classes[status]}`}>{t(`payments.${key}`)}</span>;
  };

  return (
    <div className="page-container" id="payments-page">
      <div className="page-header">
        <h1>{t('payments.title')}</h1>
        <p>{t('payments.subtitle')}</p>
      </div>

      <div className="grid-4 payment-stats">
        <StatsCard title={t('payments.total_expected')} value={`₹${totalExpected.toLocaleString()}`} icon="💰" gradient="primary" delay={1} />
        <StatsCard title={t('payments.total_received')} value={`₹${totalReceived.toLocaleString()}`} icon="✅" gradient="accent" delay={2} />
        <StatsCard title={t('payments.total_mismatch')} value={`₹${totalMismatch.toLocaleString()}`} icon="⚠️" gradient="warm" delay={3} />
        <StatsCard title={t('payments.match_rate')} value={`${matchRate}%`} icon="📊" gradient="secondary" delay={4} />
      </div>

      <div className="payments-grid">
        {/* Pie Chart */}
        <div className="payment-chart-card glass-card animate-fade-in-up delay-3">
          <h3>{t('payments.verification_status')}</h3>
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {pieData.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ background: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="payment-table-card glass-card animate-fade-in-up delay-4">
          <h3>Payment Records</h3>
          <div className="table-wrapper">
            <table className="data-table" id="payments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('payments.payment_method')}</th>
                  <th>{t('payments.expected')}</th>
                  <th>{t('payments.received')}</th>
                  <th>{t('payments.difference')}</th>
                  <th>{t('payments.verification_status')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const diff = payment.expected - payment.received;
                  return (
                    <tr key={payment.id} className={payment.status === 'mismatch' ? 'row-danger' : payment.status === 'pending' ? 'row-warning' : ''}>
                      <td>
                        <div className="payment-id-cell">
                          <span className="payment-id">{payment.id}</span>
                          <span className="payment-txn-ref">{payment.transactionId}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`method-badge ${payment.method}`}>
                          {payment.method === 'upi' ? '📱 UPI' : '💵 Cash'}
                        </span>
                      </td>
                      <td className="amount-cell">₹{payment.expected.toLocaleString()}</td>
                      <td className="amount-cell">₹{payment.received.toLocaleString()}</td>
                      <td className={`diff-cell ${diff > 0 ? 'diff-negative' : 'diff-zero'}`}>
                        {diff > 0 ? `-₹${diff}` : '₹0'}
                      </td>
                      <td>
                        <div className="payment-status-cell">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
