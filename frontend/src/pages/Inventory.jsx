import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiLayers, FiAlertTriangle, FiDollarSign, FiBox, FiCamera } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import api from '../services/api';
import './Inventory.css';

export default function Inventory() {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Grocery', stock: '', price: '', unit: 'pc', expiryDate: '', image: '' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const data = await api.getInventory();
    setInventory(data);
  };

  const filteredInventory = inventory.filter(item =>
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const allCategories = ['All', ...new Set(inventory.map(i => i.category))];

  const getStatusBadge = (status) => {
    const classes = {
      in_stock: 'badge-success',
      low_stock: 'badge-warning',
      out_of_stock: 'badge-danger'
    };
    return <span className={`badge ${classes[status]}`}>{t(`inventory.${status}`)}</span>;
  };

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.stock * i.price), 0);
  const categoriesCount = [...new Set(inventory.map(i => i.category))].length;

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('Camera access denied or unavailable.');
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setNewItem(prev => ({ ...prev, image: dataUrl }));
    
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  const handleSave = async () => {
    if (!newItem.name || newItem.stock === '' || newItem.price === '') return;
    
    const ds = newItem.dailySales || Math.floor(Math.random() * 5) + 1;
    const aiThreshold = Math.max(3, Math.ceil(ds * 2));
    const stockVal = parseFloat(newItem.stock);
    const status = stockVal === 0 ? 'out_of_stock' : stockVal <= aiThreshold ? 'low_stock' : 'in_stock';
    
    let expiryDays = newItem.expiryDays;
    if (newItem.expiryDate) {
      const diff = new Date(newItem.expiryDate) - new Date();
      expiryDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    if (editingItemId) {
      await api.updateInventoryItem(editingItemId, {
        ...newItem,
        stock: stockVal,
        price: parseFloat(newItem.price),
        status,
        expiryDays: expiryDays || 999
      });
    } else {
      await api.addInventoryItem({
        ...newItem,
        stock: stockVal,
        price: parseFloat(newItem.price),
        dailySales: ds,
        status,
        expiryDays: expiryDays || 999
      });
    }
    resetModal();
    loadInventory();
  };

  const handleEditClick = (item) => {
    setNewItem(item);
    setEditingItemId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    await api.deleteInventoryItem(id);
    loadInventory();
  };

  const resetModal = () => {
    setShowModal(false);
    setNewItem({ name: '', category: 'Grocery', stock: '', price: '', unit: 'pc', expiryDate: '', image: '' });
    setEditingItemId(null);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <div className="page-container" id="inventory-page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{t('inventory.title')}</h1>
            <p>{t('inventory.subtitle')}</p>
          </div>
          <button className="btn btn-primary" id="add-inventory-btn" onClick={() => { resetModal(); setShowModal(true); }}>
            <FiPlus size={16} />
            {t('inventory.add_item')}
          </button>
        </div>
      </div>

      <div className="grid-4 inventory-stats">
        <StatsCard title={t('inventory.total_items')} value={totalItems} icon="📦" gradient="primary" delay={1} />
        <StatsCard title={t('inventory.low_stock_items')} value={lowStockItems} icon="⚠️" gradient="warm" delay={2} />
        <StatsCard title={t('inventory.total_value')} value={`₹${totalValue.toLocaleString()}`} icon="💎" gradient="secondary" delay={3} />
        <StatsCard title={t('inventory.categories')} value={categoriesCount} icon="📁" gradient="accent" delay={4} />
      </div>

      <div className="inventory-table-card glass-card animate-fade-in-up delay-3">
        <div className="table-toolbar">
            <div className="search-wrapper">
              <FiSearch size={16} className="search-icon" />
              <input
                type="text"
                className="input-field search-input"
                placeholder={t('inventory.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="inventory-search"
              />
            </div>
          </div>
          <div className="category-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 18px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            {allCategories.map(c => (
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

        <div className="table-wrapper">
          <table className="data-table" id="inventory-table">
            <thead>
              <tr>
                <th>{t('inventory.item_name')}</th>
                <th>{t('inventory.category')}</th>
                <th>{t('inventory.stock')}</th>
                <th>{t('inventory.price')}</th>
                <th>{t('inventory.status')}</th>
                <th>{t('inventory.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id} className={item.status === 'out_of_stock' ? 'row-danger' : item.status === 'low_stock' ? 'row-warning' : ''}>
                  <td>
                    <div className="item-name-cell">
                      <span className="item-name">{t(`items.${item.id}`, item.name)}</span>
                      <span className="item-id">{item.id}</span>
                    </div>
                  </td>
                  <td><span className="category-tag">{item.category}</span></td>
                  <td>
                    <div className="stock-cell">
                      <span className={`stock-value ${item.status === 'low_stock' || item.status === 'out_of_stock' ? 'stock-low' : ''}`}>{item.stock}</span>
                      <div className="stock-bar">
                        <div 
                          className={`stock-bar-fill ${item.status === 'out_of_stock' ? 'fill-danger' : item.status === 'low_stock' ? 'fill-warning' : 'fill-success'}`}
                          style={{ width: `${Math.min((item.stock / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="price-cell">₹{item.price}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" title={t('inventory.edit')} onClick={() => handleEditClick(item)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" title={t('inventory.delete')} onClick={() => handleDelete(item.id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItemId ? t('inventory.edit') || 'Edit Item' : t('inventory.add_item')}</h2>
              <button className="modal-close" onClick={resetModal}><FiX size={18} /></button>
            </div>
            
            <div className="form-group" style={{ textAlign: 'center' }}>
              {/* Unconditionally rendered video reference to prevent race conditions on stream assignment */}
              <div style={{ position: 'relative', marginBottom: '10px', display: isCameraOpen ? 'block' : 'none' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover', background: '#000' }} />
                <button className="btn btn-primary" onClick={capturePhoto} style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>Capture Photo</button>
              </div>

              {!isCameraOpen && newItem.image ? (
                <div style={{ marginBottom: '10px' }}>
                  <img src={newItem.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                  <br />
                  <button className="btn btn-sm btn-secondary" onClick={() => setNewItem({...newItem, image: ''})} style={{ marginTop: '8px' }}>Remove Photo</button>
                </div>
              ) : !isCameraOpen && (
                <button className="btn btn-secondary" onClick={startCamera} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <FiCamera size={16} /> Take Photo
                </button>
              )}
            </div>

            <div className="form-group">
              <label>{t('inventory.item_name')}</label>
              <input className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('inventory.category')}</label>
              <select className="select-field" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option>Grocery</option>
                <option>Dairy</option>
                <option>Snacks</option>
                <option>Household</option>
                <option>Personal Care</option>
                <option>Bakery</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Unit Format</label>
                <select className="select-field" value={newItem.unit || 'pc'} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                  <option value="pc">Packet / Pieces</option>
                  <option value="kg">Bulk / Kilogram</option>
                </select>
              </div>
              <div className="form-group">
                <label>Expiry Date (Optional)</label>
                <input className="input-field" type="date" value={newItem.expiryDate || ''} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('inventory.stock')}</label>
                <input className="input-field" type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t('inventory.price')}</label>
                <input className="input-field" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={resetModal}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
