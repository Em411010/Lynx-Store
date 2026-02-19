import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Debt from '../models/Debt.js';
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
    const todayCredit = todaySales.filter(t => t.paymentMethod === 'credit').reduce((sum, t) => sum + t.totalAmount, 0);

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

    // Debt stats
    const pendingDebts = await Debt.find({ status: { $ne: 'paid' } });
    const totalOutstandingDebt = pendingDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
    const totalCustomersWithDebt = new Set(pendingDebts.map(d => d.customer?.toString())).size;

    // Customer count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    res.json({
      today: {
        totalSales: todaySales.length,
        revenue: todayRevenue,
        cashSales: todayCash,
        creditSales: todayCredit
      },
      inventory: {
        totalProducts,
        lowStockCount,
        nearExpiryCount
      },
      debts: {
        totalOutstanding: totalOutstandingDebt,
        customersWithDebt: totalCustomersWithDebt,
        pendingCount: pendingDebts.length
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

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('staff', 'firstName lastName');

    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const creditTransactions = transactions.filter(t => t.paymentMethod === 'credit');
    const splitTransactions = transactions.filter(t => t.paymentMethod === 'split');
    
    const cashTotal = cashTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const creditTotal = creditTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const splitTotal = splitTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    const cashCount = cashTransactions.length;
    const creditCount = creditTransactions.length;
    const splitCount = splitTransactions.length;

    // Calculate total items sold
    const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Calculate average transaction value
    const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    // Daily breakdown
    const dailyBreakdown = {};
    transactions.forEach(t => {
      const dateKey = t.createdAt.toISOString().slice(0, 10);
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { date: dateKey, revenue: 0, count: 0 };
      }
      dailyBreakdown[dateKey].revenue += t.totalAmount;
      dailyBreakdown[dateKey].count += 1;
    });

    res.json({
      totalRevenue,
      totalTransactions: transactions.length,
      cashTotal,
      creditTotal,
      splitTotal,
      cashCount,
      creditCount,
      splitCount,
      totalItems,
      averageTransaction,
      dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
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

// @route   GET /api/reports/debt-aging
// @desc    Get debt aging report
// @access  Private (admin)
router.get('/debt-aging', protect, authorize('admin'), async (req, res) => {
  try {
    const debts = await Debt.find({ status: { $ne: 'paid' } })
      .populate('customer', 'firstName lastName');

    const aging = {
      '0-30 araw': { count: 0, total: 0, debts: [] },
      '31-60 araw': { count: 0, total: 0, debts: [] },
      '60+ araw': { count: 0, total: 0, debts: [] }
    };

    debts.forEach(d => {
      const days = Math.ceil((new Date() - d.createdAt) / (1000 * 60 * 60 * 24));
      let category;
      if (days <= 30) category = '0-30 araw';
      else if (days <= 60) category = '31-60 araw';
      else category = '60+ araw';

      const remaining = d.totalAmount - d.paidAmount;
      aging[category].count += 1;
      aging[category].total += remaining;
      aging[category].debts.push({
        _id: d._id,
        customer: d.customer,
        totalAmount: d.totalAmount,
        paidAmount: d.paidAmount,
        remaining,
        days,
        createdAt: d.createdAt
      });
    });

    res.json(aging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
