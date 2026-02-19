import express from 'express';
import Feedback from '../models/Feedback.js';
import { protect, authorize } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Get all feedback (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { isRead } = req.query;
    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const feedback = await Feedback.find(filter)
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my feedback (customer)
router.get('/my', protect, authorize('customer'), async (req, res) => {
  try {
    const feedback = await Feedback.find({ customer: req.user._id })
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create feedback (customer)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const feedback = await Feedback.create({
      customer: req.user._id,
      rating,
      comment
    });

    await ActivityLog.log(req.user._id, 'Submitted feedback', `Rating: ${rating} stars`, 'system');

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('customer', 'firstName lastName email');

    res.status(201).json(populatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark feedback as read (admin)
router.put('/:id/mark-read', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('customer', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete feedback (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
