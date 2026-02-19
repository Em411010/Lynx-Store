import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Debt from '../models/Debt.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected\n');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const verifyData = async () => {
  try {
    await connectDB();

    console.log('📊 DATABASE VERIFICATION REPORT\n');
    console.log('='.repeat(60));

    // Users
    const adminCount = await User.countDocuments({ role: 'admin' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const customerCount = await User.countDocuments({ role: 'customer' });
    console.log('\n👥 USERS:');
    console.log(`   Admin:     ${adminCount}`);
    console.log(`   Staff:     ${staffCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Total:     ${adminCount + staffCount + customerCount}`);

    // Categories and Products
    const categoryCount = await Category.countDocuments();
    const productCount = await Product.countDocuments();
    console.log('\n📦 PRODUCTS:');
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Products:   ${productCount}`);
    
    const categories = await Category.find().lean();
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat._id });
      console.log(`      • ${cat.name}: ${count} products`);
    }

    // Transactions
    const transactionCount = await Transaction.countDocuments();
    const cashTransactions = await Transaction.countDocuments({ paymentMethod: 'cash' });
    const creditTransactions = await Transaction.countDocuments({ paymentMethod: 'credit' });
    const splitTransactions = await Transaction.countDocuments({ paymentMethod: 'split' });
    
    const totalSales = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const oldestTransaction = await Transaction.findOne().sort({ createdAt: 1 });
    const newestTransaction = await Transaction.findOne().sort({ createdAt: -1 });
    
    console.log('\n💰 TRANSACTIONS:');
    console.log(`   Total:     ${transactionCount}`);
    console.log(`   Cash:      ${cashTransactions}`);
    console.log(`   Credit:    ${creditTransactions}`);
    console.log(`   Split:     ${splitTransactions}`);
    console.log(`   Total Sales: ₱${totalSales[0]?.total.toFixed(2) || 0}`);
    console.log(`   Date Range: ${oldestTransaction?.createdAt.toLocaleDateString()} - ${newestTransaction?.createdAt.toLocaleDateString()}`);

    // Monthly sales
    const monthlySales = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('\n📅 MONTHLY SALES:');
    monthlySales.forEach(month => {
      const monthName = new Date(month._id.year, month._id.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
      console.log(`   ${monthName}: ₱${month.total.toFixed(2)} (${month.count} transactions)`);
    });

    // Debts
    const debtCount = await Debt.countDocuments();
    const paidDebts = await Debt.countDocuments({ status: 'paid' });
    const partialDebts = await Debt.countDocuments({ status: 'partial' });
    const pendingDebts = await Debt.countDocuments({ status: 'pending' });
    
    const debtStats = await Debt.aggregate([
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }
        }
      }
    ]);

    console.log('\n💳 DEBTS:');
    console.log(`   Total Debts:    ${debtCount}`);
    console.log(`   Paid:           ${paidDebts}`);
    console.log(`   Partial:        ${partialDebts}`);
    console.log(`   Pending:        ${pendingDebts}`);
    if (debtStats[0]) {
      console.log(`   Total Amount:   ₱${debtStats[0].totalDebt.toFixed(2)}`);
      console.log(`   Total Paid:     ₱${debtStats[0].totalPaid.toFixed(2)}`);
      console.log(`   Remaining:      ₱${debtStats[0].totalRemaining.toFixed(2)}`);
    }

    // Top customers by purchases
    const topCustomers = await Transaction.aggregate([
      { $match: { customer: { $ne: null } } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]);

    console.log('\n🏆 TOP 5 CUSTOMERS:');
    topCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.customer.firstName} ${customer.customer.lastName}`);
      console.log(`      Spent: ₱${customer.totalSpent.toFixed(2)} (${customer.transactionCount} transactions)`);
    });

    // Customer debts
    const customersWithDebts = await Debt.aggregate([
      { $match: { status: { $in: ['pending', 'partial'] } } },
      {
        $group: {
          _id: '$customer',
          totalDebt: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          remaining: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          debtCount: { $sum: 1 }
        }
      },
      { $sort: { remaining: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]);

    console.log('\n📋 CUSTOMERS WITH OUTSTANDING DEBTS:');
    if (customersWithDebts.length === 0) {
      console.log('   No outstanding debts');
    } else {
      customersWithDebts.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.customer.firstName} ${customer.customer.lastName}`);
        console.log(`      Debt: ₱${customer.totalDebt.toFixed(2)} | Paid: ₱${customer.totalPaid.toFixed(2)} | Remaining: ₱${customer.remaining.toFixed(2)}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verification complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verifying data:', error);
    process.exit(1);
  }
};

verifyData();
