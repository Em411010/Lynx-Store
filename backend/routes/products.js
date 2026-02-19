import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, brand, search, lowStock, nearExpiry, active } = req.query;
    let query = {};

    if (category) query.category = category;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (active !== undefined) query.isActive = active === 'true';

    let products = await Product.find(query)
      .populate('category', 'name icon')
      .sort({ name: 1 });

    // Filter low stock in memory (uses virtual)
    if (lowStock === 'true') {
      products = products.filter(p => p.stock <= p.reorderLevel);
    }

    // Filter near expiry in memory
    if (nearExpiry === 'true') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      products = products.filter(p => p.expiryDate && p.expiryDate <= thirtyDays);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name icon');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private (admin, staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    const populated = await product.populate('category', 'name icon');

    await ActivityLog.log(req.user._id, 'Nagdagdag ng produkto', `${product.name} - ${product.stock} ${product.unit}`, 'inventory');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (admin, staff)
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name icon');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    await ActivityLog.log(req.user._id, 'Nag-update ng produkto', `${product.name}`, 'inventory');

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await ActivityLog.log(req.user._id, 'Nag-delete ng produkto', `${product.name}`, 'inventory');

    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/products/:id/adjust-stock
// @desc    Adjust stock (add/remove with reason)
// @access  Private (admin, staff)
router.put('/:id/adjust-stock', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const oldStock = product.stock;
    product.stock = Math.max(0, product.stock + adjustment);
    await product.save();

    const direction = adjustment > 0 ? 'Nagdagdag' : 'Nagbawas';
    await ActivityLog.log(
      req.user._id,
      `${direction} ng stock`,
      `${product.name}: ${oldStock} → ${product.stock} (${reason || 'No reason'})`,
      'inventory'
    );

    const populated = await product.populate('category', 'name icon');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/products/alerts/low-stock
// @desc    Get low stock products
// @access  Private (admin, staff)
router.get('/alerts/low-stock', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name icon');
    const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel);
    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/alerts/near-expiry
// @desc    Get near expiry products
// @access  Private (admin, staff)
router.get('/alerts/near-expiry', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const products = await Product.find({
      isActive: true,
      expiryDate: { $ne: null, $lte: thirtyDays }
    }).populate('category', 'name icon');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
