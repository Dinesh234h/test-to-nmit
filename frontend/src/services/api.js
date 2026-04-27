// Persistent data store — reads/writes localStorage so data survives page refreshes.
// Falls back to seed data on first load.

const today = new Date();
const formatDate = (daysAgo) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

/* ─────────────────────────────────────────
   SEED DATA  (used only on very first load)
───────────────────────────────────────── */
const SEED_INVENTORY = [
  { id: 'INV001', name: 'Toor Dal', category: 'Grocery', stock: 5, price: 140, dailySales: 3, status: 'low_stock', unit: 'kg', image: 'https://ui-avatars.com/api/?name=Toor+Dal&background=f59e0b&color=fff', expiryDays: 180 },
  { id: 'INV002', name: 'Basmati Rice', category: 'Grocery', stock: 25, price: 90, dailySales: 4, status: 'in_stock', unit: 'kg', image: 'https://ui-avatars.com/api/?name=Basmati+Rice&background=10b981&color=fff', expiryDays: 300 },
  { id: 'INV003', name: 'Amul Butter (500g)', category: 'Dairy', stock: 2, price: 270, dailySales: 2, status: 'low_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Amul+Butter&background=fef08a&color=000', expiryDays: 10 },
  { id: 'INV004', name: 'Surf Excel (1kg)', category: 'Household', stock: 30, price: 220, dailySales: 2, status: 'in_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Surf+Excel&background=3b82f6&color=fff', expiryDays: 700 },
  { id: 'INV005', name: 'Maggi Noodles (Pack of 12)', category: 'Snacks', stock: 0, price: 168, dailySales: 5, status: 'out_of_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Maggi&background=eab308&color=000', expiryDays: 120 },
  { id: 'INV006', name: 'Aashirvaad Atta', category: 'Grocery', stock: 15, price: 48, dailySales: 3, status: 'in_stock', unit: 'kg', image: 'https://ui-avatars.com/api/?name=Atta&background=d97706&color=fff', expiryDays: 90 },
  { id: 'INV007', name: 'Parle-G Biscuits (800g)', category: 'Snacks', stock: 40, price: 80, dailySales: 6, status: 'in_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Parle-G&background=fcd34d&color=000', expiryDays: 180 },
  { id: 'INV008', name: 'Vim Dishwash Bar', category: 'Household', stock: 3, price: 32, dailySales: 2, status: 'low_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Vim+Bar&background=16a34a&color=fff', expiryDays: 700 },
  { id: 'INV009', name: 'Mother Dairy Milk (1L)', category: 'Dairy', stock: 8, price: 64, dailySales: 10, status: 'low_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Milk&background=60a5fa&color=fff', expiryDays: 2 },
  { id: 'INV010', name: 'Colgate Toothpaste', category: 'Personal Care', stock: 18, price: 120, dailySales: 1, status: 'in_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Colgate&background=ef4444&color=fff', expiryDays: 700 },
  { id: 'INV011', name: "Lay's Chips (Large)", category: 'Snacks', stock: 22, price: 50, dailySales: 4, status: 'in_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Lays+Chips&background=eab308&color=000', expiryDays: 60 },
  { id: 'INV012', name: 'Fortune Oil (1L)', category: 'Grocery', stock: 6, price: 180, dailySales: 2, status: 'low_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Fortune+Oil&background=fde047&color=000', expiryDays: 180 },
  { id: 'INV013', name: 'Sugar', category: 'Grocery', stock: 35, price: 45, dailySales: 3, status: 'in_stock', unit: 'kg', image: 'https://ui-avatars.com/api/?name=Sugar&background=f1f5f9&color=000', expiryDays: 300 },
  { id: 'INV014', name: 'Dettol Soap (3 Pack)', category: 'Personal Care', stock: 12, price: 165, dailySales: 1, status: 'in_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Dettol&background=14b8a6&color=fff', expiryDays: 700 },
  { id: 'INV015', name: 'Britannia Bread', category: 'Bakery', stock: 4, price: 45, dailySales: 8, status: 'low_stock', unit: 'pc', image: 'https://ui-avatars.com/api/?name=Bread&background=fbbf24&color=000', expiryDays: 12 },
];

