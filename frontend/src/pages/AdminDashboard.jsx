import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api, formatPeso, formatDate, formatDateTime } from '../utils/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ThemeToggle from '../components/ThemeToggle';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alert, setAlert] = useState(null);

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState(null);

  // Inventory state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAdjust, setStockAdjust] = useState({ adjustment: 0, reason: '' });
  const [productForm, setProductForm] = useState({
    name: '', barcode: '', category: '', brand: '', description: '',
    unitPrice: '', costPrice: '', tingiPrice: '', tingiPerPack: '1', tingiUnit: 'piraso',
    stock: '', reorderLevel: '5', maxStock: '100', unit: 'pcs', expiryDate: ''
  });

  // Category state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '📦' });

  // Sales state
  const [transactions, setTransactions] = useState([]);
  const [salesDateFilter, setSalesDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [salesReceiptSearch, setSalesReceiptSearch] = useState('');
  const [salesPeriod, setSalesPeriod] = useState('week');
  const [salesCustomMonth, setSalesCustomMonth] = useState('');
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [salesStaffFilter, setSalesStaffFilter] = useState('');
  const [salesProductFilter, setSalesProductFilter] = useState('');
  const [staffList, setStaffList] = useState([]);

  // Reports state
  const [reportPeriod, setReportPeriod] = useState('month');
  const [bestSellers, setBestSellers] = useState([]);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });

  // Activity state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('');

  // Feature search
  const [featureSearch, setFeatureSearch] = useState('');

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  // Low stock alert state
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [dismissLowStock, setDismissLowStock] = useState(false);
  // Near-expiry alert state
  const [nearExpiryProducts, setNearExpiryProducts] = useState([]);
  const [dismissNearExpiry, setDismissNearExpiry] = useState(false);
  // Live clock
  const [now, setNow] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin') { navigate('/'); return; }
    setUser(parsed);
  }, [navigate]);

  const showAlertMsg = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.get('/reports/dashboard');
      setDashboardStats(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      let url = '/products?';
      if (productSearch) url += `search=${productSearch}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      const data = await api.get(url);
      setProducts(data);
    } catch (e) { console.error(e); }
  }, [productSearch, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.get('/categories');
      setCategories(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      let url;
      if (salesReceiptSearch) {
        url = `/transactions?receipt=${encodeURIComponent(salesReceiptSearch)}`;
      } else {
        url = `/transactions?date=${salesDateFilter}`;
      }
      const data = await api.get(url);
      setTransactions(data);
    } catch (e) { console.error(e); }
  }, [salesDateFilter, salesReceiptSearch]);

  const loadSalesAnalytics = useCallback(async () => {
    try {
      let url;
      if (salesCustomMonth) {
        const [year, month] = salesCustomMonth.split('-').map(Number);
        const startDate = `${salesCustomMonth}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${salesCustomMonth}-${String(lastDay).padStart(2, '0')}`;
        url = `/reports/sales?startDate=${startDate}&endDate=${endDate}`;
      } else {
        url = `/reports/sales?period=${salesPeriod}`;
      }
      if (salesStaffFilter) url += `&staffId=${salesStaffFilter}`;
      if (salesProductFilter) url += `&productName=${encodeURIComponent(salesProductFilter)}`;
      const data = await api.get(url);
      setSalesAnalytics(data);
    } catch (e) { console.error(e); }
  }, [salesPeriod, salesCustomMonth, salesStaffFilter, salesProductFilter]);

  const loadStaffList = useCallback(async () => {
    try { setStaffList(await api.get('/reports/staff-list')); } catch (e) { console.error(e); }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const [sellers, invReport, staffPerf, monthly] = await Promise.all([
        api.get(`/reports/best-sellers?period=${reportPeriod}`),
        api.get('/reports/inventory-report'),
        api.get(`/reports/staff-performance?period=${reportPeriod}`),
        api.get('/reports/monthly-comparison')
      ]);
      setBestSellers(sellers);
      setInventoryReport(invReport);
      setStaffPerformance(staffPerf);
      setMonthlyComparison(monthly);
    } catch (e) { console.error(e); }
  }, [reportPeriod]);

  const loadUsers = useCallback(async () => {
    try {
      let url = '/users?';
      if (userFilter) url += `role=${userFilter}&`;
      if (userSearch) url += `search=${userSearch}&`;
      const data = await api.get(url);
      setUsers(data);
    } catch (e) { console.error(e); }
  }, [userFilter, userSearch]);

  const loadPendingStaff = useCallback(async () => {
    try {
      const data = await api.get('/users/pending-staff');
      setPendingStaff(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadLowStockAlert = useCallback(async () => {
    try {
      const data = await api.get('/products?lowStock=true');
      setLowStockProducts(data);
      setDismissLowStock(false);
    } catch (e) { console.error(e); }
  }, []);

  const loadNearExpiryAlert = useCallback(async () => {
    try {
      const data = await api.get('/products?nearExpiry=true');
      setNearExpiryProducts(data);
      setDismissNearExpiry(false);
    } catch (e) { console.error(e); }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      let url = '/users/activity-logs/all?';
      if (activityFilter) url += `category=${activityFilter}`;
      const data = await api.get(url);
      setActivityLogs(data);
    } catch (e) { console.error(e); }
  }, [activityFilter]);

  useEffect(() => {
    if (!user) return;
    loadLowStockAlert();
    loadNearExpiryAlert();
  }, [user, loadLowStockAlert, loadNearExpiryAlert]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'dashboard') { loadDashboard(); loadCategories(); }
    if (activeTab === 'inventory') { loadProducts(); loadCategories(); }
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'sales') { loadTransactions(); loadSalesAnalytics(); loadStaffList(); loadCategories(); }
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'users') { loadUsers(); loadPendingStaff(); }
    if (activeTab === 'activity') loadActivity();
  }, [user, activeTab, loadDashboard, loadProducts, loadCategories, loadTransactions, loadSalesAnalytics, loadReports, loadUsers, loadPendingStaff, loadActivity, loadStaffList]);

  useEffect(() => {
    if (activeTab === 'sales') loadSalesAnalytics();
  }, [salesStaffFilter, salesProductFilter, salesPeriod, salesCustomMonth, activeTab, loadSalesAnalytics]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

  // Product CRUD
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, barcode: product.barcode || '', category: product.category?._id || '',
        brand: product.brand || '', description: product.description || '',
        unitPrice: product.unitPrice, costPrice: product.costPrice || '',
        tingiPrice: product.tingiPrice || '', tingiPerPack: product.tingiPerPack || '1',
        tingiUnit: product.tingiUnit || 'piraso',
        stock: product.stock, reorderLevel: product.reorderLevel || '5',
        maxStock: product.maxStock || '100', unit: product.unit || 'pcs',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-CA') : ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', barcode: '', category: categories[0]?._id || '', brand: '', description: '',
        unitPrice: '', costPrice: '', tingiPrice: '', tingiPerPack: '1', tingiUnit: 'piraso',
        stock: '', reorderLevel: '5', maxStock: '100', unit: 'pcs', expiryDate: ''
      });
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    try {
      const payload = {
        ...productForm,
        unitPrice: Number(productForm.unitPrice),
        costPrice: Number(productForm.costPrice) || 0,
        tingiPrice: Number(productForm.tingiPrice) || 0,
        tingiPerPack: Number(productForm.tingiPerPack) || 1,
        stock: Number(productForm.stock),
        reorderLevel: Number(productForm.reorderLevel),
        maxStock: Number(productForm.maxStock),
        expiryDate: productForm.expiryDate || null
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showAlertMsg('Product updated!');
      } else {
        await api.post('/products', payload);
        showAlertMsg('New product added!');
      }
      setShowProductModal(false);
      loadProducts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      showAlertMsg('Product deleted');
      loadProducts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const bulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Delete ${selectedProducts.size} selected product${selectedProducts.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedProducts].map(id => api.delete(`/products/${id}`)));
      showAlertMsg(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} deleted`);
      setSelectedProducts(new Set());
      loadProducts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const printReceiptAsPDF = (txn) => {
    const customerName = txn.customer
      ? `${txn.customer.firstName} ${txn.customer.lastName}`
      : txn.customerName;
    const staffName = txn.staff ? `${txn.staff.firstName} ${txn.staff.lastName}` : '';
    const itemRows = txn.items.map(item => `
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #eee">${item.productName}${item.isTingi ? ' <span style="font-size:10px;color:#888">(tingi)</span>' : ''}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:right">${formatPeso(item.unitPrice)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${formatPeso(item.subtotal)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${txn.receiptNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;padding:20px;max-width:320px;margin:auto}.store-name{font-size:18px;font-weight:bold;text-align:center}.store-sub{font-size:11px;text-align:center;color:#555;margin-bottom:8px}.divider{border-top:1px dashed #999;margin:8px 0}.label{font-size:10px;color:#666}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}th{background:#f5f5f5;padding:4px 6px;text-align:left;font-size:10px}.total-row{font-size:14px;font-weight:bold;display:flex;justify-content:space-between;padding:6px 0}.summary-row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}.footer{text-align:center;font-size:10px;color:#888;margin-top:12px}@media print{body{padding:5px}}</style>
</head><body>
<div class="store-name">Lynx's Sari-sari Store</div>
<div class="store-sub">POS and Inventory System</div>
<div class="divider"></div>
<div><span class="label">Receipt #: </span><strong>${txn.receiptNumber}</strong></div>
<div><span class="label">Date: </span>${formatDateTime(txn.createdAt)}</div>
<div><span class="label">Customer: </span>${customerName}</div>
${staffName ? `<div><span class="label">Staff: </span>${staffName}</div>` : ''}
<div class="divider"></div>
<table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table>
<div class="divider"></div>
<div class="total-row"><span>TOTAL:</span><span>${formatPeso(txn.totalAmount)}</span></div>
<div class="summary-row"><span>Payment:</span><span>Cash</span></div>
${txn.cashReceived > 0 ? `<div class="summary-row"><span>Cash Received:</span><span>${formatPeso(txn.cashReceived)}</span></div><div class="summary-row"><span>Change:</span><span>${formatPeso(txn.changeAmount || 0)}</span></div>` : ''}
<div class="divider"></div>
<div class="footer">Thank you for your purchase!<br>— Lynx's Sari-sari Store —</div>
</body></html>`;
    const win = window.open('', '_blank', 'width=420,height=650');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const printActivityReceipt = async (activity) => {
    const match = (activity.details || '').match(/Receipt:\s*(\S+)/);
    if (!match) return;
    const receiptNum = match[1];
    try {
      const results = await api.get(`/transactions?receipt=${encodeURIComponent(receiptNum)}`);
      const txn = results.find(t => t.receiptNumber === receiptNum) || results[0];
      if (!txn) { alert('Transaction not found'); return; }
      printReceiptAsPDF(txn);
    } catch (e) { alert('Could not load transaction: ' + e.message); }
  };

  const openStockModal = (product) => {
    setStockProduct(product);
    setStockAdjust({ adjustment: 0, reason: '' });
    setShowStockModal(true);
  };

  const adjustStock = async () => {
    try {
      await api.put(`/products/${stockProduct._id}/adjust-stock`, stockAdjust);
      showAlertMsg('Stock adjusted!');
      setShowStockModal(false);
      loadProducts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  // Category CRUD
  const saveCategory = async () => {
    try {
      await api.post('/categories', categoryForm);
      showAlertMsg('Category added!');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', icon: '📦' });
      loadCategories();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      showAlertMsg('Category deleted');
      loadCategories();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  // Users
  const approveStaff = async (id) => {
    try {
      await api.put(`/users/${id}/approve`);
      showAlertMsg('Staff account approved!');
      loadPendingStaff();
      loadUsers();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const rejectStaff = async (id) => {
    if (!confirm('Reject and delete this staff account?')) return;
    try {
      await api.delete(`/users/${id}/reject`);
      showAlertMsg('Account rejected.');
      loadPendingStaff();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const createStaff = async () => {
    try {
      await api.post('/users/create-staff', userForm);
      showAlertMsg('Staff account created!');
      setShowUserModal(false);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', phone: '' });
      loadUsers();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      showAlertMsg('User deleted');
      loadUsers();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  if (!user) return null;

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard', keywords: ['overview', 'stats', 'summary', 'home'] },
    { key: 'inventory', label: '📦 Products', keywords: ['products', 'stock', 'items', 'inventory', 'barcode', 'price'] },
    { key: 'categories', label: '🏷️ Categories', keywords: ['category', 'tags', 'group'] },
    { key: 'sales', label: '💰 Sales', keywords: ['transactions', 'receipts', 'orders', 'revenue'] },
    { key: 'reports', label: '📈 Reports', keywords: ['analytics', 'charts', 'performance', 'best sellers'] },
    { key: 'users', label: '👥 Users', keywords: ['staff', 'accounts', 'manage', 'approve', 'register'] },
    { key: 'activity', label: '📝 Activity', keywords: ['logs', 'history', 'audit', 'actions'] },
  ];

  const filteredTabs = featureSearch.trim()
    ? tabs.filter(tab => {
        const q = featureSearch.toLowerCase();
        return tab.label.toLowerCase().includes(q) || tab.keywords.some(k => k.includes(q));
      })
    : tabs;

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <div className="w-1/4 md:w-56 bg-base-100 shadow-xl flex flex-col min-h-screen print:hidden overflow-hidden">
        <div className="p-2 md:p-4 border-b border-base-300">
          <h2 className="font-bold text-sm md:text-xl truncate">🏪 Lynx Store</h2>
          <p className="text-[10px] md:text-sm opacity-60">Admin Panel</p>
          <p className="text-[10px] md:text-sm opacity-50 mt-0.5 tabular-nums">{now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-xs md:text-base font-mono font-bold tabular-nums">{now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        </div>
        <nav className="flex-1 p-1 md:p-2">
          <div className="mb-2 px-1">
            <input
              type="text"
              placeholder="🔍 Search features..."
              value={featureSearch}
              onChange={e => setFeatureSearch(e.target.value)}
              className="input input-bordered w-full h-7 md:h-9 text-[10px] md:text-sm px-2"
            />
          </div>
          {filteredTabs.length > 0 ? filteredTabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setFeatureSearch(''); }}
              className={`w-full text-left px-2 md:px-3 py-2 md:py-2.5 rounded-lg mb-1 text-[10px] md:text-sm transition-all ${activeTab === tab.key ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}>
              <span className="md:inline">{tab.label}</span>
            </button>
          )) : (
            <p className="text-[10px] md:text-xs opacity-50 text-center py-3">No match found</p>
          )}
        </nav>
        <div className="p-2 md:p-4 border-t border-base-300 overflow-hidden">
          <p className="text-[10px] md:text-sm font-medium truncate">{user.firstName}</p>
          <p className="text-[9px] md:text-xs opacity-60 mb-2">Admin</p>
          <div className="flex flex-col md:flex-row gap-1 mb-1">
            <button onClick={handleLogout} className="btn btn-[10px] md:btn-sm btn-ghost flex-1 py-1 h-auto min-h-0">Logout</button>
            <ThemeToggle className="scale-75 md:scale-100" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-h-screen">
        {lowStockProducts.length > 0 && !dismissLowStock && (
          <div className="alert alert-warning mb-4 shadow-lg flex items-start gap-3 print:hidden">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-sm">Low Stock Alert — {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking</div>
              <div className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {lowStockProducts.slice(0, 6).map(p => (
                  <span key={p._id} className="font-medium">
                    {p.name} <span className="opacity-70">({Math.floor(p.stock)} {p.unit} left)</span>
                  </span>
                ))}
                {lowStockProducts.length > 6 && <span className="opacity-70">+{lowStockProducts.length - 6} more</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setActiveTab('inventory'); setDismissLowStock(true); }} className="btn btn-xs btn-warning btn-outline">View Inventory</button>
              <button onClick={() => setDismissLowStock(true)} className="btn btn-xs btn-ghost">✕</button>
            </div>
          </div>
        )}

        {nearExpiryProducts.length > 0 && !dismissNearExpiry && (
          <div className="alert alert-error mb-4 shadow-lg flex items-start gap-3 print:hidden">
            <span className="text-2xl">🕒</span>
            <div className="flex-1">
              <div className="font-bold text-sm">Expiry Alert — {nearExpiryProducts.length} product{nearExpiryProducts.length > 1 ? 's' : ''} expiring within 30 days</div>
              <div className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {nearExpiryProducts.slice(0, 6).map(p => (
                  <span key={p._id} className="font-medium">
                    {p.name} <span className="opacity-70">({p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : ''})</span>
                  </span>
                ))}
                {nearExpiryProducts.length > 6 && <span className="opacity-70">+{nearExpiryProducts.length - 6} more</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setActiveTab('inventory'); setDismissNearExpiry(true); }} className="btn btn-xs btn-error btn-outline">View Inventory</button>
              <button onClick={() => setDismissNearExpiry(true)} className="btn btn-xs btn-ghost">✕</button>
            </div>
          </div>
        )}

        {alert && (
          <div className={`alert ${alert.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 shadow-lg`}>
            <span>{alert.msg}</span>
          </div>
        )}

        {activeTab === 'dashboard' && dashboardStats && (
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6">
              <div className="stat bg-base-100 rounded-xl shadow p-2 md:p-4">
                <div className="stat-title text-[10px] md:text-sm">Today's Sales</div>
                <div className="stat-value text-primary text-base md:text-2xl">{formatPeso(dashboardStats.today.revenue)}</div>
                <div className="stat-desc text-[9px] md:text-xs">{dashboardStats.today.totalSales} transactions</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow p-2 md:p-4">
                <div className="stat-title text-[10px] md:text-sm">Products</div>
                <div className="stat-value text-base md:text-2xl">{dashboardStats.inventory.totalProducts}</div>
                <div className="stat-desc text-[9px] md:text-xs">{dashboardStats.inventory.lowStockCount} low stock</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow p-2 md:p-4">
                <div className="stat-title text-[10px] md:text-sm">Customers</div>
                <div className="stat-value text-base md:text-2xl">{dashboardStats.customers.total}</div>
                <div className="stat-desc text-[9px] md:text-xs">Registered customers</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {dashboardStats.today.cashSales > 0 ? (
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-3 md:p-6">
                    <h3 className="card-title text-sm md:text-lg">💵 Today's Sales Breakdown</h3>
                    <div className="space-y-1 md:space-y-2 text-xs md:text-base">
                      <div className="flex justify-between"><span>Cash:</span><span className="font-bold text-success">{formatPeso(dashboardStats.today.cashSales)}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card bg-base-100 shadow">
                  <div className="card-body items-center text-center p-3 md:p-6">
                    <h3 className="text-sm md:text-lg">💵 Today's Sales</h3>
                    <p className="opacity-60 text-xs md:text-sm">No sales yet today</p>
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow">
                <div className="card-body p-3 md:p-6">
                  <h3 className="card-title text-sm md:text-lg">⚠️ Alerts</h3>
                  <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                    {dashboardStats.inventory.lowStockCount > 0 && (
                      <div className="flex items-center gap-2 text-warning">
                        <span>📦</span> <span>{dashboardStats.inventory.lowStockCount} products with low stock</span>
                      </div>
                    )}
                    {dashboardStats.inventory.nearExpiryCount > 0 && (
                      <div className="flex items-center gap-2 text-error">
                        <span>⏰</span> <span>{dashboardStats.inventory.nearExpiryCount} products near expiry</span>
                      </div>
                    )}
                    {dashboardStats.inventory.lowStockCount === 0 && dashboardStats.inventory.nearExpiryCount === 0 && (
                      <p className="opacity-60 text-xs md:text-sm">No alerts today! 🎉</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">📦 Products</h1>
              <button onClick={() => openProductModal()} className="btn btn-primary btn-sm">+ Add Product</button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <input type="text" placeholder="🔍 Search products..." value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="input input-bordered input-sm w-64" />
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="select select-bordered select-sm">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
              <button onClick={loadProducts} className="btn btn-ghost btn-sm">🔄 Refresh</button>
            </div>

            {/* Bulk action toolbar */}
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-base-100 rounded-lg shadow border border-base-300">
                <span className="text-sm font-medium">{selectedProducts.size} selected</span>
                <button onClick={bulkDeleteProducts} className="btn btn-sm btn-error">🗑️ Delete Selected</button>
                <button onClick={() => setSelectedProducts(new Set())} className="btn btn-sm btn-ghost">✕ Clear</button>
              </div>
            )}

            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" className="checkbox checkbox-sm"
                        checked={products.length > 0 && selectedProducts.size === products.length}
                        onChange={e => setSelectedProducts(e.target.checked ? new Set(products.map(p => p._id)) : new Set())}
                      />
                    </th>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Tingi</th>
                    <th>Stock</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} className={`${p.isLowStock ? 'bg-warning/10' : ''} ${selectedProducts.has(p._id) ? 'bg-primary/5' : ''}`}>
                      <td>
                        <input type="checkbox" className="checkbox checkbox-sm"
                          checked={selectedProducts.has(p._id)}
                          onChange={e => {
                            const next = new Set(selectedProducts);
                            e.target.checked ? next.add(p._id) : next.delete(p._id);
                            setSelectedProducts(next);
                          }}
                        />
                      </td>
                      <td>
                        <div className="font-semibold">{p.name}</div>
                        {p.brand && <div className="text-xs opacity-60">{p.brand}</div>}
                      </td>
                      <td className="text-xs">{p.barcode || '-'}</td>
                      <td>{p.category?.icon} {p.category?.name}</td>
                      <td>{formatPeso(p.unitPrice)}</td>
                      <td>{p.tingiPrice > 0 ? `${formatPeso(p.tingiPrice)}/${p.tingiUnit}` : '-'}</td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className={`badge ${p.isLowStock ? 'badge-warning' : 'badge-success'} badge-sm`}>
                            {Math.floor(p.stock)} pack{Math.floor(p.stock) !== 1 ? 's' : ''}
                          </span>
                          {p.tingiPerPack > 1 && (
                            <span className="text-xs opacity-55">{Math.floor(p.stock * p.tingiPerPack)} pcs</span>
                          )}
                        </div>
                      </td>
                      <td className={p.isExpired ? 'text-error font-bold' : p.isNearExpiry ? 'text-warning' : ''}>
                        {p.expiryDate ? formatDate(p.expiryDate) : '-'}
                        {p.isExpired && ' ❌'}
                        {p.isNearExpiry && !p.isExpired && ' ⚠️'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openStockModal(p)} className="btn btn-xs btn-info">Stock</button>
                          <button onClick={() => openProductModal(p)} className="btn btn-xs btn-ghost">✏️</button>
                          <button onClick={() => deleteProduct(p._id)} className="btn btn-xs btn-ghost text-error">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="9" className="text-center py-8 opacity-60">No products yet. Add one!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">🏷️ Categories</h1>
              <button onClick={() => setShowCategoryModal(true)} className="btn btn-primary btn-sm">+ Add Category</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(c => (
                <div key={c._id} className="card bg-base-100 shadow">
                  <div className="card-body items-center text-center p-4">
                    <span className="text-4xl">{c.icon}</span>
                    <h3 className="font-bold">{c.name}</h3>
                    {c.description && <p className="text-xs opacity-60">{c.description}</p>}
                    <button onClick={() => deleteCategory(c._id)} className="btn btn-xs btn-ghost text-error mt-2">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-8 pb-4 border-b-2 border-gray-300">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Lynx's Sari-sari Store</h1>
                <h2 className="text-xl mb-1">Sales Analytics Report</h2>
                <p className="text-sm opacity-70">
                  Period: {salesCustomMonth
                    ? new Date(salesCustomMonth + '-01').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
                    : salesPeriod === 'week' ? 'Last 7 Days' : salesPeriod === 'month' ? 'Last 30 Days' : 'Last 365 Days'}
                </p>
                <p className="text-sm opacity-70">Generated on: {formatDateTime(new Date())}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 print:hidden">
              <h1 className="text-2xl font-bold">💰 Sales Analytics & Summary</h1>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm gap-2">
                🖨️ Print / Export PDF
              </button>
            </div>

            {/* Period Filter */}
            <div className="flex flex-wrap gap-2 mb-3 print:hidden items-center">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => { setSalesPeriod(p); setSalesCustomMonth(''); }}
                  className={`btn btn-sm ${!salesCustomMonth && salesPeriod === p ? 'btn-primary' : 'btn-ghost'}`}>
                  {p === 'week' ? '📅 This Week' : p === 'month' ? '📆 This Month' : '📊 This Year'}
                </button>
              ))}
              <div className="divider divider-horizontal mx-0 hidden sm:flex"></div>
              <label className="text-sm opacity-60 font-medium">Browse Month:</label>
              <input
                type="month"
                value={salesCustomMonth}
                max={new Date().toISOString().slice(0, 7)}
                onChange={e => { setSalesCustomMonth(e.target.value); setSalesPeriod(''); }}
                className={`input input-bordered input-sm w-40 ${salesCustomMonth ? 'border-primary' : ''}`}
              />
              {salesCustomMonth && (
                <button onClick={() => { setSalesCustomMonth(''); setSalesPeriod('week'); }}
                  className="btn btn-sm btn-ghost text-error">✕ Clear</button>
              )}
            </div>

            {/* Staff & Product Filters */}
            <div className="flex flex-wrap gap-2 mb-6 print:hidden">
              <select value={salesStaffFilter} onChange={e => setSalesStaffFilter(e.target.value)}
                className="select select-bordered select-sm">
                <option value="">👤 All Staff</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
              <input type="text" placeholder="🔍 Filter by product name..."
                value={salesProductFilter} onChange={e => setSalesProductFilter(e.target.value)}
                className="input input-bordered input-sm w-52" />
              {(salesStaffFilter || salesProductFilter) && (
                <button onClick={() => { setSalesStaffFilter(''); setSalesProductFilter(''); }}
                  className="btn btn-sm btn-ghost text-error">✕ Clear Filters</button>
              )}
            </div>

            {/* Loading State */}
            {!salesAnalytics && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4 opacity-60">Loading sales analytics...</p>
                </div>
              </div>
            )}

            {/* Sales Summary Cards */}
            {salesAnalytics && (
              <div className="mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:gap-2">
                  <div className="card bg-gradient-to-br from-primary to-primary/70 text-primary-content shadow-lg print:bg-none print:bg-white print:text-black print:shadow-none print:border print:border-base-300">
                    <div className="card-body p-4 lg:p-6 print:p-2">
                      <div className="text-sm opacity-90 font-medium">Total Revenue</div>
                      <div className="text-2xl lg:text-3xl font-bold">{formatPeso(salesAnalytics.totalRevenue)}</div>
                      <div className="text-xs opacity-75">{salesAnalytics.totalTransactions} transactions</div>
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-success to-success/70 text-success-content shadow-lg print:bg-none print:bg-white print:text-black print:shadow-none print:border print:border-base-300">
                    <div className="card-body p-4 lg:p-6 print:p-2">
                      <div className="text-sm opacity-90 font-medium">Cash Sales</div>
                      <div className="text-2xl lg:text-3xl font-bold">{formatPeso(salesAnalytics.cashTotal)}</div>
                      <div className="text-xs opacity-75">{salesAnalytics.cashCount} cash transactions</div>
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-info to-info/70 text-info-content shadow-lg print:bg-none print:bg-white print:text-black print:shadow-none print:border print:border-base-300">
                    <div className="card-body p-4 lg:p-6 print:p-2">
                      <div className="text-sm opacity-90 font-medium">Average Sale</div>
                      <div className="text-2xl lg:text-3xl font-bold">{formatPeso(salesAnalytics.averageTransaction)}</div>
                      <div className="text-xs opacity-75">per transaction</div>
                    </div>
                  </div>
                </div>

                {/* Print Only Summary Table */}
                <div className="hidden print:block mb-6">
                  <h3 className="text-lg font-bold mb-2 border-l-4 border-primary pl-2 uppercase tracking-wider text-sm opacity-70">Summary Breakdown</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="table table-compact w-full border-collapse">
                      <thead>
                        <tr className="bg-base-200">
                          <th className="border">Metric</th>
                          <th className="border">Value</th>
                          <th className="border">Count / Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border font-medium">Total Revenue</td>
                          <td className="border font-bold text-primary">{formatPeso(salesAnalytics.totalRevenue)}</td>
                          <td className="border">{salesAnalytics.totalTransactions} Transactions</td>
                        </tr>
                        <tr>
                          <td className="border font-medium">Cash Sales</td>
                          <td className="border">{formatPeso(salesAnalytics.cashTotal)}</td>
                          <td className="border">{salesAnalytics.cashCount} Transactions</td>
                        </tr>
                        <tr>
                          <td className="border font-medium">Average Sale</td>
                          <td className="border">{formatPeso(salesAnalytics.averageTransaction)}</td>
                          <td className="border">per transaction</td>
                        </tr>
                        <tr>
                          <td className="border font-medium">Total Items Sold</td>
                          <td className="border">{salesAnalytics.totalItems || 0}</td>
                          <td className="border">units</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:hidden">
                  <div className="card bg-base-100 shadow print:shadow-none print:border print:border-base-200">
                    <div className="card-body p-5 print:p-3">
                      <h3 className="card-title text-lg print:text-sm">💵 Payment Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 md:p-3 bg-success/10 rounded-lg">
                          <span className="font-medium text-xs md:text-base">💵 Cash</span>
                          <div className="text-right">
                            <div className="font-bold text-sm md:text-lg">{formatPeso(salesAnalytics.cashTotal)}</div>
                            <div className="text-[10px] md:text-xs opacity-60">{salesAnalytics.cashCount} txns</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow">
                    <div className="card-body">
                      <h3 className="card-title text-lg">📊 Sales Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between p-2 border-b border-base-300">
                          <span>Total Transactions:</span>
                          <span className="font-bold">{salesAnalytics.totalTransactions}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b border-base-300">
                          <span>Average per Transaction:</span>
                          <span className="font-bold">{formatPeso(salesAnalytics.averageTransaction)}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b border-base-300">
                          <span>Total Items Sold:</span>
                          <span className="font-bold">{salesAnalytics.totalItems || 0}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b border-base-300">
                          <span>Period:</span>
                          <span className="font-bold capitalize">{salesPeriod === 'week' ? 'This Week' : salesPeriod === 'month' ? 'This Month' : 'This Year'}</span>
                        </div>
                        <div className="flex justify-between p-2">
                          <span>Report Date:</span>
                          <span className="font-bold">{formatDate(new Date())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Trend Line Graph */}
                {salesAnalytics.dailyBreakdown && salesAnalytics.dailyBreakdown.length > 0 ? (
                  <div className="card bg-base-100 shadow mb-6 print:hidden">
                    <div className="card-body">
                      <h3 className="card-title text-lg mb-4">📈 Sales Trend Over Time</h3>
                      <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={salesAnalytics.dailyBreakdown}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(date) => {
                                const d = new Date(date);
                                if (salesPeriod === 'week') {
                                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                } else if (salesPeriod === 'month') {
                                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                } else {
                                  return d.toLocaleDateString('en-US', { month: 'short' });
                                }
                              }}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                              formatter={(value, name) => {
                                if (name === 'revenue') return [formatPeso(value), 'Revenue'];
                                return [value, 'Transactions'];
                              }}
                              labelFormatter={(label) => formatDate(label)}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => value === 'revenue' ? 'Revenue (₱)' : 'Transactions'}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ fill: '#10b981', r: 4 }}
                              activeDot={{ r: 6 }}
                              name="revenue"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', r: 3 }}
                              activeDot={{ r: 5 }}
                              name="count"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Trend Summary */}
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center print:border print:border-base-200 print:rounded-lg print:p-2">
                        <div className="p-3 bg-success/10 rounded-lg print:bg-none">
                          <div className="text-xs opacity-60 uppercase font-bold">Highest Daily Sales</div>
                          <div className="font-bold text-lg text-success print:text-black">
                            {formatPeso(Math.max(...salesAnalytics.dailyBreakdown.map(d => d.revenue)))}
                          </div>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-lg print:bg-none">
                          <div className="text-xs opacity-60 uppercase font-bold">Average Daily Sales</div>
                          <div className="font-bold text-lg text-warning print:text-black">
                            {formatPeso(salesAnalytics.dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0) / salesAnalytics.dailyBreakdown.length)}
                          </div>
                        </div>
                        <div className="p-3 bg-info/10 rounded-lg print:bg-none">
                          <div className="text-xs opacity-60 uppercase font-bold">Total Days Tracked</div>
                          <div className="font-bold text-lg text-info print:text-black">
                            {salesAnalytics.dailyBreakdown.length}
                          </div>
                        </div>
                      </div>

                      {/* Print-only Daily Breakdown Data Table */}
                      <div className="hidden print:block mt-8">
                        <h4 className="font-bold mb-3 border-b pb-1 text-sm uppercase opacity-70">Daily Breakdown Data</h4>
                        <div className="overflow-x-auto">
                          <table className="table table-compact w-full text-xs">
                            <thead>
                              <tr className="bg-base-200">
                                <th className="border">Date</th>
                                <th className="border">Revenue</th>
                                <th className="border">Transaction Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesAnalytics.dailyBreakdown.map(day => (
                                <tr key={day.date}>
                                  <td className="border">{formatDate(day.date)}</td>
                                  <td className="border font-medium">{formatPeso(day.revenue)}</td>
                                  <td className="border">{day.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : salesAnalytics && (
                  <div className="card bg-base-100 shadow mb-6 print:hidden">
                    <div className="card-body">
                      <h3 className="card-title text-lg mb-4">📈 Sales Trend Over Time</h3>
                      <div className="text-center py-12 opacity-60">
                        <div className="text-5xl mb-3">📊</div>
                        <p>No sales data available for the selected period</p>
                        <p className="text-sm mt-2">Try selecting a different time frame</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Time of Day Analysis */}
            {salesAnalytics?.timeOfDay && (
              <div className="card bg-base-100 shadow mb-6 print:hidden">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">🕐 Top Selling Time of Day</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {salesAnalytics.timeOfDay.map(t => {
                      const maxRev = Math.max(...salesAnalytics.timeOfDay.map(x => x.revenue));
                      const isBest = t.revenue === maxRev && maxRev > 0;
                      return (
                        <div key={t.label} className={`p-4 rounded-xl text-center border-2 transition-all ${isBest ? 'border-warning bg-warning/10' : 'border-base-300 bg-base-200'}`}>
                          <div className="text-3xl mb-1">{t.label.split(' ')[0]}</div>
                          <div className="font-bold text-sm">{t.label.replace(/^[\S]+ /, '')}</div>
                          <div className="text-xs opacity-60 mb-2">{t.range}</div>
                          <div className="font-bold text-lg text-primary">{formatPeso(t.revenue)}</div>
                          <div className="text-xs opacity-60">{t.count} sales</div>
                          {isBest && t.revenue > 0 && <div className="badge badge-warning badge-sm mt-1">🏆 Peak</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesAnalytics.timeOfDay} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v, n) => n === 'revenue' ? [formatPeso(v), 'Revenue'] : [v, 'Sales']} />
                        <Bar dataKey="revenue" fill="#f59e0b" name="revenue" radius={[4,4,0,0]} />
                        <Bar dataKey="count" fill="#3b82f6" name="count" radius={[4,4,0,0]} />
                        <Legend formatter={v => v === 'revenue' ? 'Revenue (₱)' : 'Transactions'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Sales Table */}
            <div className="card bg-base-100 shadow mb-6 print:hidden">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title">📅 Transactions by Date</h3>
                  <div className="flex gap-2 print:hidden flex-wrap justify-end">
                    <input type="text" placeholder="🔍 Search receipt #..." value={salesReceiptSearch}
                      onChange={e => { setSalesReceiptSearch(e.target.value); }}
                      className="input input-bordered input-sm w-48" />
                    {!salesReceiptSearch && (
                      <input type="date" value={salesDateFilter} onChange={e => setSalesDateFilter(e.target.value)}
                        className="input input-bordered input-sm" />
                    )}
                    <button onClick={loadTransactions} className="btn btn-ghost btn-sm">🔄</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Staff</th>
                        <th>Date/Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t._id} className="cursor-pointer hover:bg-base-200 print:hover:bg-transparent"
                            onClick={() => { setSelectedTransaction(t); setShowTransactionModal(true); }}>
                          <td className="font-mono text-xs print:text-[10px]">{t.receiptNumber}</td>
                          <td className="print:text-xs">{t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : t.customerName}</td>
                          <td className="text-xs print:text-[10px]">{t.items.length} item(s)</td>
                          <td className="font-bold print:text-sm">{formatPeso(t.totalAmount)}</td>
                          <td>
                            <span className="badge badge-sm badge-success print:badge-outline print:text-black print:border-gray-300">
                              💵 Cash
                            </span>
                          </td>
                          <td className="text-xs">{t.staff?.firstName}</td>
                          <td className="text-xs print:text-[10px]">{formatDateTime(t.createdAt)}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-8 opacity-60">No sales on this date</td></tr>
                      )}
                    </tbody>
                    {transactions.length > 0 && (
                      <tfoot>
                        <tr className="font-bold">
                          <td colSpan="3">Total for {formatDate(salesDateFilter)}:</td>
                          <td className="text-lg">{formatPeso(transactions.reduce((sum, t) => sum + t.totalAmount, 0))}</td>
                          <td colSpan="3">{transactions.length} transaction(s)</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-12 pb-8">
              <div className="grid grid-cols-2 gap-12">
                <div className="text-center pt-8 border-t border-gray-300">
                  <div className="font-bold underline">__________________________</div>
                  <div className="text-sm mt-1">Prepared By</div>
                  <div className="text-xs opacity-60">Staff Signature over Printed Name</div>
                </div>
                <div className="text-center pt-8 border-t border-gray-300">
                  <div className="font-bold underline">__________________________</div>
                  <div className="text-sm mt-1">Approved By</div>
                  <div className="text-xs opacity-60">Admin / Manager Signature</div>
                </div>
              </div>
              <div className="text-center mt-12 text-xs opacity-40">
                <p>Lynx Sari-sari Store Management System</p>
                <p>This report is computer-generated and serves as an official record of sales for the specified period.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div id="bi-report-root">
            {/* Print-only header */}
            <div className="hidden print:block mb-6 text-center">
              <h1 className="text-3xl font-bold">Lynx Store — Business Intelligence Report</h1>
              <p className="text-sm opacity-70">Period: {reportPeriod === 'week' ? 'This Week' : 'This Month'} &nbsp;|&nbsp; Printed: {new Date().toLocaleString()}</p>
              <hr className="my-2" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
              <h1 className="text-2xl font-bold">📈 Business Intelligence</h1>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {['week', 'month'].map(p => (
                    <button key={p} onClick={() => setReportPeriod(p)}
                      className={`btn btn-sm ${reportPeriod === p ? 'btn-primary' : 'btn-ghost'}`}>
                      {p === 'week' ? 'This Week' : 'This Month'}
                    </button>
                  ))}
                </div>
                <button onClick={() => window.print()}
                  className="btn btn-sm btn-outline gap-1">
                  🖨️ Print / Export PDF
                </button>
              </div>
            </div>

            {/* ── Monthly Comparison ── */}
            {monthlyComparison && (
              <section className="mb-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">📅 Monthly Comparison
                  <span className="badge badge-outline text-xs font-normal">This Month vs Last Month</span>
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Revenue', thisVal: formatPeso(monthlyComparison.thisMonth?.revenue ?? 0), lastVal: formatPeso(monthlyComparison.lastMonth?.revenue ?? 0), change: monthlyComparison.changes?.revenue, icon: '💰' },
                    { label: 'Orders', thisVal: monthlyComparison.thisMonth?.orders ?? 0, lastVal: monthlyComparison.lastMonth?.orders ?? 0, change: monthlyComparison.changes?.orders, icon: '🧾' },
                    { label: 'Avg Order', thisVal: formatPeso(monthlyComparison.thisMonth?.avgOrder ?? 0), lastVal: formatPeso(monthlyComparison.lastMonth?.avgOrder ?? 0), change: monthlyComparison.changes?.avgOrder, icon: '📊' },
                    { label: 'Items Sold', thisVal: monthlyComparison.thisMonth?.items ?? 0, lastVal: monthlyComparison.lastMonth?.items ?? 0, change: monthlyComparison.changes?.items, icon: '📦' },
                  ].map(({ label, thisVal, lastVal, change, icon }) => {
                    const isUp = change && !change.startsWith('-') && change !== '0%';
                    const isDown = change && change.startsWith('-');
                    return (
                      <div key={label} className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-60 uppercase tracking-wide">{icon} {label}</span>
                            {change && (
                              <span className={`badge badge-sm ${isUp ? 'badge-success' : isDown ? 'badge-error' : 'badge-ghost'}`}>
                                {isUp ? '▲' : isDown ? '▼' : '—'} {change}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-bold">{thisVal}</div>
                          <div className="text-xs opacity-50">Last month: {lastVal}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Inventory Report ── */}
            {inventoryReport && (
              <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">🗄️ Inventory Report</h2>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  {[
                    { label: 'Total Products', val: inventoryReport.summary?.totalProducts ?? 0, cls: 'text-base-content' },
                    { label: 'Out of Stock', val: inventoryReport.summary?.outOfStock ?? 0, cls: 'text-error' },
                    { label: 'Low Stock (≤5)', val: inventoryReport.summary?.lowStock ?? 0, cls: 'text-warning' },
                    { label: 'Near Expiry', val: inventoryReport.summary?.nearExpiry ?? 0, cls: 'text-warning' },
                    { label: 'Expired', val: inventoryReport.summary?.expired ?? 0, cls: 'text-error' },
                    { label: 'Inventory Value', val: formatPeso(inventoryReport.summary?.inventoryValue ?? 0), cls: 'text-success' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="card bg-base-100 shadow-sm border border-base-200">
                      <div className="card-body p-3 text-center">
                        <div className={`text-xl font-bold ${cls}`}>{val}</div>
                        <div className="text-xs opacity-60">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Out of Stock */}
                {inventoryReport.outOfStock?.length > 0 && (
                  <div className="card bg-base-100 shadow-sm mb-3">
                    <div className="card-body p-4">
                      <h3 className="font-semibold text-error mb-2">🚫 Out of Stock ({inventoryReport.outOfStock.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead><tr><th>Product</th><th>Category</th><th>Price</th></tr></thead>
                          <tbody>
                            {inventoryReport.outOfStock.map((p, i) => (
                              <tr key={i} className="hover">
                                <td className="font-medium">{p.name}</td>
                                <td className="opacity-70">{p.category}</td>
                                <td>{formatPeso(p.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {inventoryReport.lowStock?.length > 0 && (
                  <div className="card bg-base-100 shadow-sm mb-3">
                    <div className="card-body p-4">
                      <h3 className="font-semibold text-warning mb-2">⚠️ Low Stock ({inventoryReport.lowStock.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th></tr></thead>
                          <tbody>
                            {inventoryReport.lowStock.map((p, i) => (
                              <tr key={i} className="hover">
                                <td className="font-medium">{p.name}</td>
                                <td className="opacity-70">{p.category}</td>
                                <td><span className="badge badge-warning badge-sm">{Math.floor(p.stock)}</span></td>
                                <td>{formatPeso(p.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Near Expiry */}
                {inventoryReport.nearExpiry?.length > 0 && (
                  <div className="card bg-base-100 shadow-sm mb-3">
                    <div className="card-body p-4">
                      <h3 className="font-semibold text-warning mb-2">🕒 Near Expiry — within 30 days ({inventoryReport.nearExpiry.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Expiry Date</th></tr></thead>
                          <tbody>
                            {inventoryReport.nearExpiry.map((p, i) => (
                              <tr key={i} className="hover">
                                <td className="font-medium">{p.name}</td>
                                <td className="opacity-70">{p.category}</td>
                                <td>{Math.floor(p.stock)}</td>
                                <td className="text-warning">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expired */}
                {inventoryReport.expired?.length > 0 && (
                  <div className="card bg-base-100 shadow-sm mb-3">
                    <div className="card-body p-4">
                      <h3 className="font-semibold text-error mb-2">❌ Expired Products ({inventoryReport.expired.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Expiry Date</th></tr></thead>
                          <tbody>
                            {inventoryReport.expired.map((p, i) => (
                              <tr key={i} className="hover">
                                <td className="font-medium">{p.name}</td>
                                <td className="opacity-70">{p.category}</td>
                                <td>{Math.floor(p.stock)}</td>
                                <td className="text-error">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Staff Performance ── */}
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-3">👨‍💼 Staff Performance
                <span className="text-sm font-normal opacity-60 ml-2">({reportPeriod === 'week' ? 'This Week' : 'This Month'})</span>
              </h2>
              {staffPerformance.length > 0 ? (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Staff Name</th>
                            <th>Transactions</th>
                            <th>Items Sold</th>
                            <th>Revenue</th>
                            <th>Avg per Txn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffPerformance.map((s, i) => (
                            <tr key={i} className="hover">
                              <td className="opacity-50">{i + 1}</td>
                              <td className="font-medium">{s.name}</td>
                              <td>{s.transactions}</td>
                              <td>{s.items}</td>
                              <td className="font-bold text-success">{formatPeso(s.revenue)}</td>
                              <td className="opacity-70">{s.transactions > 0 ? formatPeso(s.revenue / s.transactions) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-6 text-center opacity-50">No staff performance data for this period.</div>
                </div>
              )}
            </section>

            {/* ── Best Sellers ── */}
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-3">🏆 Best Sellers
                <span className="text-sm font-normal opacity-60 ml-2">({reportPeriod === 'week' ? 'This Week' : 'This Month'})</span>
              </h2>
              {bestSellers.length > 0 ? (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th className="text-center">Qty Sold</th>
                            <th className="text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestSellers.slice(0, 15).map((bs, i) => (
                            <tr key={i} className="hover">
                              <td>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="opacity-40">{i + 1}</span>}
                              </td>
                              <td className="font-medium">{bs.name}</td>
                              <td className="opacity-60 text-xs">{bs.category ?? '—'}</td>
                              <td className="text-center">
                                <span className="badge badge-outline badge-sm">{bs.totalQuantity}</span>
                              </td>
                              <td className="text-right font-bold text-success">{formatPeso(bs.totalRevenue ?? 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-6 text-center opacity-50">No sales data for this period.</div>
                </div>
              )}
            </section>

            {/* Print footer */}
            <div className="hidden print:block mt-10 pt-4 border-t text-sm opacity-60">
              <div className="grid grid-cols-3 gap-8 mt-6">
                <div className="text-center"><div className="border-t border-black pt-1 mt-8">Prepared by</div></div>
                <div className="text-center"><div className="border-t border-black pt-1 mt-8">Reviewed by</div></div>
                <div className="text-center"><div className="border-t border-black pt-1 mt-8">Approved by</div></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* Pending Approvals */}
            {pendingStaff.length > 0 && (
              <div className="alert alert-warning mb-6 flex flex-col items-start gap-3">
                <div className="font-bold text-base">⏳ Pending Staff Approvals ({pendingStaff.length})</div>
                <div className="w-full space-y-2">
                  {pendingStaff.map(u => (
                    <div key={u._id} className="flex items-center justify-between bg-base-100 rounded-lg px-4 py-2">
                      <div>
                        <div className="font-semibold">{u.firstName} {u.lastName}</div>
                        <div className="text-xs opacity-60">{u.email} · {formatDate(u.createdAt)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveStaff(u._id)} className="btn btn-success btn-xs">✓ Approve</button>
                        <button onClick={() => rejectStaff(u._id)} className="btn btn-error btn-xs">✕ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">👥 Users</h1>
              <button onClick={() => setShowUserModal(true)} className="btn btn-primary btn-sm">+ Add Staff</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="🔍 Search name or email..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} className="input input-bordered input-sm w-64" />
            </div>
            <div className="flex gap-2 mb-4">
              {['', 'admin', 'staff'].map(r => (
                <button key={r} onClick={() => setUserFilter(r)}
                  className={`btn btn-sm ${userFilter === r ? 'btn-primary' : 'btn-ghost'}`}>
                  {r === '' ? 'All' : r === 'admin' ? 'Admin' : 'Staff'}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-sm">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Registered</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="font-semibold">{u.firstName} {u.lastName}</td>
                      <td className="text-xs">{u.email}</td>
                      <td>
                        <span className={`badge badge-sm ${u.role === 'admin' ? 'badge-error' : 'badge-info'}`}>
                          {u.role}
                        </span>
                        {u.role === 'staff' && !u.isApproved && <span className="badge badge-warning badge-sm ml-1">pending</span>}
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td className="text-xs">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-1">
                          {u.role === 'staff' && !u.isApproved && (
                            <>
                              <button onClick={() => approveStaff(u._id)} className="btn btn-xs btn-success" title="Approve">✓ Approve</button>
                              <button onClick={() => rejectStaff(u._id)} className="btn btn-xs btn-error" title="Reject">✕ Reject</button>
                            </>
                          )}
                          {u._id !== user._id && (
                            <button onClick={() => deleteUser(u._id)} className="btn btn-xs btn-ghost text-error" title="Delete User">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-4">📝 Activity Log</h1>
            <div className="flex gap-1 md:gap-2 mb-4 flex-wrap">
              {['', 'sale', 'inventory', 'user'].map(c => (
                <button key={c} onClick={() => setActivityFilter(c)}
                  className={`btn btn-[10px] md:btn-sm ${activityFilter === c ? 'btn-primary' : 'btn-ghost'} h-auto py-1.5 min-h-0`}>
                  {c === '' ? 'All' : c === 'sale' ? '💰 Sales' : c === 'inventory' ? '📦 Inventory' : '👤 User'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {activityLogs.map(log => (
                <div key={log._id} 
                  onClick={() => { setSelectedActivity(log); setShowActivityModal(true); }}
                  className="card bg-base-100 shadow-sm p-2 md:p-3 flex flex-row items-center gap-2 md:gap-3 cursor-pointer hover:bg-base-200 transition-colors">
                  <span className="text-base md:text-xl shrink-0">
                    {log.category === 'sale' ? '💰' : log.category === 'inventory' ? '📦' : '👤'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs md:text-sm truncate">{log.action}</div>
                    <div className="text-[10px] md:text-xs opacity-60 truncate">{log.details}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] md:text-xs font-medium">{log.user?.firstName}</div>
                    <div className="text-[9px] md:text-xs opacity-50">{formatDateTime(log.createdAt).split(',')[1]}</div>
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && <p className="text-center opacity-60 py-8 text-xs">No activity logs</p>}
            </div>
          </div>
        )}

      </div>

      {showProductModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{editingProduct ? '✏️ Edit Product' : '➕ New Product'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Product Name *</span></label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                  className="input input-bordered input-sm" placeholder="e.g. Lucky Me Pancit Canton" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Barcode / SKU</span></label>
                <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                  className="input input-bordered input-sm" placeholder="Type manually" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category *</span></label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                  className="select select-bordered select-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Brand</span></label>
                <input type="text" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})}
                  className="input input-bordered input-sm" placeholder="e.g. Lucky Me" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Price (Full Pack) *</span></label>
                <input type="number" value={productForm.unitPrice} onChange={e => setProductForm({...productForm, unitPrice: e.target.value})}
                  className="input input-bordered input-sm" placeholder="₱0.00" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Cost Price</span></label>
                <input type="number" value={productForm.costPrice} onChange={e => setProductForm({...productForm, costPrice: e.target.value})}
                  className="input input-bordered input-sm" placeholder="₱0.00" />
              </div>
              <div className="divider col-span-2 my-1">Tingi (Per Piece)</div>
              <div className="form-control">
                <label className="label"><span className="label-text">Tingi Price</span></label>
                <input type="number" value={productForm.tingiPrice} onChange={e => setProductForm({...productForm, tingiPrice: e.target.value})}
                  className="input input-bordered input-sm" placeholder="₱0.00 per piece" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Pieces per pack</span></label>
                <input type="number" value={productForm.tingiPerPack} onChange={e => setProductForm({...productForm, tingiPerPack: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
              <div className="divider col-span-2 my-1">Stock Info</div>
              <div className="form-control">
                <label className="label"><span className="label-text">Current Stock *</span></label>
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Unit</span></label>
                <select value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})}
                  className="select select-bordered select-sm">
                  {['pcs', 'pack', 'box', 'sachet', 'bottle', 'kilo', 'liter', 'can', 'piece'].map(u =>
                    <option key={u} value={u}>{u}</option>
                  )}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Reorder Level (Low Stock Alert)</span></label>
                <input type="number" value={productForm.reorderLevel} onChange={e => setProductForm({...productForm, reorderLevel: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Expiry Date</span></label>
                <input type="date" value={productForm.expiryDate} onChange={e => setProductForm({...productForm, expiryDate: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowProductModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={saveProduct} className="btn btn-primary">
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && stockProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">📦 Adjust Stock: {stockProduct.name}</h3>
            <p className="mb-2">Current stock: <span className="font-bold">{stockProduct.stock} {stockProduct.unit}</span></p>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Adjustment (positive = add, negative = subtract)</span></label>
              <input type="number" value={stockAdjust.adjustment}
                onChange={e => setStockAdjust({...stockAdjust, adjustment: Number(e.target.value)})}
                className="input input-bordered" placeholder="e.g. 10 or -5" />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Reason</span></label>
              <select value={stockAdjust.reason} onChange={e => setStockAdjust({...stockAdjust, reason: e.target.value})}
                className="select select-bordered">
                <option value="">Select reason</option>
                <option value="Restock / New delivery">Restock / New delivery</option>
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
                <option value="Lost">Lost</option>
                <option value="Inventory count correction">Inventory count correction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <p className="text-sm">New stock: <span className="font-bold">{Math.max(0, stockProduct.stock + stockAdjust.adjustment)} {stockProduct.unit}</span></p>
            <div className="modal-action">
              <button onClick={() => setShowStockModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={adjustStock} className="btn btn-primary">Adjust Stock</button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">➕ New Category</h3>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Name</span></label>
              <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                className="input input-bordered" placeholder="e.g. Food, Drinks" />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Icon (Emoji)</span></label>
              <div className="flex gap-2 flex-wrap">
                {['🍫', '🥤', '🍞', '🧴', '🏠', '🍬', '🍜', '🥫', '🧊', '🫧', '💊', '📦', '🍚', '🥚', '🧹'].map(icon => (
                  <button key={icon} type="button" onClick={() => setCategoryForm({...categoryForm, icon})}
                    className={`btn btn-sm ${categoryForm.icon === icon ? 'btn-primary' : 'btn-ghost'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Description</span></label>
              <input type="text" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                className="input input-bordered" />
            </div>
            <div className="modal-action">
              <button onClick={() => setShowCategoryModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={saveCategory} className="btn btn-primary">Add</button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">👤 Create Staff Account</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">First Name</span></label>
                  <input type="text" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})}
                    className="input input-bordered input-sm" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Last Name</span></label>
                  <input type="text" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})}
                    className="input input-bordered input-sm" />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Password</span></label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                  className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Phone</span></label>
                <input type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}
                  className="input input-bordered input-sm" placeholder="09XXXXXXXXX" />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowUserModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={createStaff} className="btn btn-primary">Create Account</button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && selectedActivity && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>
                {selectedActivity.category === 'sale' ? '💰' : 
                 selectedActivity.category === 'inventory' ? '📦' : '👤'}
              </span>
              Activity Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase opacity-50 font-bold block">Action</span>
                <p className="font-semibold text-lg">{selectedActivity.action}</p>
              </div>

              <div>
                <span className="text-xs uppercase opacity-50 font-bold block">Category</span>
                <span className="badge badge-outline capitalize">{selectedActivity.category}</span>
              </div>

              <div>
                <span className="text-xs uppercase opacity-50 font-bold block">Details</span>
                <div className="bg-base-200 p-4 rounded-lg text-sm whitespace-pre-wrap min-h-[100px]">
                  {selectedActivity.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-base-200">
                <div>
                  <span className="text-xs uppercase opacity-50 font-bold block">User</span>
                  <p className="font-medium">{selectedActivity.user?.firstName} {selectedActivity.user?.lastName}</p>
                  <p className="text-xs opacity-60 capitalize">{selectedActivity.user?.role || 'User'}</p>
                </div>
                <div>
                  <span className="text-xs uppercase opacity-50 font-bold block">Timestamp</span>
                  <p className="text-sm">{formatDateTime(selectedActivity.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="modal-action">
              {selectedActivity.category === 'sale' && (
                <button onClick={() => printActivityReceipt(selectedActivity)} className="btn btn-outline btn-info">
                  🖨️ Print Receipt
                </button>
              )}
              <button 
                onClick={() => { setShowActivityModal(false); setSelectedActivity(null); }} 
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && selectedTransaction && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">🧾 Transaction Details</h3>
            
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs opacity-60">Receipt Number</div>
                  <div className="font-mono font-semibold">{selectedTransaction.receiptNumber}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Date & Time</div>
                  <div className="text-sm">{formatDateTime(selectedTransaction.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Customer</div>
                  <div className="font-semibold">{selectedTransaction.customer ? `${selectedTransaction.customer.firstName} ${selectedTransaction.customer.lastName}` : selectedTransaction.customerName}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Payment Method</div>
                  <div>
                    <span className="badge badge-sm badge-success">
                      💵 Cash
                    </span>
                  </div>
                </div>
                {selectedTransaction.staff && (
                  <div>
                    <div className="text-xs opacity-60">Staff</div>
                    <div className="text-sm">{selectedTransaction.staff.firstName} {selectedTransaction.staff.lastName}</div>
                  </div>
                )}
                {selectedTransaction.paymentMethod === 'cash' && selectedTransaction.cashReceived > 0 && (
                  <>
                    <div>
                      <div className="text-xs opacity-60">Cash Received</div>
                      <div className="font-semibold text-success">{formatPeso(selectedTransaction.cashReceived)}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">Change</div>
                      <div className="font-semibold text-info">{formatPeso(selectedTransaction.changeAmount || 0)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">🛒 Items</h4>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{item.productName}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatPeso(item.unitPrice)}</td>
                        <td className="text-right font-semibold">{formatPeso(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan="3" className="text-right">Total:</td>
                      <td className="text-right text-lg">{formatPeso(selectedTransaction.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedTransaction.description && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📝 Description</h4>
                <div className="bg-base-100 rounded-lg p-3">
                  <p className="text-sm">{selectedTransaction.description}</p>
                </div>
              </div>
            )}

            {selectedTransaction.notes && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📌 Notes</h4>
                <div className="bg-base-100 rounded-lg p-3">
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button onClick={() => printReceiptAsPDF(selectedTransaction)} className="btn btn-outline btn-info">🖨️ Print PDF</button>
              <button onClick={() => setShowTransactionModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
