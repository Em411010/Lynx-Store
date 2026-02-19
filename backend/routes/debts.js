import express from 'express';
import Debt from '../models/Debt.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/debts
// @desc    Get all debts with filters
// @access  Private (admin, staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status, customer: customerId, aging, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (customerId) query.customer = customerId;

    let debts = await Debt.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName')
      .populate('payments.receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Filter by customer name search if specified
    if (search) {
      const searchLower = search.toLowerCase();
      debts = debts.filter(d => {
        if (!d.customer) return false;
        const fullName = `${d.customer.firstName} ${d.customer.lastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    // Filter by aging if specified
    if (aging) {
      debts = debts.filter(d => {
        const days = Math.ceil((new Date() - d.createdAt) / (1000 * 60 * 60 * 24));
        if (aging === '0-30') return days <= 30;
        if (aging === '31-60') return days > 30 && days <= 60;
        if (aging === '60+') return days > 60;
        return true;
      });
    }

    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/debts/my
// @desc    Get customer's own debts
// @access  Private (customer)
router.get('/my', protect, async (req, res) => {
  try {
    const debts = await Debt.find({ customer: req.user._id })
      .populate('createdBy', 'firstName lastName')
      .populate('payments.receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/debts/summary
// @desc    Get debt summary per customer
// @access  Private (admin, staff)
router.get('/summary', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const debts = await Debt.find({ status: { $ne: 'paid' } })
      .populate('customer', 'firstName lastName email phone creditLimit');

    // Group by customer
    const customerDebts = {};
    debts.forEach(debt => {
      if (!debt.customer) return;
      const id = debt.customer._id.toString();
      if (!customerDebts[id]) {
        customerDebts[id] = {
          customer: debt.customer,
          totalDebt: 0,
          totalPaid: 0,
          debtCount: 0,
          oldestDebt: debt.createdAt
        };
      }
      customerDebts[id].totalDebt += debt.totalAmount;
      customerDebts[id].totalPaid += debt.paidAmount;
      customerDebts[id].debtCount += 1;
      if (debt.createdAt < customerDebts[id].oldestDebt) {
        customerDebts[id].oldestDebt = debt.createdAt;
      }
    });

    const summary = Object.values(customerDebts).map(cd => ({
      ...cd,
      remainingBalance: cd.totalDebt - cd.totalPaid
    }));

    summary.sort((a, b) => b.remainingBalance - a.remainingBalance);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/debts/customer/:customerId
// @desc    Get all debts for a specific customer
// @access  Private
router.get('/customer/:customerId', protect, async (req, res) => {
  try {
    // Customers can only view their own
    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.customerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const debts = await Debt.find({ customer: req.params.customerId })
      .populate('createdBy', 'firstName lastName')
      .populate('payments.receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);

    res.json({
      debts,
      totalDebt,
      totalPaid,
      remainingBalance: totalDebt - totalPaid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/debts
// @desc    Create a debt record (manual entry)
// @access  Private (admin, staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { customer, items, totalAmount, description, dueDate, notes } = req.body;

    // Check customer credit limit
    const customerUser = await User.findById(customer);
    if (!customerUser) return res.status(404).json({ message: 'Customer not found' });

    if (customerUser.creditLimit > 0) {
      const existingDebts = await Debt.find({ customer, status: { $ne: 'paid' } });
      const currentDebt = existingDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
      if (currentDebt + totalAmount > customerUser.creditLimit) {
        return res.status(400).json({
          message: `Lagpas na sa credit limit ni ${customerUser.firstName}. Limit: ₱${customerUser.creditLimit}, Current: ₱${currentDebt.toFixed(2)}`
        });
      }
    }

    const debt = await Debt.create({
      customer,
      items: items || [],
      description: description || '',
      totalAmount,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes,
      createdBy: req.user._id
    });

    await ActivityLog.log(
      req.user._id,
      'Nagdagdag ng utang',
      `${customerUser.firstName} ${customerUser.lastName} - ₱${totalAmount.toFixed(2)}`,
      'debt'
    );

    const populated = await debt.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/debts/:id/pay
// @desc    Record a payment for a debt
// @access  Private (admin, staff)
router.post('/:id/pay', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    const debt = await Debt.findById(req.params.id).populate('customer', 'firstName lastName');

    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    if (debt.status === 'paid') return res.status(400).json({ message: 'Bayad na itong utang' });

    const remaining = debt.totalAmount - debt.paidAmount;
    const paymentAmount = Math.min(amount, remaining);

    debt.payments.push({
      amount: paymentAmount,
      paidAt: new Date(),
      receivedBy: req.user._id,
      method: method || 'cash',
      notes: notes || ''
    });

    debt.paidAmount += paymentAmount;
    debt.updateStatus();
    await debt.save();

    await ActivityLog.log(
      req.user._id,
      'Tumanggap ng bayad',
      `${debt.customer.firstName} ${debt.customer.lastName} - ₱${paymentAmount.toFixed(2)} (${debt.status === 'paid' ? 'FULLY PAID' : 'partial'})`,
      'payment'
    );

    const populated = await debt.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'payments.receivedBy', select: 'firstName lastName' }
    ]);

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/debts/:id
// @desc    Delete a debt record
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    await ActivityLog.log(req.user._id, 'Nag-delete ng utang record', `₱${debt.totalAmount}`, 'debt');

    res.json({ message: 'Debt record removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
