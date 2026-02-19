import express from 'express';
import Ticket from '../models/Ticket.js';
import { protect, authorize } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Get all tickets (admin, staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('customer', 'firstName lastName email')
      .populate('respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my tickets (customer)
router.get('/my', protect, authorize('customer'), async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .populate('respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('respondedBy', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && ticket.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create ticket (customer)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const ticket = await Ticket.create({
      customer: req.user._id,
      subject,
      description,
      priority: priority || 'medium'
    });

    await ActivityLog.log(req.user._id, 'Created support ticket', `"${subject}"`, 'system');

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customer', 'firstName lastName email');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket status (admin, staff)
router.put('/:id/status', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customer', 'firstName lastName email')
     .populate('respondedBy', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ActivityLog.log(req.user._id, 'Updated ticket status', `Ticket #${ticket._id.toString().slice(-6)} → ${status}`, 'system');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to ticket (admin, staff)
router.put('/:id/respond', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { response, status } = req.body;

    if (!response) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const updateData = {
      response,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    if (status) {
      updateData.status = status;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customer', 'firstName lastName email')
     .populate('respondedBy', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ActivityLog.log(req.user._id, 'Responded to ticket', `Ticket #${ticket._id.toString().slice(-6)}`, 'system');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete ticket (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
