import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api, formatPeso, formatDate, formatDateTime } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ThemeToggle from '../components/ThemeToggle';

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

  // Debt state
  const [debts, setDebts] = useState([]);
  const [debtFilter, setDebtFilter] = useState('pending');
  const [debtSearch, setDebtSearch] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [debtSummary, setDebtSummary] = useState([]);
  const [showDebtDetailModal, setShowDebtDetailModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);

  // Sales state
  const [transactions, setTransactions] = useState([]);
  const [salesDateFilter, setSalesDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [salesReceiptSearch, setSalesReceiptSearch] = useState('');
  const [salesPeriod, setSalesPeriod] = useState('week');
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Reports state
  const [reportData, setReportData] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [bestSellers, setBestSellers] = useState([]);
  const [debtAging, setDebtAging] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newCreditLimit, setNewCreditLimit] = useState('');

  // Activity state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('');

  // Low stock alert state
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [dismissLowStock, setDismissLowStock] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Feedback & Tickets state
  const [feedbackList, setFeedbackList] = useState([]);
  const [ticketList, setTicketList] = useState([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketResponse, setTicketResponse] = useState('');
  const [ticketNewStatus, setTicketNewStatus] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);

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

  const loadDebts = useCallback(async () => {
    try {
      let url = '/debts?';
      if (debtFilter && debtFilter !== 'all') url += `status=${debtFilter}&`;
      if (debtSearch) url += `search=${debtSearch}&`;
      const data = await api.get(url);
      setDebts(data);
      const summary = await api.get('/debts/summary');
      setDebtSummary(summary);
    } catch (e) { console.error(e); }
  }, [debtFilter, debtSearch]);

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
      const data = await api.get(`/reports/sales?period=${salesPeriod}`);
      setSalesAnalytics(data);
    } catch (e) { console.error(e); }
  }, [salesPeriod]);

  const loadReports = useCallback(async () => {
    try {
      const [sales, sellers, aging] = await Promise.all([
        api.get(`/reports/sales?period=${reportPeriod}`),
        api.get(`/reports/best-sellers?period=${reportPeriod}`),
        api.get('/reports/debt-aging')
      ]);
      setReportData(sales);
      setBestSellers(sellers);
      setDebtAging(aging);
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

  const loadLowStockAlert = useCallback(async () => {
    try {
      const data = await api.get('/products?lowStock=true');
      setLowStockProducts(data);
      setDismissLowStock(false);
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

  const loadFeedback = useCallback(async () => {
    try {
      const data = await api.get('/feedback');
      setFeedbackList(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      let url = '/tickets?';
      if (ticketStatusFilter) url += `status=${ticketStatusFilter}`;
      const data = await api.get(url);
      setTicketList(data);
    } catch (e) { console.error(e); }
  }, [ticketStatusFilter]);

  useEffect(() => {
    if (!user) return;
    loadLowStockAlert();
  }, [user, loadLowStockAlert]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'dashboard') { loadDashboard(); loadCategories(); }
    if (activeTab === 'inventory') { loadProducts(); loadCategories(); }
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'debts') loadDebts();
    if (activeTab === 'sales') { loadTransactions(); loadSalesAnalytics(); }
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'activity') loadActivity();
    if (activeTab === 'feedback') { loadFeedback(); loadTickets(); }
  }, [user, activeTab, loadDashboard, loadProducts, loadCategories, loadDebts, loadTransactions, loadSalesAnalytics, loadReports, loadUsers, loadActivity, loadFeedback, loadTickets]);

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
        expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : ''
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

  // Debt payment
  const openPayModal = (debt) => {
    setPayingDebt(debt);
    setPayAmount('');
    setShowPayModal(true);
  };

  const processPayment = async () => {
    try {
      await api.post(`/debts/${payingDebt._id}/pay`, {
        amount: Number(payAmount),
        method: 'cash'
      });
      showAlertMsg('Payment recorded!');
      setShowPayModal(false);
      loadDebts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  // Feedback & Tickets
  const markFeedbackRead = async (id) => {
    try {
      await api.put(`/feedback/${id}/mark-read`);
      showAlertMsg('Feedback marked as read');
      loadFeedback();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const deleteFeedback = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      showAlertMsg('Feedback deleted');
      loadFeedback();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketResponse(ticket.response || '');
    setTicketNewStatus(ticket.status);
    setShowTicketModal(true);
  };

  const saveTicketResponse = async () => {
    if (!ticketResponse.trim()) {
      alert('Please enter a response');
      return;
    }
    try {
      await api.put(`/tickets/${selectedTicket._id}/respond`, {
        response: ticketResponse,
        status: ticketNewStatus
      });
      showAlertMsg('Response saved!');
      setShowTicketModal(false);
      loadTickets();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}/status`, { status });
      showAlertMsg('Ticket status updated');
      loadTickets();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const deleteTicket = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      showAlertMsg('Ticket deleted');
      loadTickets();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  // Users
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

  const openCreditModal = (user) => {
    setEditingUser(user);
    setNewCreditLimit(user.creditLimit || '');
    setShowCreditModal(true);
  };

  const updateCreditLimit = async () => {
    if (!editingUser) return;
    const limit = parseFloat(newCreditLimit);
    if (isNaN(limit) || limit < 0) {
      showAlertMsg('Please enter a valid credit limit', 'error');
      return;
    }
    try {
      await api.put(`/users/${editingUser._id}`, { creditLimit: limit });
      showAlertMsg(`Credit limit updated to ${formatPeso(limit)}`);
      setShowCreditModal(false);
      setEditingUser(null);
      setNewCreditLimit('');
      loadUsers();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  if (!user) return null;

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard', },
    { key: 'inventory', label: '📦 Products' },
    { key: 'categories', label: '🏷️ Categories' },
    { key: 'sales', label: '💰 Sales' },
    { key: 'debts', label: '📋 Debts' },
    { key: 'reports', label: '📈 Reports' },
    { key: 'users', label: '👥 Users' },
    { key: 'activity', label: '📝 Activity' },
    { key: 'feedback', label: '💬 Feedback' },
  ];

  return (
    <div className="min-h-screen bg-base-200 flex">
      <div className="w-1/4 md:w-56 bg-base-100 shadow-xl flex flex-col min-h-screen print:hidden">
        <div className="p-4 border-b border-base-300">
          <h2 className="font-bold text-xs md:text-lg">🏪 Lynx Store</h2>
          <p className="text-[10px] md:text-xs opacity-60">Admin Panel</p>
        </div>
        <nav className="flex-1 p-1 md:p-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-2 md:px-3 py-2 md:py-2.5 rounded-lg mb-1 text-[10px] md:text-sm transition-all ${activeTab === tab.key ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}>
              <span className="md:inline">{tab.label}</span>
            </button>
          ))}
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
                    {p.name} <span className="opacity-70">({p.stock} {p.unit} left)</span>
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

        {alert && (
          <div className={`alert ${alert.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 shadow-lg`}>
            <span>{alert.msg}</span>
          </div>
        )}

        {activeTab === 'dashboard' && dashboardStats && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="stat bg-base-100 rounded-xl shadow">
                <div className="stat-title">Today's Sales</div>
                <div className="stat-value text-primary text-2xl">{formatPeso(dashboardStats.today.revenue)}</div>
                <div className="stat-desc">{dashboardStats.today.totalSales} transactions</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow">
                <div className="stat-title">Total Debts</div>
                <div className="stat-value text-error text-2xl">{formatPeso(dashboardStats.debts.totalOutstanding)}</div>
                <div className="stat-desc">{dashboardStats.debts.customersWithDebt} with debts</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow">
                <div className="stat-title">Products</div>
                <div className="stat-value text-2xl">{dashboardStats.inventory.totalProducts}</div>
                <div className="stat-desc">{dashboardStats.inventory.lowStockCount} low stock</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow">
                <div className="stat-title">Customers</div>
                <div className="stat-value text-2xl">{dashboardStats.customers.total}</div>
                <div className="stat-desc">Registered customers</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {dashboardStats.today.cashSales > 0 || dashboardStats.today.creditSales > 0 ? (
                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-lg">💵 Today's Sales Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Cash:</span><span className="font-bold text-success">{formatPeso(dashboardStats.today.cashSales)}</span></div>
                      <div className="flex justify-between"><span>Utang:</span><span className="font-bold text-warning">{formatPeso(dashboardStats.today.creditSales)}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card bg-base-100 shadow">
                  <div className="card-body items-center text-center">
                    <h3 className="text-lg">💵 Today's Sales</h3>
                    <p className="opacity-60">No sales yet today</p>
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="card-title text-lg">⚠️ Alerts</h3>
                  <div className="space-y-2">
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
                    {dashboardStats.debts.pendingCount > 0 && (
                      <div className="flex items-center gap-2 text-info">
                        <span>📋</span> <span>{dashboardStats.debts.pendingCount} pending debts</span>
                      </div>
                    )}
                    {dashboardStats.inventory.lowStockCount === 0 && dashboardStats.inventory.nearExpiryCount === 0 && dashboardStats.debts.pendingCount === 0 && (
                      <p className="opacity-60">No alerts today! 🎉</p>
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

            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-sm">
                <thead>
                  <tr>
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
                    <tr key={p._id} className={p.isLowStock ? 'bg-warning/10' : ''}>
                      <td>
                        <div className="font-semibold">{p.name}</div>
                        {p.brand && <div className="text-xs opacity-60">{p.brand}</div>}
                      </td>
                      <td className="text-xs">{p.barcode || '-'}</td>
                      <td>{p.category?.icon} {p.category?.name}</td>
                      <td>{formatPeso(p.unitPrice)}</td>
                      <td>{p.tingiPrice > 0 ? `${formatPeso(p.tingiPrice)}/${p.tingiUnit}` : '-'}</td>
                      <td>
                        <span className={`badge ${p.isLowStock ? 'badge-warning' : 'badge-success'} badge-sm`}>
                          {p.stock} {p.unit}
                        </span>
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
                    <tr><td colSpan="8" className="text-center py-8 opacity-60">No products yet. Add one!</td></tr>
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
                  Period: {salesPeriod === 'week' ? 'Last 7 Days' : salesPeriod === 'month' ? 'Last 30 Days' : 'Last 365 Days'}
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
            <div className="flex gap-2 mb-6 print:hidden">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setSalesPeriod(p)}
                  className={`btn btn-sm ${salesPeriod === p ? 'btn-primary' : 'btn-ghost'}`}>
                  {p === 'week' ? '📅 This Week' : p === 'month' ? '📆 This Month' : '📊 This Year'}
                </button>
              ))}
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

                  <div className="card bg-gradient-to-br from-warning to-warning/70 text-warning-content shadow-lg print:bg-none print:bg-white print:text-black print:shadow-none print:border print:border-base-300">
                    <div className="card-body p-4 lg:p-6 print:p-2">
                      <div className="text-sm opacity-90 font-medium">Credit Sales</div>
                      <div className="text-2xl lg:text-3xl font-bold">{formatPeso(salesAnalytics.creditTotal)}</div>
                      <div className="text-xs opacity-75">{salesAnalytics.creditCount} credit transactions</div>
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
                          <td className="border font-medium">Credit (Utang) Sales</td>
                          <td className="border">{formatPeso(salesAnalytics.creditTotal)}</td>
                          <td className="border">{salesAnalytics.creditCount} Transactions</td>
                        </tr>
                        <tr>
                          <td className="border font-medium">Split Payments</td>
                          <td className="border">{formatPeso(salesAnalytics.splitTotal || 0)}</td>
                          <td className="border">{salesAnalytics.splitCount || 0} Transactions</td>
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
                      <h3 className="card-title text-lg print:text-sm">💵 Payment Methods Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                          <span className="font-medium">💵 Cash</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatPeso(salesAnalytics.cashTotal)}</div>
                            <div className="text-xs opacity-60">{salesAnalytics.cashCount} transactions</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                          <span className="font-medium">📋 Credit (Utang)</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatPeso(salesAnalytics.creditTotal)}</div>
                            <div className="text-xs opacity-60">{salesAnalytics.creditCount} transactions</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">
                          <span className="font-medium">💵📋 Split Payment</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatPeso(salesAnalytics.splitTotal || 0)}</div>
                            <div className="text-xs opacity-60">{salesAnalytics.splitCount || 0} transactions</div>
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
                            <span className={`badge badge-sm print:badge-outline print:text-black print:border-gray-300 ${t.paymentMethod === 'cash' ? 'badge-success' : t.paymentMethod === 'credit' ? 'badge-warning' : 'badge-info'}`}>
                              {t.paymentMethod === 'cash' ? '💵 Cash' : t.paymentMethod === 'credit' ? '📋 Utang' : '💵📋 Split'}
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

        {activeTab === 'debts' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">📋 Debt List</h1>

            {debtSummary.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Customers with Debts:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {debtSummary.map((ds, i) => (
                    <div key={i} className="card bg-base-100 shadow-sm p-3">
                      <div className="font-semibold">{ds.customer?.firstName} {ds.customer?.lastName}</div>
                      <div className="text-lg font-bold text-error">{formatPeso(ds.remainingBalance)}</div>
                      <div className="text-xs opacity-60">{ds.debtCount} debts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="🔍 Search customer name..." value={debtSearch}
                onChange={e => setDebtSearch(e.target.value)} className="input input-bordered input-sm w-64" />
            </div>

            <div className="flex gap-2 mb-4">
              {['all', 'pending', 'partial', 'paid'].map(s => (
                <button key={s} onClick={() => setDebtFilter(s)}
                  className={`btn btn-sm ${debtFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
                  {s === 'all' ? 'All' : s === 'pending' ? 'Unpaid' : s === 'partial' ? 'Partial' : 'Paid'}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Items/Description</th>
                    <th>Total</th>
                    <th>Amount Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(d => (
                    <tr key={d._id} className="cursor-pointer hover:bg-base-200"
                        onClick={() => { setSelectedDebt(d); setShowDebtDetailModal(true); }}>
                      <td className="font-semibold">{d.customer?.firstName} {d.customer?.lastName}</td>
                      <td className="text-xs">
                        {d.items.length > 0 ? d.items.map(i => `${i.productName} x${i.quantity}`).join(', ') : d.description || '-'}
                      </td>
                      <td>{formatPeso(d.totalAmount)}</td>
                      <td className="text-success">{formatPeso(d.paidAmount)}</td>
                      <td className="font-bold text-error">{formatPeso(d.remainingBalance)}</td>
                      <td>
                        <span className={`badge badge-sm ${d.status === 'paid' ? 'badge-success' : d.status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                          {d.status === 'paid' ? '✅ Paid' : d.status === 'partial' ? '⏳ Partial' : '❌ Pending'}
                        </span>
                      </td>
                      <td className="text-xs">{formatDate(d.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {d.status !== 'paid' && (
                          <button onClick={() => openPayModal(d)} className="btn btn-xs btn-success">💵 Pay</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {debts.length === 0 && (
                    <tr><td colSpan="8" className="text-center py-8 opacity-60">No debt records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">📈 Reports</h1>
            <div className="flex gap-2 mb-4">
              {['week', 'month'].map(p => (
                <button key={p} onClick={() => setReportPeriod(p)}
                  className={`btn btn-sm ${reportPeriod === p ? 'btn-primary' : 'btn-ghost'}`}>
                  {p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            {reportData && (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title">💰 Sales Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Total Revenue:</span><span className="font-bold text-xl">{formatPeso(reportData.totalRevenue)}</span></div>
                      <div className="flex justify-between"><span>Transactions:</span><span>{reportData.totalTransactions}</span></div>
                      <div className="flex justify-between"><span>Cash Sales:</span><span className="text-success">{formatPeso(reportData.cashTotal)}</span></div>
                      <div className="flex justify-between"><span>Credit/Utang Sales:</span><span className="text-warning">{formatPeso(reportData.creditTotal)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title">🏆 Best Sellers</h3>
                    <div className="space-y-1">
                      {bestSellers.slice(0, 8).map((bs, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{i + 1}. {bs.name}</span>
                          <span className="font-semibold">{bs.totalQuantity} sold</span>
                        </div>
                      ))}
                      {bestSellers.length === 0 && <p className="opacity-60">No data yet</p>}
                    </div>
                  </div>
                </div>

                {debtAging && (
                  <div className="card bg-base-100 shadow lg:col-span-2">
                    <div className="card-body">
                      <h3 className="card-title">📋 Debt Aging Report</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(debtAging).map(([period, data]) => (
                          <div key={period} className={`p-4 rounded-lg ${period.includes('60+') ? 'bg-error/10' : period.includes('31') ? 'bg-warning/10' : 'bg-info/10'}`}>
                            <div className="text-sm font-semibold">{period}</div>
                            <div className="text-2xl font-bold">{formatPeso(data.total)}</div>
                            <div className="text-xs opacity-60">{data.count} debts</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {reportData.dailyBreakdown?.length > 0 && (
                  <div className="card bg-base-100 shadow lg:col-span-2">
                    <div className="card-body">
                      <h3 className="card-title">📊 Daily Sales Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead><tr><th>Date</th><th>Revenue</th><th>Transactions</th></tr></thead>
                          <tbody>
                            {reportData.dailyBreakdown.map(d => (
                              <tr key={d.date}>
                                <td>{d.date}</td>
                                <td className="font-bold">{formatPeso(d.revenue)}</td>
                                <td>{d.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">👥 Users</h1>
              <button onClick={() => setShowUserModal(true)} className="btn btn-primary btn-sm">+ Add Staff</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="🔍 Search name or email..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} className="input input-bordered input-sm w-64" />
            </div>
            <div className="flex gap-2 mb-4">
              {['', 'admin', 'staff', 'customer'].map(r => (
                <button key={r} onClick={() => setUserFilter(r)}
                  className={`btn btn-sm ${userFilter === r ? 'btn-primary' : 'btn-ghost'}`}>
                  {r === '' ? 'All' : r === 'admin' ? 'Admin' : r === 'staff' ? 'Staff' : 'Customer'}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-sm">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Credit Limit</th><th>Registered</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="font-semibold">{u.firstName} {u.lastName}</td>
                      <td className="text-xs">{u.email}</td>
                      <td>
                        <span className={`badge badge-sm ${u.role === 'admin' ? 'badge-error' : u.role === 'staff' ? 'badge-info' : 'badge-success'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>{u.creditLimit ? formatPeso(u.creditLimit) : '-'}</td>
                      <td className="text-xs">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-1">
                          {u.role === 'customer' && (
                            <button onClick={() => openCreditModal(u)} className="btn btn-xs btn-ghost text-info" title="Edit Credit Limit">💳</button>
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
            <h1 className="text-2xl font-bold mb-4">📝 Activity Log</h1>
            <div className="flex gap-2 mb-4">
              {['', 'sale', 'inventory', 'debt', 'payment', 'user'].map(c => (
                <button key={c} onClick={() => setActivityFilter(c)}
                  className={`btn btn-sm ${activityFilter === c ? 'btn-primary' : 'btn-ghost'}`}>
                  {c === '' ? 'All' : c === 'sale' ? '💰 Sales' : c === 'inventory' ? '📦 Inventory' : c === 'debt' ? '📋 Debts' : c === 'payment' ? '💵 Payments' : '👤 User'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {activityLogs.map(log => (
                <div key={log._id} 
                  onClick={() => { setSelectedActivity(log); setShowActivityModal(true); }}
                  className="card bg-base-100 shadow-sm p-3 flex flex-row items-center gap-3 cursor-pointer hover:bg-base-200 transition-colors">
                  <span className="text-xl">
                    {log.category === 'sale' ? '💰' : log.category === 'inventory' ? '📦' : log.category === 'debt' ? '📋' : log.category === 'payment' ? '💵' : '👤'}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{log.action}</div>
                    <div className="text-xs opacity-60 truncate max-w-md">{log.details}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">{log.user?.firstName} {log.user?.lastName}</div>
                    <div className="text-xs opacity-50">{formatDateTime(log.createdAt)}</div>
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && <p className="text-center opacity-60 py-8">No activity logs</p>}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">💬 Customer Feedback & Support</h1>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">⭐ Customer Feedback</h2>
                  <div className="badge badge-lg">{feedbackList.length} total</div>
                </div>

                {feedbackList.length === 0 ? (
                  <div className="bg-base-100 rounded-xl shadow p-8 text-center opacity-60">
                    <span className="text-5xl">📝</span>
                    <p className="mt-3">No feedback yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[700px] overflow-y-auto">
                    {feedbackList.map(f => (
                      <div key={f._id} className={`bg-base-100 rounded-xl shadow p-4 border-2 ${f.isRead ? 'border-transparent' : 'border-warning'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{f.customer?.firstName} {f.customer?.lastName}</div>
                            <div className="text-xs opacity-60">{f.customer?.email}</div>
                          </div>
                          {!f.isRead && <span className="badge badge-warning">New</span>}
                        </div>

                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < f.rating ? 'text-warning' : 'text-base-300'}`}>⭐</span>
                          ))}
                          <span className="ml-2 text-sm font-semibold">{f.rating}/5</span>
                        </div>

                        <p className="text-sm mb-3">{f.comment}</p>

                        <div className="flex justify-between items-center">
                          <span className="text-xs opacity-60">{formatDateTime(f.createdAt)}</span>
                          <div className="flex gap-2">
                            {!f.isRead && (
                              <button onClick={() => markFeedbackRead(f._id)} className="btn btn-xs btn-success">
                                ✓ Mark Read
                              </button>
                            )}
                            <button onClick={() => deleteFeedback(f._id)} className="btn btn-xs btn-ghost text-error">
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">🎫 Support Tickets</h2>
                  <div className="flex gap-2">
                    {['', 'open', 'in-progress', 'resolved', 'closed'].map(s => (
                      <button key={s} onClick={() => setTicketStatusFilter(s)}
                        className={`btn btn-xs ${ticketStatusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
                        {s === '' ? 'All' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {ticketList.length === 0 ? (
                  <div className="bg-base-100 rounded-xl shadow p-8 text-center opacity-60">
                    <span className="text-5xl">🎫</span>
                    <p className="mt-3">No tickets yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[700px] overflow-y-auto">
                    {ticketList.map(t => (
                      <div key={t._id} className="bg-base-100 rounded-xl shadow p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold">{t.subject}</div>
                            <div className="text-xs opacity-60">
                              {t.customer?.firstName} {t.customer?.lastName} • {t.customer?.email}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className={`badge badge-sm ${
                              t.priority === 'high' ? 'badge-error' :
                              t.priority === 'medium' ? 'badge-warning' : 'badge-info'
                            }`}>{t.priority}</span>
                            <span className={`badge badge-sm ${
                              t.status === 'resolved' || t.status === 'closed' ? 'badge-success' :
                              t.status === 'in-progress' ? 'badge-warning' : 'badge-ghost'
                            }`}>{t.status}</span>
                          </div>
                        </div>

                        <p className="text-sm mb-2">{t.description}</p>

                        {t.response && (
                          <div className="bg-success/10 rounded-lg p-2 mb-2 border-l-4 border-success">
                            <p className="text-xs font-semibold text-success mb-1">
                              Response by {t.respondedBy?.firstName}:
                            </p>
                            <p className="text-xs">{t.response}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-base-200">
                          <span className="text-xs opacity-60">{formatDateTime(t.createdAt)}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openTicketModal(t)} className="btn btn-xs btn-primary">
                              {t.response ? '✏️ Edit' : '💬 Respond'}
                            </button>
                            {t.status !== 'closed' && (
                              <select value={t.status} onChange={(e) => updateTicketStatus(t._id, e.target.value)}
                                className="select select-xs select-bordered">
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            )}
                            <button onClick={() => deleteTicket(t._id)} className="btn btn-xs btn-ghost text-error">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {showPayModal && payingDebt && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">💵 Receive Payment</h3>
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <p><strong>Customer:</strong> {payingDebt.customer?.firstName} {payingDebt.customer?.lastName}</p>
              <p><strong>Total Debt:</strong> {formatPeso(payingDebt.totalAmount)}</p>
              <p><strong>Amount Paid:</strong> {formatPeso(payingDebt.paidAmount)}</p>
              <p className="text-lg font-bold text-error"><strong>Remaining:</strong> {formatPeso(payingDebt.remainingBalance)}</p>
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Payment Amount (₱)</span></label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="input input-bordered input-lg text-center" placeholder="0.00"
                max={payingDebt.remainingBalance} />
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setPayAmount(payingDebt.remainingBalance)} className="btn btn-sm btn-outline">Full Payment</button>
              <button onClick={() => setPayAmount(Math.ceil(payingDebt.remainingBalance / 2))} className="btn btn-sm btn-outline">Half</button>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowPayModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={processPayment} className="btn btn-success" disabled={!payAmount || Number(payAmount) <= 0}>
                ✅ Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && editingUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">💳 Edit Credit Limit</h3>
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="font-semibold">{editingUser.firstName} {editingUser.lastName}</div>
              <div className="text-xs opacity-60">{editingUser.email}</div>
              <div className="text-sm mt-2">Current Credit Limit: <span className="font-bold">{editingUser.creditLimit ? formatPeso(editingUser.creditLimit) : 'Not set'}</span></div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">New Credit Limit (₱)</span></label>
              <input type="number" value={newCreditLimit} onChange={e => setNewCreditLimit(e.target.value)}
                className="input input-bordered" placeholder="Enter amount" min="0" step="100" />
              <label className="label"><span className="label-text-alt opacity-60">Set the maximum credit/utang limit for this customer</span></label>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowCreditModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={updateCreditLimit} className="btn btn-primary">💾 Update Limit</button>
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

      {showTicketModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">💬 Respond to Ticket</h3>
            
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{selectedTicket.subject}</div>
                  <div className="text-xs opacity-60">
                    From: {selectedTicket.customer?.firstName} {selectedTicket.customer?.lastName}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${
                    selectedTicket.priority === 'high' ? 'badge-error' :
                    selectedTicket.priority === 'medium' ? 'badge-warning' : 'badge-info'
                  }`}>{selectedTicket.priority}</span>
                </div>
              </div>
              <p className="text-sm">{selectedTicket.description}</p>
              <p className="text-xs opacity-60 mt-2">{formatDateTime(selectedTicket.createdAt)}</p>
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text font-semibold">Your Response</span></label>
              <textarea value={ticketResponse} onChange={e => setTicketResponse(e.target.value)}
                className="textarea textarea-bordered h-32" 
                placeholder="Type your response to the customer..."></textarea>
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text font-semibold">Update Status</span></label>
              <select value={ticketNewStatus} onChange={e => setTicketNewStatus(e.target.value)}
                className="select select-bordered">
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowTicketModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={saveTicketResponse} className="btn btn-primary">💾 Save Response</button>
            </div>
          </div>
        </div>
      )}

      {showDebtDetailModal && selectedDebt && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button onClick={() => setShowDebtDetailModal(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <h3 className="font-bold text-xl mb-4">📋 Debt Details</h3>
            
            {/* Customer Info */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs opacity-60">Customer</div>
                  <div className="font-semibold">{selectedDebt.customer?.firstName} {selectedDebt.customer?.lastName}</div>
                  <div className="text-xs opacity-60">{selectedDebt.customer?.email}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Phone</div>
                  <div className="font-semibold">{selectedDebt.customer?.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Created</div>
                  <div className="font-semibold">{formatDate(selectedDebt.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Status</div>
                  <div>
                    <span className={`badge ${selectedDebt.status === 'paid' ? 'badge-success' : selectedDebt.status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                      {selectedDebt.status === 'paid' ? '✅ Paid' : selectedDebt.status === 'partial' ? '⏳ Partial' : '❌ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card bg-base-200 shadow-sm p-3">
                <div className="text-xs opacity-60">Total Amount</div>
                <div className="text-lg font-bold">{formatPeso(selectedDebt.totalAmount)}</div>
              </div>
              <div className="card bg-success/10 shadow-sm p-3">
                <div className="text-xs opacity-60">Amount Paid</div>
                <div className="text-lg font-bold text-success">{formatPeso(selectedDebt.paidAmount)}</div>
              </div>
              <div className="card bg-error/10 shadow-sm p-3">
                <div className="text-xs opacity-60">Remaining Balance</div>
                <div className="text-lg font-bold text-error">{formatPeso(selectedDebt.remainingBalance)}</div>
              </div>
            </div>

            {/* Items List */}
            {selectedDebt.items && selectedDebt.items.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📦 Items</h4>
                <div className="overflow-x-auto bg-base-100 rounded-lg">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDebt.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{item.productName}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">{formatPeso(item.unitPrice)}</td>
                          <td className="text-right font-semibold">{formatPeso(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Description */}
            {selectedDebt.description && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📝 Description</h4>
                <div className="bg-base-100 rounded-lg p-3">
                  <p className="text-sm">{selectedDebt.description}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedDebt.notes && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📌 Notes</h4>
                <div className="bg-base-100 rounded-lg p-3">
                  <p className="text-sm">{selectedDebt.notes}</p>
                </div>
              </div>
            )}

            {/* Payment History */}
            {selectedDebt.payments && selectedDebt.payments.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">💵 Payment History</h4>
                <div className="space-y-2">
                  {selectedDebt.payments.map((payment, idx) => (
                    <div key={idx} className="bg-success/10 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-success">{formatPeso(payment.amount)}</div>
                        <div className="text-xs opacity-60">{formatDateTime(payment.paidAt)}</div>
                        {payment.notes && <div className="text-xs mt-1">{payment.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div className="badge badge-sm badge-success">{payment.method || 'cash'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button onClick={() => setShowDebtDetailModal(false)} className="btn btn-ghost">Close</button>
              {selectedDebt.status !== 'paid' && (
                <button onClick={() => { setShowDebtDetailModal(false); openPayModal(selectedDebt); }} 
                  className="btn btn-success">💵 Record Payment</button>
              )}
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
                 selectedActivity.category === 'inventory' ? '📦' : 
                 selectedActivity.category === 'debt' ? '📋' : 
                 selectedActivity.category === 'payment' ? '💵' : '👤'}
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
              <button 
                onClick={() => { setShowActivityModal(false); setSelectedActivity(null); }} 
                className="btn btn-primary w-full"
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
                    <span className={`badge badge-sm ${selectedTransaction.paymentMethod === 'cash' ? 'badge-success' : selectedTransaction.paymentMethod === 'credit' ? 'badge-warning' : 'badge-info'}`}>
                      {selectedTransaction.paymentMethod === 'cash' ? '💵 Cash' : selectedTransaction.paymentMethod === 'credit' ? '📋 Utang' : '💵📋 Split'}
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
              <button onClick={() => setShowTransactionModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
