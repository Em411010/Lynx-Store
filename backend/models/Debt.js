import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  method: {
    type: String,
    default: 'cash'
  },
  notes: {
    type: String,
    default: ''
  }
});

const debtItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const debtSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  items: [debtItemSchema],
  description: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payments: [paymentSchema]
}, {
  timestamps: true
});

// Virtual for remaining balance
debtSchema.virtual('remainingBalance').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Virtual for days overdue
debtSchema.virtual('daysOverdue').get(function() {
  if (!this.dueDate || this.status === 'paid') return 0;
  const now = new Date();
  const diff = now - this.dueDate;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});

// Virtual for aging category
debtSchema.virtual('agingCategory').get(function() {
  const daysSinceCreated = Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
  if (daysSinceCreated <= 30) return '0-30 araw';
  if (daysSinceCreated <= 60) return '31-60 araw';
  return '60+ araw';
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

// Update status based on payments
debtSchema.methods.updateStatus = function() {
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
};

const Debt = mongoose.model('Debt', debtSchema);

export default Debt;
