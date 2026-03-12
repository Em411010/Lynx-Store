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
    
    const totalSales = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const oldestTransaction = await Transaction.findOne().sort({ createdAt: 1 });
    const newestTransaction = await Transaction.findOne().sort({ createdAt: -1 });
    
    console.log('\n💰 TRANSACTIONS:');
    console.log(`   Total:     ${transactionCount}`);
    console.log(`   Total Sales: ₱${totalSales[0]?.total.toFixed(2) || 0}`);
    console.log(`   Date Range: ${oldestTransaction?.createdAt.toLocaleDateString()} - ${newestTransaction?.createdAt.toLocaleDateString()}`);;

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

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verification complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verifying data:', error);
    process.exit(1);
  }
};

verifyData();