const SEED_TRANSACTIONS = [
  { id: 'TXN001', date: formatDate(0), items: ['Basmati Rice', 'Toor Dal'], amount: 590, paymentType: 'upi', status: 'completed', upiId: 'customer1@upi' },
  { id: 'TXN002', date: formatDate(0), items: ['Maggi Noodles', "Lay's Chips"], amount: 218, paymentType: 'cash', status: 'completed' },
  { id: 'TXN003', date: formatDate(0), items: ['Amul Butter', 'Milk'], amount: 334, paymentType: 'upi', status: 'flagged', upiId: 'customer2@upi', flag_reason: 'Amount mismatch: expected ₹334, received ₹300' },
  { id: 'TXN004', date: formatDate(1), items: ['Surf Excel', 'Vim Bar'], amount: 252, paymentType: 'upi', status: 'completed', upiId: 'customer3@upi' },
  { id: 'TXN005', date: formatDate(1), items: ['Atta 10kg', 'Sugar', 'Oil'], amount: 705, paymentType: 'cash', status: 'completed' },
  { id: 'TXN006', date: formatDate(1), items: ['Parle-G', 'Bread', 'Milk'], amount: 189, paymentType: 'upi', status: 'completed', upiId: 'customer4@upi' },
  { id: 'TXN007', date: formatDate(2), items: ['Rice 5kg', 'Dal', 'Sugar', 'Oil'], amount: 2815, paymentType: 'upi', status: 'flagged', upiId: 'customer5@upi', flag_reason: 'Unusually high amount - 4.2x average' },
  { id: 'TXN008', date: formatDate(2), items: ['Colgate', 'Dettol Soap'], amount: 285, paymentType: 'cash', status: 'completed' },
  { id: 'TXN009', date: formatDate(2), items: ['Milk', 'Bread'], amount: 109, paymentType: 'cash', status: 'completed' },
  { id: 'TXN010', date: formatDate(3), items: ["Lay's Chips", 'Maggi'], amount: 218, paymentType: 'upi', status: 'completed', upiId: 'customer6@upi' },
  { id: 'TXN011', date: formatDate(3), items: ['Butter', 'Milk', 'Bread'], amount: 379, paymentType: 'cash', status: 'pending' },
  { id: 'TXN012', date: formatDate(4), items: ['Surf Excel', 'Dettol'], amount: 385, paymentType: 'upi', status: 'completed', upiId: 'customer7@upi' },
  { id: 'TXN013', date: formatDate(4), items: ['Atta', 'Rice', 'Dal'], amount: 1070, paymentType: 'cash', status: 'completed' },
  { id: 'TXN014', date: formatDate(5), items: ['Maggi', 'Chips', 'Biscuits'], amount: 298, paymentType: 'upi', status: 'completed', upiId: 'customer8@upi' },
  { id: 'TXN015', date: formatDate(6), items: ['Oil', 'Sugar', 'Dal'], amount: 365, paymentType: 'cash', status: 'completed' },
];

const SEED_PAYMENTS = [
  { id: 'PAY001', transactionId: 'TXN001', date: formatDate(0), method: 'upi', expected: 590, received: 590, status: 'verified', upiRef: 'UPI2026041012345' },
  { id: 'PAY002', transactionId: 'TXN002', date: formatDate(0), method: 'cash', expected: 218, received: 218, status: 'verified' },
  { id: 'PAY003', transactionId: 'TXN003', date: formatDate(0), method: 'upi', expected: 334, received: 300, status: 'mismatch', upiRef: 'UPI2026041012346' },
  { id: 'PAY004', transactionId: 'TXN004', date: formatDate(1), method: 'upi', expected: 252, received: 252, status: 'verified', upiRef: 'UPI2026040912347' },
  { id: 'PAY005', transactionId: 'TXN005', date: formatDate(1), method: 'cash', expected: 705, received: 700, status: 'mismatch' },
  { id: 'PAY006', transactionId: 'TXN006', date: formatDate(1), method: 'upi', expected: 189, received: 189, status: 'verified', upiRef: 'UPI2026040912348' },
  { id: 'PAY007', transactionId: 'TXN007', date: formatDate(2), method: 'upi', expected: 2815, received: 2815, status: 'verified', upiRef: 'UPI2026040812349' },
  { id: 'PAY008', transactionId: 'TXN008', date: formatDate(2), method: 'cash', expected: 285, received: 285, status: 'verified' },
  { id: 'PAY009', transactionId: 'TXN009', date: formatDate(2), method: 'cash', expected: 109, received: 100, status: 'mismatch' },
  { id: 'PAY010', transactionId: 'TXN010', date: formatDate(3), method: 'upi', expected: 218, received: 218, status: 'verified', upiRef: 'UPI2026040712350' },
  { id: 'PAY011', transactionId: 'TXN011', date: formatDate(3), method: 'cash', expected: 379, received: 0, status: 'pending' },
  { id: 'PAY012', transactionId: 'TXN012', date: formatDate(4), method: 'upi', expected: 385, received: 385, status: 'verified', upiRef: 'UPI2026040612351' },
];

