import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard overview stats
// @access  Private (admin, staff)
router.get('/dashboard', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Today's sales
    const todaySales = await Transaction.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    const todayRevenue = todaySales.reduce((sum, t) => sum + t.totalAmount, 0);
    const todayCash = todaySales.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.totalAmount, 0);

    // Product stats
    const totalProducts = await Product.countDocuments({ isActive: true });
    const allProducts = await Product.find({ isActive: true });
    const lowStockCount = allProducts.filter(p => p.stock <= p.reorderLevel).length;
    const nearExpiryCount = allProducts.filter(p => {
      if (!p.expiryDate) return false;
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return p.expiryDate <= thirtyDays;
    }).length;

    // Customer count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    res.json({
      today: {
        totalSales: todaySales.length,
        revenue: todayRevenue,
        cashSales: todayCash
      },
      inventory: {
        totalProducts,
        lowStockCount,
        nearExpiryCount
      },
      customers: {
        total: totalCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales report
// @access  Private (admin)
router.get('/sales', protect, authorize('admin'), async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    } else {
      end = new Date();
      start = new Date();
      if (period === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (period === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (period === 'year') {
        start.setFullYear(start.getFullYear() - 1);
      } else {
        // Default: this month
        start.setMonth(start.getMonth() - 1);
      }
    }

    const { staffId, productName } = req.query;
    const query = { createdAt: { $gte: start, $lte: end } };
    if (staffId) query.staff = staffId;

    let transactions = await Transaction.find(query).populate('staff', 'firstName lastName');

    // Filter by product name if provided
    if (productName) {
      transactions = transactions.filter(t =>
        t.items.some(item => item.productName.toLowerCase().includes(productName.toLowerCase()))
      );
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const cashTotal = cashTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashCount = cashTransactions.length;
    const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    // Daily breakdown
    const dailyBreakdown = {};
    transactions.forEach(t => {
      const dateKey = t.createdAt.toISOString().slice(0, 10);
      if (!dailyBreakdown[dateKey]) dailyBreakdown[dateKey] = { date: dateKey, revenue: 0, count: 0 };
      dailyBreakdown[dateKey].revenue += t.totalAmount;
      dailyBreakdown[dateKey].count += 1;
    });

    // Time-of-day breakdown
    const timeOfDay = { morning: { label: '🌅 Morning', range: '6am–12pm', revenue: 0, count: 0 }, afternoon: { label: '☀️ Afternoon', range: '12pm–6pm', revenue: 0, count: 0 }, evening: { label: '🌙 Evening', range: '6pm–12am', revenue: 0, count: 0 }, midnight: { label: '🦇 Midnight', range: '12am–6am', revenue: 0, count: 0 } };
    transactions.forEach(t => {
      const h = new Date(t.createdAt).getHours();
      const key = h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : h >= 18 ? 'evening' : 'midnight';
      timeOfDay[key].revenue += t.totalAmount;
      timeOfDay[key].count += 1;
    });

    res.json({
      totalRevenue, totalTransactions: transactions.length,
      cashTotal, cashCount, totalItems, averageTransaction,
      dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
      timeOfDay: Object.values(timeOfDay),
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/best-sellers
// @desc    Get best selling products
// @access  Private (admin)
router.get('/best-sellers', protect, authorize('admin'), async (req, res) => {
  try {
    const { period } = req.query;
    let start = new Date();
    if (period === 'week') start.setDate(start.getDate() - 7);
    else if (period === 'month') start.setMonth(start.getMonth() - 1);
    else start.setMonth(start.getMonth() - 1); // default month

    const transactions = await Transaction.find({ createdAt: { $gte: start } });

    const productSales = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        const key = item.productName;
        if (!productSales[key]) {
          productSales[key] = { name: key, totalQuantity: 0, totalRevenue: 0 };
        }
        productSales[key].totalQuantity += item.quantity;
        productSales[key].totalRevenue += item.subtotal;
      });
    });

    const sorted = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 20);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/category-sales
// @desc    Get sales by category
// @access  Private (admin)
router.get('/category-sales', protect, authorize('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const products = await Product.find().populate('category', 'name icon');
    const productCategoryMap = {};
    products.forEach(p => {
      productCategoryMap[p.name] = p.category ? { name: p.category.name, icon: p.category.icon } : { name: 'Uncategorized', icon: '📦' };
    });

    const categorySales = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        const cat = productCategoryMap[item.productName] || { name: 'Iba pa', icon: '📦' };
        if (!categorySales[cat.name]) {
          categorySales[cat.name] = { category: cat.name, icon: cat.icon, totalRevenue: 0, totalQuantity: 0 };
        }
        categorySales[cat.name].totalRevenue += item.subtotal;
        categorySales[cat.name].totalQuantity += item.quantity;
      });
    });

    res.json(Object.values(categorySales).sort((a, b) => b.totalRevenue - a.totalRevenue));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/staff-performance
// @desc    Get per-staff transaction/revenue breakdown
// @access  Private (admin)
router.get('/staff-performance', protect, authorize('admin'), async (req, res) => {
  try {
    const { period } = req.query;
    const start = new Date();
    if (period === 'week') start.setDate(start.getDate() - 7);
    else start.setMonth(start.getMonth() - 1);

    const transactions = await Transaction.find({ createdAt: { $gte: start } })
      .populate('staff', 'firstName lastName role');

    const staffMap = {};
    transactions.forEach(t => {
      const staffId = t.staff?._id?.toString() || 'unknown';
      const name = t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : 'Unknown';
      if (!staffMap[staffId]) staffMap[staffId] = { name, transactions: 0, revenue: 0, items: 0 };
      staffMap[staffId].transactions += 1;
      staffMap[staffId].revenue += t.totalAmount;
      staffMap[staffId].items += t.items.reduce((s, i) => s + i.quantity, 0);
    });

    res.json(Object.values(staffMap).sort((a, b) => b.revenue - a.revenue));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// @route   GET /api/reports/monthly-comparison
// @desc    This month vs last month
// @access  Private (admin)
router.get('/monthly-comparison', protect, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      Transaction.find({ createdAt: { $gte: thisMonthStart } }),
      Transaction.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const calc = (txs) => ({
      revenue: txs.reduce((s, t) => s + t.totalAmount, 0),
      orders: txs.length,
      avgOrder: txs.length ? txs.reduce((s, t) => s + t.totalAmount, 0) / txs.length : 0,
      items: txs.reduce((s, t) => s + t.items.reduce((is, i) => is + i.quantity, 0), 0)
    });

    const thisData = calc(thisMonth);
    const lastData = calc(lastMonth);

    const pct = (a, b) => b === 0 ? null : (((a - b) / b) * 100).toFixed(1);

    res.json({
      thisMonth: thisData,
      lastMonth: lastData,
      changes: {
        revenue: pct(thisData.revenue, lastData.revenue),
        orders: pct(thisData.orders, lastData.orders),
        avgOrder: pct(thisData.avgOrder, lastData.avgOrder),
        items: pct(thisData.items, lastData.items)
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// @route   GET /api/reports/inventory-report
// @desc    Low stock, out of stock, expiry alerts, top stocked
// @access  Private (admin)
router.get('/inventory-report', protect, authorize('admin'), async (req, res) => {
  try {
    const allProducts = await Product.find({ isActive: true }).populate('category', 'name icon');
    const now = new Date();
    const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);

    const outOfStock = allProducts.filter(p => p.stock === 0);
    const lowStock = allProducts.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
    const nearExpiry = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) <= thirtyDays && new Date(p.expiryDate) >= now);
    const expired = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) < now);
    const wellStocked = allProducts.filter(p => p.stock > p.reorderLevel * 3).sort((a, b) => b.stock - a.stock).slice(0, 10);

    // Total inventory value
    const inventoryValue = allProducts.reduce((s, p) => s + (p.stock * (p.costPrice || p.unitPrice)), 0);

    res.json({
      summary: {
        total: allProducts.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        nearExpiry: nearExpiry.length,
        expired: expired.length,
        inventoryValue
      },
      outOfStock: outOfStock.map(p => ({ _id: p._id, name: p.name, category: p.category?.name, stock: Math.floor(p.stock), price: p.unitPrice, reorderLevel: p.reorderLevel })),
      lowStock: lowStock.map(p => ({ _id: p._id, name: p.name, category: p.category?.name, stock: Math.floor(p.stock), price: p.unitPrice, reorderLevel: p.reorderLevel })),
      nearExpiry: nearExpiry.map(p => ({ _id: p._id, name: p.name, category: p.category?.name, stock: Math.floor(p.stock), expiryDate: p.expiryDate })),
      expired: expired.map(p => ({ _id: p._id, name: p.name, category: p.category?.name, stock: Math.floor(p.stock), expiryDate: p.expiryDate })),
      wellStocked
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// @route   GET /api/reports/staff-list
// @desc    Get staff/admin users for filter dropdown
// @access  Private (admin)
router.get('/staff-list', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } }).select('firstName lastName role');
    res.json(staff);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
