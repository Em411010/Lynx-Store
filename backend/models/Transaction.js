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
    enum: ['cash', 'credit', 'split'],
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
  creditAmount: {
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
    const count = await mongoose.model('Transaction').countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    this.receiptNumber = `RCT-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