const SEED_CUSTOMERS = [
  { id: 'CUST001', name: 'Amit Patel', phone: '9876543210', pending: 2500 },
  { id: 'CUST002', name: 'Priya Sharma', phone: '9123456789', pending: 0 },
  { id: 'CUST003', name: 'Ravi Kumar', phone: '9988776655', pending: 800 },
  { id: 'CUST004', name: 'Sita Devi', phone: '9112233445', pending: 1200 },
  { id: 'CUST005', name: 'Vikram Singh', phone: '9001122334', pending: 0 },
  { id: 'WALKIN', name: 'Walk-in Customer', phone: '', pending: 0 },
];

/* ─────────────────────────────────────────
   LOCALSTORAGE helpers
───────────────────────────────────────── */
const LS_KEYS = {
  inventory:    'rg_inventory',
  transactions: 'rg_transactions',
  payments:     'rg_payments',
  customers:    'rg_customers',
  seeded:       'rg_seeded',
};

const ls = {
  get: (key) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { console.warn('localStorage quota exceeded'); }
  },
};

/* Seed once on very first load */
if (!ls.get(LS_KEYS.seeded)) {
  ls.set(LS_KEYS.inventory,    SEED_INVENTORY);
  ls.set(LS_KEYS.transactions, SEED_TRANSACTIONS);
  ls.set(LS_KEYS.payments,     SEED_PAYMENTS);
  ls.set(LS_KEYS.customers,    SEED_CUSTOMERS);
  ls.set(LS_KEYS.seeded,       true);
}

/* Live in-memory arrays — always sync'd to localStorage */
export let mockInventory    = ls.get(LS_KEYS.inventory)    || [...SEED_INVENTORY];
export let mockTransactions = ls.get(LS_KEYS.transactions) || [...SEED_TRANSACTIONS];
export let mockPayments     = ls.get(LS_KEYS.payments)     || [...SEED_PAYMENTS];
export let mockCustomers    = ls.get(LS_KEYS.customers)    || [...SEED_CUSTOMERS];

const persist = {
  inventory:    () => ls.set(LS_KEYS.inventory,    mockInventory),
  transactions: () => ls.set(LS_KEYS.transactions, mockTransactions),
  payments:     () => ls.set(LS_KEYS.payments,     mockPayments),
  customers:    () => ls.set(LS_KEYS.customers,    mockCustomers),
};

/* ─────────────────────────────────────────
   STATIC DATA (no persistence needed)
───────────────────────────────────────── */
export const mockSalesData = [
  { day: 'Mon', sales: 4250, transactions: 12 },
  { day: 'Tue', sales: 3800, transactions: 10 },
  { day: 'Wed', sales: 5100, transactions: 15 },
  { day: 'Thu', sales: 2900, transactions: 8  },
  { day: 'Fri', sales: 4600, transactions: 13 },
  { day: 'Sat', sales: 6200, transactions: 18 },
  { day: 'Sun', sales: 3400, transactions: 9  },
];

export const mockAlerts = [
  { id: 'ALT001', type: 'stock',   severity: 'high',   title: 'Maggi Noodles - Out of Stock',    message: 'Stock depleted. High demand item - restock urgently.',         time: '10 min ago', icon: '📦' },
  { id: 'ALT002', type: 'payment', severity: 'high',   title: 'Payment Mismatch Detected',       message: 'TXN003: Expected ₹334 but received ₹300 via UPI.',            time: '25 min ago', icon: '💰' },
  { id: 'ALT003', type: 'stock',   severity: 'medium', title: 'Amul Butter - Low Stock',         message: 'Only 2 units remaining. Expected to run out in 1 day.',       time: '1 hr ago',   icon: '⚠️' },
  { id: 'ALT004', type: 'anomaly', severity: 'medium', title: 'Unusual Transaction',             message: 'TXN007: ₹2,815 is 4.2x higher than average transaction.',     time: '2 hrs ago',  icon: '🔍' },
  { id: 'ALT005', type: 'stock',   severity: 'medium', title: 'Britannia Bread - Low Stock',     message: '4 units left. At current rate, will last ~12 hours.',         time: '3 hrs ago',  icon: '🍞' },
  { id: 'ALT006', type: 'payment', severity: 'low',    title: 'Pending Cash Verification',       message: 'TXN011: Cash payment of ₹379 not yet verified.',              time: '5 hrs ago',  icon: '⏳' },
];

