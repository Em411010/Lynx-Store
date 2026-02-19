import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Debt from '../models/Debt.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get transactions with filters
// @access  Private (admin, staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { date, startDate, endDate, paymentMethod, staff: staffId, receipt } = req.query;
    let query = {};

    // If searching by receipt number, skip date filter
    if (receipt) {
      query.receiptNumber = { $regex: receipt, $options: 'i' };
    } else if (date) {
      const d = new Date(date);
      query.createdAt = {
        $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        $lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      };
    } else if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (staffId) query.staff = staffId;

    // If staff, only show their own transactions
    if (req.user.role === 'staff') {
      query.staff = req.user._id;
    }

    const transactions = await Transaction.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('staff', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transactions/my
// @desc    Get customer's own transactions
// @access  Private (customer)
router.get('/my', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ customer: req.user._id })
      .populate('staff', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('staff', 'firstName lastName');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/transactions
// @desc    Create a sale transaction
// @access  Private (admin, staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { items, customer, customerName, paymentMethod, cashReceived, creditAmount, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Walang items sa cart' });
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productName}` });
      }
      if (product.stock < item.quantity && !item.isTingi) {
        return res.status(400).json({ message: `Kulang ang stock ng ${product.name}. Available: ${product.stock}` });
      }

      const subtotal = item.unitPrice * item.quantity;
      totalAmount += subtotal;
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
        isTingi: item.isTingi || false
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      customer: customer || null,
      customerName: customerName || 'Walk-in',
      staff: req.user._id,
      items: processedItems,
      totalAmount,
      paymentMethod,
      cashReceived: cashReceived || 0,
      changeAmount: paymentMethod === 'cash' ? Math.max(0, (cashReceived || 0) - totalAmount) : 0,
      creditAmount: creditAmount || 0,
      notes
    });

    // Deduct stock for each item
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      if (item.isTingi) {
        // For tingi, deduct from pack if quantity reaches tingiPerPack
        // Simple approach: don't deduct whole pack stock for tingi sales
        // Track tingi separately or deduct fractionally
        product.stock = Math.max(0, product.stock - (item.quantity / (product.tingiPerPack || 1)));
      } else {
        product.stock = Math.max(0, product.stock - item.quantity);
      }
      await product.save();
    }

    // If credit/utang, create debt record
    if (paymentMethod === 'credit' || (paymentMethod === 'split' && creditAmount > 0)) {
      const debtAmount = paymentMethod === 'credit' ? totalAmount : creditAmount;
      await Debt.create({
        customer,
        transaction: transaction._id,
        items: processedItems.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal
        })),
        totalAmount: debtAmount,
        createdBy: req.user._id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      });
    }

    await ActivityLog.log(
      req.user._id,
      'Nag-process ng benta',
      `Receipt: ${transaction.receiptNumber} - ₱${totalAmount.toFixed(2)} (${paymentMethod})`,
      'sale'
    );

    const populated = await transaction.populate([
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'staff', select: 'firstName lastName' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
