import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiPhone, FiUser, FiDollarSign, FiBookOpen, FiEdit2, FiMessageCircle, FiSend } from 'react-icons/fi';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import './Khata.css';

export default function Khata() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [whatsappStatus, setWhatsappStatus] = useState('');
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await api.getCustomers();
    // Exclude walk-in from khata page
    setCustomers(data.filter(c => c.id !== 'WALKIN'));
  };

  const activeKhata = customers.filter(c => c.pending > 0);
  const totalPending = activeKhata.reduce((sum, c) => sum + c.pending, 0);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  ).sort((a, b) => b.pending - a.pending);

  const handleSaveCustomer = async () => {
    if (!newCustomer.name) return;
    await api.addCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '' });
    setShowModal(false);
    loadCustomers();
  };

  const handleRecordPayment = async () => {
    if (!selectedCustomer || !paymentAmount || isNaN(paymentAmount)) return;
    await api.recordKhataPayment(selectedCustomer.id, parseFloat(paymentAmount));
    setPaymentAmount('');
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    loadCustomers();
  };

  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.pending);
    setShowPaymentModal(true);
  };

  /* ── Edit Customer ── */
  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({ name: customer.name, phone: customer.phone });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editForm.name || !selectedCustomer) return;
    await api.updateCustomer(selectedCustomer.id, { name: editForm.name, phone: editForm.phone });
    setShowEditModal(false);
    setSelectedCustomer(null);
    loadCustomers();
  };

  /* ── WhatsApp Reminder ── */
  const sendWhatsAppReminder = (customer) => {
    if (!customer.phone) {
      alert(`No phone number for ${customer.name}. Please add one first.`);
      return;
    }
    const shopName = 'RetailGuard Store';
    const message = `Hello ${customer.name},\n\nThis is a friendly reminder from *${shopName}*.\n\nYour current outstanding balance (Khata) is *₹${customer.pending.toLocaleString()}*.\n\nKindly clear your dues at your earliest convenience.\n\nThank you for being a valued customer! 🙏`;
    const phone = customer.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendToAllWithDues = () => {
    const withDues = customers.filter(c => c.pending > 0 && c.phone);
    if (withDues.length === 0) {
      alert('No customers with pending dues and phone numbers found.');
      return;
    }
    // Open first one directly, then show list
    setWhatsappStatus(`Sending reminders to ${withDues.length} customers…`);
    withDues.forEach((cust, i) => {
      setTimeout(() => {
        sendWhatsAppReminder(cust);
        if (i === withDues.length - 1) {
          setWhatsappStatus('');
        }
      }, i * 1500); // stagger so browser doesn't block popups
    });
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: 'var(--text-primary)' }}>Customer Khata (Credit)</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage store credit, customer balances & send WhatsApp reminders</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={sendToAllWithDues} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#fff', border: 'none' }}>
            <FiSend size={14} /> Remind All via WhatsApp
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> New Customer
          </button>
        </div>
      </header>

      {whatsappStatus && (
        <div style={{ padding: '12px 20px', background: '#25D36622', border: '1px solid #25D366', borderRadius: '12px', marginBottom: '16px', color: '#25D366', fontWeight: 600, fontSize: '0.9rem' }}>
          {whatsappStatus}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatsCard title="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={<FiDollarSign />} trend="+5%" type="danger" />
        <StatsCard title="Active Khata Accounts" value={activeKhata.length} icon={<FiBookOpen />} type="warning" />
        <StatsCard title="Total Customers" value={customers.length} icon={<FiUser />} type="primary" />
      </div>

      <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="search-bar" style={{ flex: 1, position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Customer Name</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Phone Number</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Pending Balance</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        {cust.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>
                      <FiPhone style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      {cust.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 'bold', color: cust.pending > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                      ₹{cust.pending.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Edit Button */}
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => openEditModal(cust)}
                          title="Edit customer details"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>

                        {/* WhatsApp Button */}
                        <button 
                          className="btn btn-secondary"
                          onClick={() => sendWhatsAppReminder(cust)}
                          disabled={cust.pending <= 0}
                          title="Send WhatsApp reminder"
                          style={{ 
                            padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px',
                            background: cust.pending > 0 ? '#25D366' : undefined, 
                            color: cust.pending > 0 ? '#fff' : undefined,
                            border: cust.pending > 0 ? 'none' : undefined 
                          }}
                        >
                          <FiMessageCircle size={13} /> WhatsApp
                        </button>

                        {/* Settle Button */}
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => openPaymentModal(cust)}
                          disabled={cust.pending <= 0}
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        >
                          Settle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Add New Customer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Display Name</label>
                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveCustomer}>Save Customer</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 8px 0' }}>Edit Customer</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Update details for {selectedCustomer.name}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Customer Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} 
                  autoFocus 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number (with country code for WhatsApp)</label>
                <input 
                  type="text" 
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} 
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Outstanding Balance:</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: selectedCustomer.pending > 0 ? '#ef4444' : '#10b981' }}>
                ₹{selectedCustomer.pending.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateCustomer}>Save Changes</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowPaymentModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 8px 0' }}>Record Payment</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Receive payment from {selectedCustomer.name}</p>
            
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>₹{selectedCustomer.pending}</span>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount Paid (₹)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedCustomer.pending} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '24px' }} autoFocus />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: '#10b981' }} onClick={handleRecordPayment}>Confirm Payment</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