export const mockInsights = [
  { id: 'INS000', type: 'festival_promo', severity: 'high', title: 'Upcoming Festival: Baisakhi / Vishu', message: 'Festival is arriving in 4 days.', recommendation: 'Prepare for Baisakhi in 4 days! Stock up on Sweets, Rice, Fruits, Flowers, Jaggery to maximize sales.', confidence: 95, icon: '🎉', trend: 'up' },
  { id: 'INS001', type: 'restock',    severity: 'high',   title: 'insights.restock_alert',      message: 'insights.restock_msg',         messageParams: { item: 'Toor Dal', days: 2, stock: 5 },            recommendation: 'Order at least 30 units of Toor Dal to cover next 10 days of demand.', confidence: 92, icon: '📦', trend: 'up' },
  { id: 'INS002', type: 'restock',    severity: 'high',   title: 'insights.restock_alert',      message: 'insights.restock_msg',         messageParams: { item: 'Mother Dairy Milk', days: 1, stock: 8 },   recommendation: 'Milk is your fastest-moving item. Arrange daily restocking.',           confidence: 97, icon: '🥛', trend: 'up' },
  { id: 'INS003', type: 'sales_drop', severity: 'medium', title: 'insights.sales_drop',         message: 'insights.sales_drop_msg',      messageParams: { percent: 18 },                                    recommendation: 'Thursday sales consistently low. Consider running Thursday promotions.',confidence: 78, icon: '📉', trend: 'down' },
  { id: 'INS004', type: 'anomaly',    severity: 'medium', title: 'insights.unusual_transaction', message: 'insights.unusual_msg',        messageParams: { amount: '2,815', deviation: '4.2' },              recommendation: 'Verify TXN007 details. May be a bulk purchase or data entry error.',   confidence: 85, icon: '🔍', trend: 'up' },
  { id: 'INS005', type: 'payment',    severity: 'high',   title: 'insights.payment_gap',        message: 'insights.payment_gap_msg',     messageParams: { amount: '43' },                                   recommendation: 'Cross-check cash collection for TXN005 and TXN009.',                  confidence: 88, icon: '💸', trend: 'down' },
  { id: 'INS006', type: 'restock',    severity: 'medium', title: 'insights.restock_alert',      message: 'insights.restock_msg',         messageParams: { item: 'Britannia Bread', days: 0.5, stock: 4 },   recommendation: 'Bread will run out by tonight. Place emergency order.',                 confidence: 95, icon: '🍞', trend: 'up' },
];

