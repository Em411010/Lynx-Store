import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api, formatPeso, formatDate, formatDateTime } from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  const [alert, setAlert] = useState(null);

  // POS State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showReceipt, setShowReceipt] = useState(null);

  // Utang State
  const [debts, setDebts] = useState([]);
  const [debtFilter, setDebtFilter] = useState('pending');
  const [debtSearch, setDebtSearch] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');  
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [debtForm, setDebtForm] = useState({ customer: '', description: '', totalAmount: '' });
  const [showDebtDetailModal, setShowDebtDetailModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);

  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState('');

  // History State
  const [myTransactions, setMyTransactions] = useState([]);
  const [historyDateFilter, setHistoryDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [historyReceiptSearch, setHistoryReceiptSearch] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'staff' && parsed.role !== 'admin') { navigate('/'); return; }
    setUser(parsed);
  }, [navigate]);

  const showAlertMsg = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const loadProducts = useCallback(async () => {
    try {
      let url = '/products?active=true&';
      if (posSearch) url += `search=${posSearch}&`;
      if (posCategory) url += `category=${posCategory}&`;
      const data = await api.get(url);
      setProducts(data);
    } catch (e) { console.error(e); }
  }, [posSearch, posCategory]);

  const loadCategories = useCallback(async () => {
    try { setCategories(await api.get('/categories')); } catch (e) { console.error(e); }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      let url = '/users/customers';
      if (customerSearch) url += `?search=${customerSearch}`;
      setCustomers(await api.get(url));
    } catch (e) { console.error(e); }
  }, [customerSearch]);

  const loadDebts = useCallback(async () => {
    try {
      let url = '/debts?';
      if (debtFilter !== 'all') url += `status=${debtFilter}&`;
      if (debtSearch) url += `search=${debtSearch}&`;
      setDebts(await api.get(url));
    } catch (e) { console.error(e); }
  }, [debtFilter, debtSearch]);

  const loadMyTransactions = useCallback(async () => {
    try {
      let url;
      if (historyReceiptSearch) {
        url = `/transactions?receipt=${encodeURIComponent(historyReceiptSearch)}`;
      } else {
        url = `/transactions?date=${historyDateFilter}`;
      }
      setMyTransactions(await api.get(url));
    } catch (e) { console.error(e); }
  }, [historyDateFilter, historyReceiptSearch]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'pos') { loadProducts(); loadCategories(); loadCustomers(); }
    if (activeTab === 'utang') { loadDebts(); loadCustomers(); }
    if (activeTab === 'history') loadMyTransactions();
    if (activeTab === 'products') { loadProducts(); loadCategories(); }
  }, [user, activeTab, loadProducts, loadCategories, loadCustomers, loadDebts, loadMyTransactions]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

  // Cart functions
  const addToCart = (product, isTingi = false) => {
    const price = isTingi ? product.tingiPrice : product.unitPrice;
    const cartKey = `${product._id}_${isTingi ? 'tingi' : 'whole'}`;
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
      setCart(cart.map(item =>
        item.cartKey === cartKey
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        cartKey,
        product: product._id,
        productName: product.name + (isTingi ? ` (Tingi)` : ''),
        quantity: 1,
        unitPrice: price,
        subtotal: price,
        isTingi,
        maxStock: isTingi ? product.stock * (product.tingiPerPack || 1) : product.stock
      }]);
    }
  };

  const updateCartQty = (cartKey, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.cartKey !== cartKey));
    } else {
      setCart(cart.map(item =>
        item.cartKey === cartKey
          ? { ...item, quantity: qty, subtotal: qty * item.unitPrice }
          : item
      ));
    }
  };

  const removeFromCart = (cartKey) => {
    setCart(cart.filter(item => item.cartKey !== cartKey));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const changeAmount = paymentMethod === 'cash' && cashReceived ? Math.max(0, Number(cashReceived) - cartTotal) : 0;

  const processTransaction = async () => {
    if (cart.length === 0) { showAlertMsg('Cart is empty!', 'error'); return; }
    if (paymentMethod === 'credit' && !selectedCustomer) {
      showAlertMsg('Select a customer for credit', 'error'); return;
    }
    if (paymentMethod === 'cash' && Number(cashReceived) < cartTotal) {
      showAlertMsg('Insufficient payment!', 'error'); return;
    }

    try {
      const payload = {
        items: cart.map(item => ({
          product: item.product,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          isTingi: item.isTingi
        })),
        customer: selectedCustomer || null,
        customerName: selectedCustomer
          ? customers.find(c => c._id === selectedCustomer)?.firstName + ' ' + customers.find(c => c._id === selectedCustomer)?.lastName
          : 'Walk-in',
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? Number(cashReceived) : 0,
        creditAmount: paymentMethod === 'credit' ? cartTotal : 0
      };

      const result = await api.post('/transactions', payload);
      setShowReceipt(result);
      setCart([]);
      setCashReceived('');
      setSelectedCustomer('');
      setPaymentMethod('cash');
      showAlertMsg('Sale processed!');
      loadProducts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  // Debt functions
  const openPayModal = (debt) => {
    setPayingDebt(debt);
    setPayAmount('');
    setShowPayModal(true);
  };

  const processPayment = async () => {
    try {
      await api.post(`/debts/${payingDebt._id}/pay`, { amount: Number(payAmount), method: 'cash' });
      showAlertMsg('Payment recorded!');
      setShowPayModal(false);
      loadDebts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        const results = await api.get(`/products?active=true&search=${encodeURIComponent(barcodeInput.trim())}`);
        // find exact barcode match first
        const exact = results.find(p => p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase());
        const product = exact || (results.length === 1 ? results[0] : null);
        if (product) {
          if (product.stock <= 0) {
            showAlertMsg(`${product.name} is out of stock!`, 'error');
          } else {
            addToCart(product);
            showAlertMsg(`Added: ${product.name}`);
          }
        } else if (results.length > 1) {
          showAlertMsg(`Multiple matches for "${barcodeInput}" — use search instead`, 'error');
        } else {
          showAlertMsg(`No product found for barcode: ${barcodeInput}`, 'error');
        }
      } catch {
        showAlertMsg('Barcode lookup failed', 'error');
      }
      setBarcodeInput('');
    }
  };

  const addManualDebt = async () => {
    try {
      await api.post('/debts', {
        customer: debtForm.customer,
        description: debtForm.description,
        totalAmount: Number(debtForm.totalAmount),
        items: []
      });
      showAlertMsg('Debt added!');
      setShowAddDebtModal(false);
      setDebtForm({ customer: '', description: '', totalAmount: '' });
      loadDebts();
    } catch (e) { showAlertMsg(e.message, 'error'); }
  };

  if (!user) return null;

  const tabs = [
    { key: 'pos', label: '🛒 Sales' },
    { key: 'utang', label: '📋 Debts' },
    { key: 'products', label: '📦 Products' },
    { key: 'history', label: '📜 History' },
  ];

  return (
    <div className="min-h-screen bg-base-200 flex">
      <div className="w-1/4 md:w-52 bg-base-100 shadow-xl flex flex-col min-h-screen">
        <div className="p-4 border-b border-base-300">
          <h2 className="font-bold text-xs md:text-lg">🏪 Lynx Store</h2>
          <p className="text-[10px] md:text-xs opacity-60">Staff Panel</p>
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
          <p className="text-[9px] md:text-xs opacity-60 mb-2">Staff</p>
          <div className="flex flex-col md:flex-row gap-1 mb-1">
            <button onClick={handleLogout} className="btn btn-[10px] md:btn-sm btn-ghost flex-1 py-1 h-auto min-h-0">Logout</button>
            <ThemeToggle className="scale-75 md:scale-100" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-screen">
        {alert && (
          <div className={`alert ${alert.type === 'error' ? 'alert-error' : 'alert-success'} m-4 shadow-lg`}>
            <span>{alert.msg}</span>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="flex flex-col lg:flex-row lg:h-screen">
            <div className="flex-1 p-2 md:p-4 overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold mb-3"><span className="text-base md:text-xl">🛒</span> Point of Sale</h2>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input type="text" placeholder="🔍 Search product name..."
                  value={posSearch} onChange={e => setPosSearch(e.target.value)}
                  className="input input-bordered input-xs md:input-sm flex-1 min-w-[150px]" />
                <select value={posCategory} onChange={e => setPosCategory(e.target.value)}
                  className="select select-bordered select-xs md:select-sm">
                  <option value="">All</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="📈 Scan or type barcode..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  className="input input-bordered input-xs md:input-sm flex-1 bg-warning/10 border-warning text-[10px] md:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {products.filter(p => p.stock > 0).map(p => (
                  <div key={p._id} className={`card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${p.isLowStock ? 'border border-warning' : ''}`}>
                    <div className="card-body p-2 md:p-3">
                      <div className="text-[9px] md:text-xs opacity-60">{p.category?.icon} {p.category?.name}</div>
                      <h3 className="font-semibold text-[10px] md:text-sm leading-tight truncate">{p.name}</h3>
                      {p.brand && <div className="text-[8px] md:text-xs opacity-50 truncate">{p.brand}</div>}
                      <div className="flex justify-between items-end mt-1">
                        <div>
                          <div className="text-primary font-bold text-xs md:text-base">{formatPeso(p.unitPrice)}</div>
                          {p.tingiPrice > 0 && (
                            <div className="text-[8px] md:text-xs text-secondary">Tingi: {formatPeso(p.tingiPrice)}/{p.tingiUnit}</div>
                          )}
                        </div>
                        <span className={`badge badge-[9px] md:badge-xs ${p.isLowStock ? 'badge-warning' : 'badge-ghost'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => addToCart(p)} className="btn btn-[8px] md:btn-xs btn-primary flex-1 h-auto py-1 min-h-0">
                          + Full
                        </button>
                        {p.tingiPrice > 0 && (
                          <button onClick={() => addToCart(p, true)} className="btn btn-[8px] md:btn-xs btn-secondary flex-1 h-auto py-1 min-h-0">
                            + Tingi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.stock > 0).length === 0 && (
                  <div className="col-span-full text-center py-8 opacity-60 text-xs shadow-inner bg-base-200/50 rounded-xl">
                    No products available
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-72 xl:w-80 bg-base-100 shadow-xl flex flex-col border-t lg:border-t-0 lg:border-l border-base-300">
              <div className="p-2 md:p-3 border-b border-base-300 flex justify-between items-center">
                <h3 className="font-bold text-sm md:text-lg">🧾 Cart ({cart.length})</h3>
                {cart.length > 0 && <button onClick={() => setCart([])} className="btn btn-xs btn-ghost text-error">Clear</button>}
              </div>

              <div className="max-h-[300px] lg:max-h-full lg:flex-1 overflow-y-auto p-2 md:p-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8 opacity-40">
                    <span className="text-2xl md:text-4xl">🛒</span>
                    <p className="mt-1 text-xs md:text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map(item => (
                      <div key={item.cartKey} className="bg-base-200 rounded-lg p-1.5 md:p-2">
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] md:text-sm font-semibold truncate">{item.productName}</div>
                            <div className="text-[9px] md:text-xs opacity-60">{formatPeso(item.unitPrice)} each</div>
                          </div>
                          <button onClick={() => removeFromCart(item.cartKey)} className="btn btn-xs btn-ghost text-error h-auto min-h-0 p-1">✕</button>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateCartQty(item.cartKey, item.quantity - 1)}
                              className="btn btn-xs btn-circle btn-ghost h-6 w-6 min-h-0">-</button>
                            <span className="font-bold text-xs md:text-sm w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.cartKey, item.quantity + 1)}
                              className="btn btn-xs btn-circle btn-ghost h-6 w-6 min-h-0">+</button>
                          </div>
                          <span className="font-bold text-primary text-xs md:text-sm">{formatPeso(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 md:p-3 border-t border-base-300 space-y-2 bg-base-100">
                <div className="flex justify-between text-base md:text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-primary">{formatPeso(cartTotal)}</span>
                </div>

                <div className="flex gap-1">
                  {[
                    { key: 'cash', label: '💵 Cash' },
                    { key: 'credit', label: '📋 Credit' }
                  ].map(pm => (
                    <button key={pm.key} onClick={() => setPaymentMethod(pm.key)}
                      className={`btn btn-xs md:btn-sm flex-1 ${paymentMethod === pm.key ? 'btn-primary' : 'btn-ghost'}`}>
                      {pm.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div>
                    <input type="number" placeholder="Amount paid (₱)" value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="input input-bordered input-xs md:input-sm w-full" />
                    {changeAmount > 0 && (
                      <div className="text-right text-[10px] md:text-sm mt-1">
                        Change: <span className="font-bold text-success">{formatPeso(changeAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'credit' && (
                  <div>
                    <input type="text" placeholder="🔍 Search customer..." value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); loadCustomers(); }}
                      className="input input-bordered input-xs md:input-sm w-full mb-1" />
                    <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                      className="select select-bordered select-xs md:select-sm w-full">
                      <option value="">Select customer</option>
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button onClick={processTransaction}
                  className="btn btn-sm md:btn-md btn-success w-full"
                  disabled={cart.length === 0}>
                  ✅ Process Sale
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utang' && (
          <div className="p-2 md:p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold"><span className="text-base md:text-xl">📋</span> Debt List</h2>
              <button onClick={() => { setShowAddDebtModal(true); loadCustomers(); }} className="btn btn-warning btn-xs md:btn-sm">
                + Add Debt
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="🔍 Search..." value={debtSearch}
                onChange={e => setDebtSearch(e.target.value)} className="input input-bordered input-xs md:input-sm flex-1 md:w-64" />
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {['all', 'pending', 'partial', 'paid'].map(s => (
                <button key={s} onClick={() => setDebtFilter(s)}
                  className={`btn btn-[10px] md:btn-sm ${debtFilter === s ? 'btn-primary' : 'btn-ghost'} h-auto py-1.5 min-h-0`}>
                  {s === 'all' ? 'All' : s === 'pending' ? 'Unpaid' : s === 'partial' ? 'Partial' : 'Paid'}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-[10px] md:table-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden md:table-cell">Items</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(d => (
                    <tr key={d._id} className={`cursor-pointer hover:bg-base-200 ${d.agingCategory === '60+ araw' ? 'bg-error/10' : ''}`}
                        onClick={() => { setSelectedDebt(d); setShowDebtDetailModal(true); }}>
                      <td className="font-semibold">{d.customer?.firstName}</td>
                      <td className="text-[9px] max-w-24 truncate hidden md:table-cell">
                        {d.items.length > 0 ? d.items.map(i => `${i.productName} x${i.quantity}`).join(', ') : d.description || '-'}
                      </td>
                      <td className="font-bold text-error">{formatPeso(d.remainingBalance)}</td>
                      <td>
                        <span className={`badge badge-[9px] md:badge-sm ${d.status === 'paid' ? 'badge-success' : d.status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                          {d.status === 'paid' ? 'Paid' : d.status === 'partial' ? 'Partial' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="text-[9px] hidden sm:table-cell">{formatDate(d.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {d.status !== 'paid' && (
                          <button onClick={() => openPayModal(d)} className="btn btn-xs btn-success py-0 h-6 min-h-0">Pay</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {debts.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-8 opacity-60 text-xs">No debt records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="p-2 md:p-4">
            <h2 className="text-lg md:text-xl font-bold mb-3"><span className="text-base md:text-xl">📦</span> Products</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="🔍 Search..." value={posSearch}
                onChange={e => setPosSearch(e.target.value)} className="input input-bordered input-xs md:input-sm flex-1 md:w-64" />
              <select value={posCategory} onChange={e => setPosCategory(e.target.value)}
                className="select select-bordered select-xs md:select-sm">
                  <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-[10px] md:table-sm">
                <thead>
                  <tr><th>Product</th><th className="hidden sm:table-cell">Category</th><th>Price</th><th>Stock</th><th className="hidden md:table-cell">Expiry</th></tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} className={p.isLowStock ? 'bg-warning/10' : ''}>
                      <td>
                        <div className="font-semibold line-clamp-1">{p.name}</div>
                        {p.brand && <div className="text-[9px] opacity-60 truncate">{p.brand}</div>}
                      </td>
                      <td className="hidden sm:table-cell">{p.category?.icon} {p.category?.name}</td>
                      <td className="text-[10px] md:text-sm">{formatPeso(p.unitPrice)}</td>
                      <td>
                        <span className={`badge badge-[9px] md:badge-sm ${p.isLowStock ? 'badge-warning' : 'badge-success'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className={`text-[9px] hidden md:table-cell ${p.isExpired ? 'text-error' : p.isNearExpiry ? 'text-warning' : ''}`}>
                        {p.expiryDate ? formatDate(p.expiryDate) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-2 md:p-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h2 className="text-lg md:text-xl font-bold"><span className="text-base md:text-xl">📜</span> My Sales</h2>
              <div className="flex gap-1.5 flex-wrap">
                <input type="text" placeholder="Receipt #" value={historyReceiptSearch}
                  onChange={e => setHistoryReceiptSearch(e.target.value)}
                  className="input input-bordered input-xs md:input-sm w-24 md:w-44" />
                {!historyReceiptSearch && (
                  <input type="date" value={historyDateFilter}
                    onChange={e => setHistoryDateFilter(e.target.value)}
                    className="input input-bordered input-xs md:input-sm" />
                )}
                <button onClick={loadMyTransactions} className="btn btn-ghost btn-xs md:btn-sm">🔄</button>
              </div>
            </div>
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
              <table className="table table-[10px] md:table-sm">
                <thead>
                  <tr><th>Receipt</th><th className="hidden sm:table-cell">Customer</th><th>Total</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {myTransactions.map(t => (
                    <tr key={t._id} className="cursor-pointer hover:bg-base-200"
                        onClick={() => { setSelectedTransaction(t); setShowTransactionModal(true); }}>
                      <td className="font-mono text-[9px] md:text-xs">{t.receiptNumber}</td>
                      <td className="hidden sm:table-cell truncate max-w-24">{t.customer ? `${t.customer.firstName}` : t.customerName}</td>
                      <td className="font-bold text-[10px] md:text-sm">{formatPeso(t.totalAmount)}</td>
                      <td className="text-[9px] md:text-xs opacity-60">{formatDateTime(t.createdAt).split(',')[1]}</td>
                    </tr>
                  ))}
                  {myTransactions.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-8 opacity-60 text-xs">No sales yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showReceipt && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">🧾 Receipt</h3>
              <p className="text-sm opacity-60">Lynx's Sari-sari Store</p>
            </div>
            <div className="border-t border-b border-dashed border-base-300 py-3 mb-3">
              <p className="text-xs"><strong>Receipt #:</strong> {showReceipt.receiptNumber}</p>
              <p className="text-xs"><strong>Date:</strong> {formatDateTime(showReceipt.createdAt)}</p>
              <p className="text-xs"><strong>Customer:</strong> {showReceipt.customer ? `${showReceipt.customer.firstName} ${showReceipt.customer.lastName}` : showReceipt.customerName}</p>
              <p className="text-xs"><strong>Staff:</strong> {showReceipt.staff?.firstName} {showReceipt.staff?.lastName}</p>
            </div>
            <table className="table table-xs w-full">
              <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Subtotal</th></tr></thead>
              <tbody>
                {showReceipt.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatPeso(item.unitPrice)}</td>
                    <td className="text-right">{formatPeso(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed border-base-300 pt-3 mt-3 space-y-1">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span><span>{formatPeso(showReceipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment:</span>
                <span className={showReceipt.paymentMethod === 'cash' ? 'text-success' : 'text-warning'}>
                  {showReceipt.paymentMethod === 'cash' ? '💵 Cash' : '📋 Utang'}
                </span>
              </div>
              {showReceipt.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm"><span>Cash:</span><span>{formatPeso(showReceipt.cashReceived)}</span></div>
                  <div className="flex justify-between text-sm"><span>Change:</span><span className="text-success">{formatPeso(showReceipt.changeAmount)}</span></div>
                </>
              )}
            </div>
            <div className="text-center mt-4 text-xs opacity-60">Thank you for your purchase!</div>
            <div className="modal-action">
              <button onClick={() => setShowReceipt(null)} className="btn btn-primary">OK</button>
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

            {/* Payment history */}
            {payingDebt.payments?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold mb-1">Payment History:</p>
                <div className="space-y-1">
                  {payingDebt.payments.map((p, i) => (
                    <div key={i} className="text-xs flex justify-between bg-base-200 p-1 rounded">
                      <span>{formatDateTime(p.paidAt)}</span>
                      <span className="text-success font-semibold">{formatPeso(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Payment Amount (₱)</span></label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="input input-bordered input-lg text-center" placeholder="0.00" />
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

      {showAddDebtModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">📋 Add Debt</h3>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Customer *</span></label>
                <select value={debtForm.customer} onChange={e => setDebtForm({...debtForm, customer: e.target.value})}
                  className="select select-bordered">
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Description / What was purchased?</span></label>
                <input type="text" value={debtForm.description}
                  onChange={e => setDebtForm({...debtForm, description: e.target.value})}
                  className="input input-bordered" placeholder="e.g. 2 bigas, 1 sardinas" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Total Amount (₱) *</span></label>
                <input type="number" value={debtForm.totalAmount}
                  onChange={e => setDebtForm({...debtForm, totalAmount: e.target.value})}
                  className="input input-bordered input-lg text-center" placeholder="0.00" />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowAddDebtModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={addManualDebt} className="btn btn-warning"
                disabled={!debtForm.customer || !debtForm.totalAmount}>
                📋 Record Debt
              </button>
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

export default StaffDashboard;