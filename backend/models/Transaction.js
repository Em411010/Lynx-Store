import mongoose from 'mongoose';

const transactionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
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
  },
  isTingi: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    default: 'Walk-in'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [transactionItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash'],
    required: true
  },
  cashReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  changeAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto generate receipt number before saving
transactionSchema.pre('validate', async function() {
  if (!this.receiptNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const prefix = `RCT-${dateStr}-`;
    // Find the last receipt for today to avoid gaps and race-condition collisions
    const last = await mongoose.model('Transaction')
      .findOne({ receiptNumber: { $regex: `^${prefix}` } })
      .sort({ receiptNumber: -1 })
      .select('receiptNumber')
      .lean();
    const lastNum = last ? parseInt(last.receiptNumber.slice(prefix.length), 10) : 0;
    this.receiptNumber = `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