/* ─────────────────────────────────────────
   API METHODS
───────────────────────────────────────── */
export const api = {
  // ── Customers / Khata ──
  getCustomers: async () => [...mockCustomers],
  addCustomer: async (cust) => {
    const ids = mockCustomers.map(c => parseInt(c.id.replace('CUST', ''), 10)).filter(n => !isNaN(n));
    const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newCust = { ...cust, id: `CUST${String(nextNum).padStart(3, '0')}`, pending: 0 };
    mockCustomers.push(newCust);
    persist.customers();
    return newCust;
  },
  recordKhataPayment: async (id, amount) => {
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCustomers[idx].pending = Math.max(0, mockCustomers[idx].pending - amount);
      persist.customers();
      return mockCustomers[idx];
    }
    return null;
  },
  updateCustomer: async (id, updates) => {
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCustomers[idx] = { ...mockCustomers[idx], ...updates };
      persist.customers();
      return mockCustomers[idx];
    }
    return null;
  },

  // Dashboard
  getDashboardStats: async () => {
    const todayTransactions = mockTransactions.filter(t => t.date === formatDate(0));
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      todaySales,
      activeAlerts:      mockAlerts.length,
      stockWarnings:     mockInventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length,
      paymentMismatches: mockPayments.filter(p => p.status === 'mismatch').length,
      salesChange: +12.5, alertChange: -2, stockChange: +3, paymentChange: +1
    };
  },

  // ── Inventory ──
  getInventory: async () => [...mockInventory],

  addInventoryItem: async (item) => {
    const ids = mockInventory.map(i => parseInt(i.id.replace('INV', ''), 10)).filter(n => !isNaN(n));
    const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newItem = { ...item, id: `INV${String(nextNum).padStart(3, '0')}` };
    mockInventory.push(newItem);
    persist.inventory();
    return newItem;
  },

  updateInventoryItem: async (id, updates) => {
    const idx = mockInventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      mockInventory[idx] = { ...mockInventory[idx], ...updates };
      persist.inventory();
      return mockInventory[idx];
    }
    throw new Error('Item not found');
  },

  deleteInventoryItem: async (id) => {
    const idx = mockInventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      mockInventory.splice(idx, 1);
      persist.inventory();
      return true;
    }
    return false;
  },

  // ── Transactions ──
  getTransactions: async () => [...mockTransactions],

  processCheckout: async (txn) => {
    // Deduct stock from inventory
    txn.items?.forEach(cartItem => {
      const dbItem = mockInventory.find(i => i.id === cartItem.id);
      if (dbItem) {
        dbItem.stock = Math.max(0, parseFloat((dbItem.stock - cartItem.qty).toFixed(3)));
        if (dbItem.stock === 0)      dbItem.status = 'out_of_stock';
        else if (dbItem.stock <= 5)  dbItem.status = 'low_stock';
        else                          dbItem.status = 'in_stock';
      }
    });
    persist.inventory();

    // Update Khata if needed
    let khataAddition = 0;
    if (txn.paymentType === 'khata') {
      khataAddition = txn.amount;
    } else if (txn.paymentType === 'split' && txn.splits) {
      txn.splits.forEach(s => {
        if (s.method === 'khata') khataAddition += parseFloat(s.amount);
      });
    }

    if (khataAddition > 0 && txn.customer && txn.customer.id !== 'WALKIN') {
      const dbCust = mockCustomers.find(c => c.id === txn.customer.id);
      if (dbCust) {
        dbCust.pending += khataAddition;
        persist.customers();
      }
    }

    const txnIds = mockTransactions.map(t => parseInt(t.id.replace('TXN', ''), 10)).filter(n => !isNaN(n));
    const nextTxn = txnIds.length > 0 ? Math.max(...txnIds) + 1 : 1;
    const newTxn = { ...txn, id: `TXN${String(nextTxn).padStart(3, '0')}` };
    mockTransactions.unshift(newTxn);
    persist.transactions();

    const payIds = mockPayments.map(p => parseInt(p.id.replace('PAY', ''), 10)).filter(n => !isNaN(n));
    const nextPay = payIds.length > 0 ? Math.max(...payIds) + 1 : 1;
    const newPay = {
      id: `PAY${String(nextPay).padStart(3, '0')}`,
      transactionId: newTxn.id,
      date: newTxn.date,
      method: newTxn.paymentType,
      expected: newTxn.amount,
      received: newTxn.amount,
      status: 'verified'
    };
    mockPayments.unshift(newPay);
    persist.payments();

    return newTxn;
  },

  // ── Payments ──
  getPayments: async () => [...mockPayments],

  // ── Insights ──
  getInsights: async () => {
    const expiringItems = mockInventory.filter(i => i.expiryDays <= 14 && i.stock > 0);
    const expiryInsights = expiringItems.map(i => ({
      id: `INS-EXP-${i.id}`,
      type: 'sales_drop',
      severity: 'high',
      title: 'insights.expiring_soon',
      message: 'insights.expiring_soon_msg',
      messageParams: { item: i.name, days: i.expiryDays },
      recommendation: 'insights.expiring_soon_rec',
      recommendationParams: { stock: i.stock, unit: i.unit === 'kg' ? 'kg' : 'units' },
      confidence: 90,
      icon: '⏳',
      trend: 'down'
    }));
    return [...expiryInsights, ...mockInsights];
  },

  // ── Alerts & Sales ──
  getAlerts:    async () => mockAlerts,
  getSalesData: async () => mockSalesData,
};

export default api;
