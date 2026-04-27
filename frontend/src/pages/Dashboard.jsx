import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FiPlus, FiPackage, FiCheckCircle } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import AlertCard from '../components/AlertCard';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [dashStats, alertData, salesChart] = await Promise.all([
      api.getDashboardStats(),
      api.getAlerts(),
      api.getSalesData()
    ]);
    setStats(dashStats);
    setAlerts(alertData);
    setSalesData(salesChart);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          <p className="chart-tooltip-value">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (!stats) return <div className="page-container"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page-container" id="dashboard-page">
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 dashboard-stats">
        <StatsCard
          title={t('dashboard.todays_sales')}
          value={`₹${stats.todaySales.toLocaleString()}`}
          change={stats.salesChange}
          icon="💰"
          gradient="primary"
          delay={1}
        />
        <StatsCard
          title={t('dashboard.active_alerts')}
          value={stats.activeAlerts}
          change={stats.alertChange}
          icon="🔔"
          gradient="warm"
          delay={2}
        />
        <StatsCard
          title={t('dashboard.stock_warnings')}
          value={stats.stockWarnings}
          change={stats.stockChange}
          icon="📦"
          gradient="secondary"
          delay={3}
        />
        <StatsCard
          title={t('dashboard.payment_mismatches')}
          value={stats.paymentMismatches}
          change={stats.paymentChange}
          icon="⚠️"
          gradient="accent"
          delay={4}
        />
      </div>

      {/* Charts + Alerts Row */}
      <div className="dashboard-main-grid">
        {/* Sales Chart */}
        <div className="dashboard-chart-card glass-card animate-fade-in-up delay-3">
          <div className="chart-header">
            <h3>{t('dashboard.sales_trend')}</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="dashboard-alerts-card glass-card animate-fade-in-up delay-4">
          <div className="alerts-header">
            <h3>{t('dashboard.recent_alerts')}</h3>
            <span className="alerts-count">{alerts.length}</span>
          </div>
          <div className="alerts-list">
            {alerts.slice(0, 5).map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} delay={i + 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions + Top Products */}
      <div className="dashboard-bottom-grid">
        <div className="top-products-card glass-card animate-fade-in-up delay-5">
          <h3>{t('dashboard.top_products')}</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Milk', sales: 70 },
                { name: 'Bread', sales: 56 },
                { name: 'Maggi', sales: 45 },
                { name: 'Biscuits', sales: 42 },
                { name: 'Rice', sales: 28 },
              ]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#FFFFFF', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    color: '#111827'
                  }} 
                  itemStyle={{ color: '#0B3C5D' }}
                />
                <Bar dataKey="sales" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
