import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiX, FiUser, FiPhone,
  FiCheck, FiChevronDown, FiPrinter, FiDownload, FiShare2,
  FiShoppingCart, FiAlertCircle, FiCreditCard, FiDollarSign, FiMic, FiCamera
} from 'react-icons/fi';
import api, { mockInventory, mockCustomers } from '../services/api';
import CameraScanner from '../components/CameraScanner';
import './POS.css';

/* ──────────────────── payment methods ──────────────────── */
const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'khata', label: 'Khata', icon: '📒' },
];

let orderCounter = 1000;

export default function POS() {
  const { t } = useTranslation();

  /* ──── state ──── */
  const [customers, setCustomers] = useState(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers.find(c => c.id === 'WALKIN') || mockCustomers[0]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  const [mainMethod, setMainMethod] = useState('cash');
  const [splits, setSplits] = useState([{ method: 'cash', amount: '' }]);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const customerDropdownRef = useRef(null);
  const receiptRef = useRef(null);

  /* ──── derived ──── */
  const isWalkIn = selectedCustomer?.id === 'WALKIN';
  const isSplit = mainMethod === 'split';
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const splitTotal = splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const splitValid = isSplit ? Math.abs(splitTotal - cartTotal) < 0.01 && splits.every(s => parseFloat(s.amount) > 0) : true;
  const canCheckout = cart.length > 0 && selectedCustomer && (isSplit ? splitValid : true);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* sync default split amount */
  useEffect(() => {
    if (!isSplit) return;
    if (splits.length === 1 && splits[0].amount === '') {
      setSplits([{ ...splits[0], amount: cartTotal || '' }]);
    }
  }, [cartTotal, isSplit]);

  /* disable khata if walkin */
  useEffect(() => {
    if (isWalkIn && mainMethod === 'khata') {
      setMainMethod('cash');
    }
  }, [isWalkIn, mainMethod]);

  /* ──── filtering ──── */
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const categories = ['All', ...new Set(mockInventory.map(p => p.category))];

  const filteredProducts = mockInventory.filter(p =>
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );
  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice commands are not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      const isAdd = transcript.includes('add') || transcript.includes('put');
      const isRemove = transcript.includes('remove') || transcript.includes('delete');
      
      // Attempt to identify item
      const matchedProduct = mockInventory.find(p => transcript.includes(p.name.toLowerCase()));
      
      if (matchedProduct) {
        if (isRemove && cart.find(i => i.id === matchedProduct.id)) {
          removeItem(matchedProduct.id);
        } else {
          // Default to add
          addToCart(matchedProduct);
        }
      }
    };
    recognition.onerror = (e) => console.error(e);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };


  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + (product.unit === 'kg' ? 0.25 : 1) };
        return next;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.image,
        qty: product.unit === 'kg' ? 0.25 : 1,
        assignedCustomer: selectedCustomer || null,
      }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const step = i.unit === 'kg' ? 0.25 : 1;
        return { ...i, qty: Math.max(step, i.qty + delta) };
      }
      return i;
    }));
  };

  const setExactQty = (id, val) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setCart(prev => prev.map(i => i.id === id ? { ...i, qty: num } : i));
    } else if (val === '') {
      setCart(prev => prev.map(i => i.id === id ? { ...i, qty: val } : i));
    }
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const assignCustomerToItem = (itemId, customerId) => {
    const cust = customers.find(c => c.id === customerId);
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, assignedCustomer: cust } : i));
  };

  /* ──── split helpers ──── */
  const addSplit = () => setSplits(prev => [...prev, { method: 'cash', amount: '' }]);
  const removeSplit = (idx) => setSplits(prev => prev.filter((_, i) => i !== idx));
  const updateSplit = (idx, field, value) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  /* ──── checkout ──── */
  const handleCheckout = async () => {
    orderCounter += 1;
    const order = {
      orderId: `ORD${orderCounter}`,
      date: new Date(),
      customer: selectedCustomer,
      items: cart.map(i => ({ ...i })),
      total: cartTotal,
      payments: isSplit
        ? splits.map(s => ({ method: s.method, amount: parseFloat(s.amount) }))
        : [{ method: mainMethod, amount: cartTotal }],
    };

    try {
      await api.processCheckout({
        date: order.date.toISOString().split('T')[0],
        items: order.items.map(i => ({ id: i.id, name: i.name, qty: i.qty })),
        amount: order.total,
        paymentType: isSplit ? 'split' : mainMethod,
        splits: isSplit ? splits.map(s => ({ method: s.method, amount: parseFloat(s.amount) })) : null,
        customer: selectedCustomer,
        status: 'completed'
      });
    } catch (e) {
      console.error('Failed to add transaction', e);
    }

    setLastOrder(order);
    setShowSuccessPopup(true);

    /* simulate: if any split uses khata, add to customer pending */
    /* (mock — real impl would hit backend) */
  };

  const closeSuccessAndShowReceipt = () => {
    setShowSuccessPopup(false);
    setShowReceipt(true);
  };

  const closeReceiptAndReset = () => {
    setShowReceipt(false);
    setCart([]);
    setSplits([{ method: 'cash', amount: '' }]);
    setMainMethod('cash');
    setSelectedCustomer(initialCustomers.find(c => c.id === 'WALKIN') || null);
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Receipt — ${lastOrder?.orderId}</title>
      <style>
        body{font-family:monospace;font-size:13px;padding:20px;max-width:320px;margin:auto}
        h2{text-align:center;margin-bottom:4px}
        .line{border-top:1px dashed #000;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        td{padding:3px 0}
        .right{text-align:right}
        .bold{font-weight:bold}
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;
    const html = `
      <html><head><title>Receipt — ${lastOrder?.orderId}</title>
      <style>
        body{font-family:monospace;font-size:13px;padding:20px;max-width:320px;margin:auto}
        h2{text-align:center;margin-bottom:4px}
        .line{border-top:1px dashed #000;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        td{padding:3px 0}
        .right{text-align:right}
        .bold{font-weight:bold}
      </style></head><body>${content.innerHTML}</body></html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${lastOrder?.orderId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div className="page-container pos-page" id="pos-page">
      <div className="pos-layout">
        {/* ═══ LEFT: Products ═══ */}
        <div className="pos-products-panel">
          <div className="pos-panel-header">
            <h2>Products</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="pos-search-wrapper">
                <FiSearch size={15} className="pos-search-icon" />
                <input
                  className="input-field pos-search"
                  placeholder="Search items..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  id="pos-product-search"
                />
              </div>
              <button 
                className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                title="Voice Command Checkout"
                onClick={handleVoiceCommand}
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <FiMic size={18} />
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                title="Scan Item with Camera"
                onClick={() => setShowScanner(true)}
                style={{ padding: '8px', borderRadius: '8px', background: '#0B3C5D', color: '#fff', border: 'none' }}
              >
                <FiCamera size={18} />
              </button>
            </div>
          </div>

          <div className="pos-category-filters" style={{ display: 'flex', gap: '8px', padding: '0 18px 14px', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
            {categories.map(c => (
              <button 
                key={c} 
                className={`btn btn-sm ${selectedCategory === c ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(c)}
                style={{ borderRadius: '16px', whiteSpace: 'nowrap' }}
              >
                {t(`categories.${c.toLowerCase().replace(/ /g, '_')}`, c)}
              </button>
            ))}
          </div>

          <div className="pos-products-grid">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                className={`pos-product-card ${p.stock === 0 ? 'out-of-stock' : ''}`}
                onClick={() => p.stock > 0 && addToCart(p)}
                disabled={p.stock === 0}
                id={`pos-product-${p.id}`}
              >
                <span className="pos-prod-name">{t(`items.${p.id}`, p.name)}</span>
                <div className="pos-prod-meta">
                  <span className="pos-prod-price">₹{p.price}</span>
                  <span className={`pos-prod-stock ${p.status === 'low_stock' || p.status === 'out_of_stock' ? 'low' : ''}`}>
                    {p.stock === 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT: Cart + Payment ═══ */}
        <div className="pos-cart-panel">
          {/* ── Customer Selector ── */}
          <div className="pos-customer-section" ref={customerDropdownRef}>
            <label className="pos-section-label">Customer</label>

            {selectedCustomer ? (
              <div className="pos-selected-customer">
                <div className="pos-cust-avatar">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="pos-cust-info">
                  <span className="pos-cust-name">{selectedCustomer.name}</span>
                  <span className="pos-cust-detail">
                    {isWalkIn ? 'Walk-in' : selectedCustomer.phone}
                    {selectedCustomer.pending > 0 && (
                      <span className="pos-cust-pending"> · ₹{selectedCustomer.pending.toLocaleString()} pending</span>
                    )}
                  </span>
                </div>
                <button className="pos-cust-change-btn" onClick={() => { setSelectedCustomer(null); setShowCustomerDropdown(true); }}>
                  Change
                </button>
              </div>
            ) : (
              <div className="pos-customer-dropdown-wrapper">
                <div
                  className="pos-customer-trigger"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  id="pos-customer-selector"
                >
                  <FiUser size={15} />
                  <span>Select Customer</span>
                  <FiChevronDown size={15} className={`chevron ${showCustomerDropdown ? 'open' : ''}`} />
                </div>

                {showCustomerDropdown && (
                  <div className="pos-customer-dropdown animate-fade-in">
                    <div className="pos-dropdown-search">
                      <FiSearch size={14} />
                      <input
                        placeholder="Search name or phone..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        autoFocus
                        id="pos-customer-search"
                      />
                    </div>
                    <ul className="pos-customer-list">
                      {filteredCustomers.map(c => (
                        <li
                          key={c.id}
                          className={`pos-customer-option ${c.id === 'WALKIN' ? 'walkin' : ''}`}
                          onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                          id={`pos-customer-${c.id}`}
                        >
                          <div className="pos-cust-opt-avatar">{c.name.charAt(0)}</div>
                          <div className="pos-cust-opt-info">
                            <span className="pos-cust-opt-name">{c.name}</span>
                            {c.phone && <span className="pos-cust-opt-phone"><FiPhone size={11} /> {c.phone}</span>}
                          </div>
                          <span className={`pos-cust-opt-pending ${c.pending > 0 ? 'has-pending' : ''}`}>
                            ₹{c.pending.toLocaleString()} {c.pending > 0 ? 'pending' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Cart Items ── */}
          <div className="pos-cart-section">
            <label className="pos-section-label">
              <FiShoppingCart size={14} /> Cart
              {cart.length > 0 && <span className="pos-cart-count">{cart.length}</span>}
            </label>

            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <FiShoppingCart size={32} />
                <p>Add items to start billing</p>
              </div>
            ) : (
              <div className="pos-cart-items">
                {cart.map(item => (
                  <div key={item.id} className="pos-cart-item">
                    <div className="pos-cart-item-top">
                      <div className="pos-cart-item-info">
                        <span className="pos-cart-item-name">{item.name}</span>
                        <span className="pos-cart-item-price">₹{item.price} × {item.qty} = ₹{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                      <div className="pos-cart-qty-controls">
                        <button className="pos-qty-btn" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.id, -1); }}><FiMinus size={13} /></button>
                        {item.unit === 'kg' ? (
                          <input 
                            type="number" 
                            step="0.01" 
                            style={{ width: '48px', textAlign: 'center', border: '1px solid var(--border-subtle)', borderRadius: '4px', background: 'transparent' }} 
                            value={item.qty} 
                            onChange={(e) => setExactQty(item.id, e.target.value)} 
                          />
                        ) : (
                          <span className="pos-qty-value">{item.qty}</span>
                        )}
                        <button className="pos-qty-btn" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.id, 1); }}><FiPlus size={13} /></button>
                        <button className="pos-qty-btn remove" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.id); }}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                    {/* Item assignment */}
                    <div className="pos-cart-item-assign">
                      <span className="pos-assign-label">Assigned to:</span>
                      <select
                        className="pos-assign-select"
                        value={item.assignedCustomer?.id || ''}
                        onChange={e => assignCustomerToItem(item.id, e.target.value)}
                      >
                        <option value="" disabled>Select</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Payment Section ── */}
          {cart.length > 0 && (
            <div className="pos-payment-section">
              <div className="pos-total-bar">
                <span className="pos-total-label">Total</span>
                <span className="pos-total-value">₹{cartTotal.toLocaleString()}</span>
              </div>

              {/* Payment Methods */}
              <div className="pos-payment-methods">
                <label className="pos-section-label">Payment Method</label>
                <div className="pos-method-buttons">
                  <button 
                    className={`pos-method-btn ${mainMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setMainMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button 
                    className={`pos-method-btn ${mainMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setMainMethod('upi')}
                  >
                    📱 UPI
                  </button>
                  <button 
                    className={`pos-method-btn ${mainMethod === 'khata' ? 'active' : ''}`}
                    onClick={() => setMainMethod('khata')}
                    disabled={isWalkIn}
                    title={isWalkIn ? "Khata available only for registered customers" : ""}
                  >
                    📒 Khata
                  </button>
                  <button 
                    className={`pos-method-btn ${mainMethod === 'split' ? 'active' : ''}`}
                    onClick={() => {
                      setMainMethod('split');
                      if (splits.length === 1 && splits[0].amount === '') {
                        setSplits([{ method: 'cash', amount: String(cartTotal) }]);
                      }
                    }}
                  >
                    🔀 Split
                  </button>
                </div>
                {mainMethod === 'khata' && isWalkIn && (
                  <div className="pos-khata-tooltip" style={{position: 'relative', bottom: '0', marginTop: '8px'}}>
                    <FiAlertCircle size={13} />
                    <span>Khata available only for registered customers</span>
                  </div>
                )}
              </div>

              {isSplit && (
                <div className="pos-splits-container">
                  {splits.map((split, idx) => {
                    const isKhata = split.method === 'khata';
                    const khataDisabled = isKhata && isWalkIn;

                    return (
                      <div key={idx} className={`pos-split-row ${khataDisabled ? 'disabled' : ''}`}>
                        <select
                          className="pos-split-method"
                          value={split.method}
                          onChange={e => updateSplit(idx, 'method', e.target.value)}
                        >
                          {paymentMethods.map(pm => (
                            <option
                              key={pm.value}
                              value={pm.value}
                              disabled={pm.value === 'khata' && isWalkIn}
                            >
                              {pm.icon} {pm.label}
                            </option>
                          ))}
                        </select>
                        <div className="pos-split-amount-wrapper">
                          <span className="pos-split-rupee">₹</span>
                          <input
                            type="number"
                            className="pos-split-amount"
                            placeholder="0"
                            value={split.amount}
                            onChange={e => updateSplit(idx, 'amount', e.target.value)}
                            disabled={khataDisabled}
                          />
                        </div>
                        {splits.length > 1 && (
                          <button className="pos-split-remove" type="button" onClick={(e) => { e.preventDefault(); removeSplit(idx); }}>
                            <FiX size={14} />
                          </button>
                        )}
                        {khataDisabled && (
                          <div className="pos-khata-tooltip">
                            <FiAlertCircle size={13} />
                            <span>Khata available only for registered customers</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button className="pos-add-split-btn" onClick={addSplit}>
                    <FiPlus size={14} /> Add Split
                  </button>

                  {/* Split validation */}
                  <div className={`pos-split-summary ${splitValid ? 'valid' : 'invalid'}`}>
                    <span>Split Total: ₹{splitTotal.toLocaleString()}</span>
                    {!splitValid && (
                      <span className="pos-split-warning">
                        <FiAlertCircle size={13} />
                        {splitTotal < cartTotal
                          ? `₹${(cartTotal - splitTotal).toLocaleString()} remaining`
                          : `₹${(splitTotal - cartTotal).toLocaleString()} excess`}
                      </span>
                    )}
                    {splitValid && <FiCheck size={15} className="pos-split-check" />}
                  </div>
                </div>
              )}

              {/* Checkout button */}
              {!selectedCustomer && (
                <div className="pos-no-customer-warning">
                  <FiAlertCircle size={14} />
                  <span>Please select a customer to proceed</span>
                </div>
              )}

              <button
                className={`pos-checkout-btn ${canCheckout ? '' : 'disabled'}`}
                disabled={!canCheckout}
                onClick={handleCheckout}
                id="pos-checkout-btn"
              >
                <FiCreditCard size={18} />
                {isSplit ? `Cash Out ₹${cartTotal.toLocaleString()}` : `Pay ₹${cartTotal.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SUCCESS POPUP ═══ */}
      {showSuccessPopup && (
        <div className="modal-overlay" onClick={closeSuccessAndShowReceipt}>
          <div className="pos-success-popup animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="pos-success-icon">
              <FiCheck size={40} />
            </div>
            <h2>Payment Received!</h2>
            <p className="pos-success-amount">₹{lastOrder?.total.toLocaleString()}</p>
            <p className="pos-success-id">Order: {lastOrder?.orderId}</p>
            <div className="pos-success-breakdown">
              {lastOrder?.payments.map((p, i) => (
                <div key={i} className="pos-success-pay-row">
                  <span>{paymentMethods.find(m => m.value === p.method)?.icon} {paymentMethods.find(m => m.value === p.method)?.label}</span>
                  <span>₹{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary pos-success-btn" onClick={closeSuccessAndShowReceipt}>
              View Receipt
            </button>
          </div>
        </div>
      )}

      {/* ═══ RECEIPT POPUP ═══ */}
      {showReceipt && lastOrder && (
        <div className="modal-overlay" onClick={closeReceiptAndReset}>
          <div className="pos-receipt-modal animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="pos-receipt-header">
              <h2>Receipt</h2>
              <button className="modal-close" onClick={closeReceiptAndReset}><FiX size={18} /></button>
            </div>

            <div className="pos-receipt-body" ref={receiptRef}>
              <div className="header-logo" style={{ textAlign: 'center', marginBottom: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 100 100" fill="#000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 47 7.5 L 47 44 L 35 56 L 47 76 L 47 92.5 L 34 86 L 26 60 L 26 82 L 10 74 L 10 26 Z M 46.5 24 L 26 34 L 26 44 L 46.5 44 Z" />
                  <path d="M 53 7.5 L 90 26 L 90 74 L 53 92.5 L 53 76 L 74 65.5 L 74 54 L 53 54 L 53 44 L 74 44 L 74 34 L 53 23.5 Z" />
                </svg>
              </div>
              <h2 style={{ textAlign: 'center', marginBottom: 2 }}>RetailGuard</h2>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>Rajesh General Store</p>
              <div className="line" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '10px 0' }}></div>

              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <tbody>
                  <tr><td style={{ color: '#94a3b8' }}>Order ID</td><td className="right" style={{ textAlign: 'right', fontWeight: 600 }}>{lastOrder.orderId}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>Date</td><td className="right" style={{ textAlign: 'right' }}>{lastOrder.date.toLocaleDateString()}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>Time</td><td className="right" style={{ textAlign: 'right' }}>{lastOrder.date.toLocaleTimeString()}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>Customer</td><td className="right" style={{ textAlign: 'right' }}>{lastOrder.customer.name}</td></tr>
                </tbody>
              </table>

              <div className="line" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '10px 0' }}></div>

              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <td>Item</td><td style={{ textAlign: 'center' }}>Qty</td><td style={{ textAlign: 'right' }}>Price</td>
                  </tr>
                </thead>
                <tbody>
                  {lastOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div>{item.name}</div>
                        {item.assignedCustomer && item.assignedCustomer.id !== lastOrder.customer.id && (
                          <div style={{ fontSize: '0.65rem', color: '#10b981' }}>→ {item.assignedCustomer.name}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="line" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '10px 0' }}></div>

              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <tbody>
                  {lastOrder.payments.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: '#94a3b8' }}>{paymentMethods.find(m => m.value === p.method)?.label}</td>
                      <td style={{ textAlign: 'right' }}>₹{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="line" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '10px 0' }}></div>

              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800, fontSize: '1rem' }}>TOTAL</td>
                    <td className="right bold" style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>₹{lastOrder.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', marginTop: 12 }}>Thank you for shopping!</p>
            </div>

            <div className="pos-receipt-actions">
              <button className="btn btn-secondary" onClick={handleDownload} id="receipt-download-btn">
                <FiDownload size={15} /> Download
              </button>
              <button className="btn btn-secondary" onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `Receipt ${lastOrder.orderId}`, text: `Order ${lastOrder.orderId} — ₹${lastOrder.total}` });
                }
              }} id="receipt-share-btn">
                <FiShare2 size={15} /> Share
              </button>
              <button className="btn btn-primary" onClick={handlePrint} id="receipt-print-btn">
                <FiPrinter size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraScanner
          onItemDetected={(product) => addToCart(product)}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
