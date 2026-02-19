import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/customers
// @desc    Get all customers (for debt/transaction selection)
// @access  Private (admin, staff)
router.get('/customers', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'customer' };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(query).select('-password').sort({ firstName: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (admin)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin can change role, credit limit, etc.)
// @access  Private (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, address, creditLimit } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (creditLimit !== undefined) user.creditLimit = creditLimit;

    await user.save();

    await ActivityLog.log(req.user._id, 'Nag-update ng user', `${user.firstName} ${user.lastName} (${user.role})`, 'user');

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      creditLimit: user.creditLimit
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/users/create-staff
// @desc    Create a staff account
// @access  Private (admin)
router.post('/create-staff', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'staff',
      phone: phone || ''
    });

    await ActivityLog.log(req.user._id, 'Gumawa ng staff account', `${firstName} ${lastName}`, 'user');

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Hindi mo pwedeng i-delete ang sarili mo' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.log(req.user._id, 'Nag-delete ng user', `${user.firstName} ${user.lastName}`, 'user');

    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/activity-logs/all
// @desc    Get activity logs
// @access  Private (admin)
router.get('/activity-logs/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { category, limit: limitParam } = req.query;
    let query = {};
    if (category) query.category = category;

    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limitParam) || 100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
