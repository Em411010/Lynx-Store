import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Debt from '../models/Debt.js';

// Utility function to generate random date within last 6 months
const randomDateWithinMonths = (monthsBack) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - monthsBack);
  const randomTime = startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime());
  return new Date(randomTime);
};

// Utility function to generate random date between two dates
const randomDateBetween = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Seed data
const categories = [
  { name: 'Beverages', description: 'Soft drinks, juice, water, and other beverages', icon: '🥤' },
  { name: 'Snacks', description: 'Chips, biscuits, candies, and other snacks', icon: '🍿' },
  { name: 'Instant Noodles', description: 'Instant pancit and noodles', icon: '🍜' },
  { name: 'Condiments & Sauces', description: 'Soy sauce, vinegar, fish sauce, and cooking essentials', icon: '🧂' },
  { name: 'Personal Care', description: 'Soap, shampoo, toothpaste, and hygiene products', icon: '🧴' },
  { name: 'Household Items', description: 'Detergent, cleaning supplies, and household necessities', icon: '🧽' }
];

const products = {
  'Beverages': [
    { name: 'Coca-Cola 1.5L', barcode: '4800888100011', brand: 'Coca-Cola', unitPrice: 95, costPrice: 75, tingiPrice: 12, tingiPerPack: 8, tingiUnit: 'bottle', stock: 48, reorderLevel: 20 },
    { name: 'Sprite 1.5L', barcode: '4800888100028', brand: 'Sprite', unitPrice: 95, costPrice: 75, tingiPrice: 12, tingiPerPack: 8, tingiUnit: 'bottle', stock: 40, reorderLevel: 20 },
    { name: 'Royal 1.5L', barcode: '4800888100035', brand: 'Royal', unitPrice: 95, costPrice: 75, tingiPrice: 12, tingiPerPack: 8, tingiUnit: 'bottle', stock: 32, reorderLevel: 20 },
    { name: 'Zesto Apple 200ml', barcode: '4800016122651', brand: 'Zesto', unitPrice: 120, costPrice: 95, tingiPrice: 10, tingiPerPack: 12, tingiUnit: 'pack', stock: 60, reorderLevel: 24 },
    { name: 'Del Monte Pineapple Juice 240ml', barcode: '4800024511037', brand: 'Del Monte', unitPrice: 150, costPrice: 120, tingiPrice: 13, tingiPerPack: 12, tingiUnit: 'can', stock: 36, reorderLevel: 24 },
    { name: 'C2 Apple 1L', barcode: '4800888170071', brand: 'C2', unitPrice: 150, costPrice: 120, tingiPrice: 25, tingiPerPack: 6, tingiUnit: 'bottle', stock: 30, reorderLevel: 18 },
    { name: 'Gatorade Blue 500ml', barcode: '4800888139733', brand: 'Gatorade', unitPrice: 180, costPrice: 145, tingiPrice: 30, tingiPerPack: 6, tingiUnit: 'bottle', stock: 24, reorderLevel: 12 },
    { name: 'Nature Spring Water 350ml', barcode: '4809010165596', brand: 'Nature Spring', unitPrice: 60, costPrice: 45, tingiPrice: 5, tingiPerPack: 12, tingiUnit: 'bottle', stock: 72, reorderLevel: 36 },
    { name: 'Minute Maid Orange 1L', barcode: '4800888170385', brand: 'Minute Maid', unitPrice: 140, costPrice: 110, tingiPrice: 24, tingiPerPack: 6, tingiUnit: 'bottle', stock: 30, reorderLevel: 18 },
    { name: 'Pepsi 1.5L', barcode: '4800888135735', brand: 'Pepsi', unitPrice: 95, costPrice: 75, tingiPrice: 12, tingiPerPack: 8, tingiUnit: 'bottle', stock: 40, reorderLevel: 20 }
  ],
  'Snacks': [
    { name: 'Chippy BBQ 110g', barcode: '4800194108409', brand: 'Oishi', unitPrice: 36, costPrice: 28, tingiPrice: 6, tingiPerPack: 6, tingiUnit: 'pack', stock: 48, reorderLevel: 24 },
    { name: 'Piattos Cheese 85g', barcode: '4800194108508', brand: 'Jack n Jill', unitPrice: 42, costPrice: 32, tingiPrice: 7, tingiPerPack: 6, tingiUnit: 'pack', stock: 54, reorderLevel: 24 },
    { name: 'Nova Multigrain 78g', barcode: '4800194104944', brand: 'Jack n Jill', unitPrice: 40, costPrice: 30, tingiPrice: 7, tingiPerPack: 6, tingiUnit: 'pack', stock: 42, reorderLevel: 24 },
    { name: 'Roller Coaster Plain 85g', barcode: '4800194106481', brand: 'Oishi', unitPrice: 38, costPrice: 29, tingiPrice: 6.5, tingiPerPack: 6, tingiUnit: 'pack', stock: 36, reorderLevel: 24 },
    { name: 'Skyflakes Crackers 250g', barcode: '4800016100291', brand: 'Monde', unitPrice: 55, costPrice: 42, tingiPrice: 2, tingiPerPack: 30, tingiUnit: 'piece', stock: 60, reorderLevel: 30 },
    { name: 'Cream-O Vanilla 132g', barcode: '4800066640014', brand: 'Monde', unitPrice: 32, costPrice: 25, tingiPrice: 1, tingiPerPack: 36, tingiUnit: 'piece', stock: 72, reorderLevel: 36 },
    { name: 'Magic Flakes 38g', barcode: '4800066640151', brand: 'Rebisco', unitPrice: 24, costPrice: 18, tingiPrice: 4, tingiPerPack: 6, tingiUnit: 'pack', stock: 54, reorderLevel: 30 },
    { name: 'Clover Chips BBQ 85g', barcode: '4800016101212', brand: 'Leslie', unitPrice: 35, costPrice: 27, tingiPrice: 6, tingiPerPack: 6, tingiUnit: 'pack', stock: 48, reorderLevel: 24 },
    { name: 'Candy (assorted) per piece', barcode: '9999999999991', brand: 'Various', unitPrice: 2, costPrice: 1.5, tingiPrice: 1, tingiPerPack: 1, tingiUnit: 'piece', stock: 500, reorderLevel: 200 },
    { name: 'Choco Mucho Original 33g', barcode: '4800016100703', brand: 'Monde', unitPrice: 20, costPrice: 15, tingiPrice: 3.5, tingiPerPack: 6, tingiUnit: 'bar', stock: 60, reorderLevel: 30 }
  ],
  'Instant Noodles': [
    { name: 'Lucky Me Pancit Canton Original 60g', barcode: '4800016106101', brand: 'Lucky Me', unitPrice: 12, costPrice: 9.5, tingiPrice: 12, tingiPerPack: 1, tingiUnit: 'pack', stock: 144, reorderLevel: 60 },
    { name: 'Lucky Me Pancit Canton Chilimansi 60g', barcode: '4800016106118', brand: 'Lucky Me', unitPrice: 12, costPrice: 9.5, tingiPrice: 12, tingiPerPack: 1, tingiUnit: 'pack', stock: 120, reorderLevel: 60 },
    { name: 'Lucky Me Chicken 55g', barcode: '4800016105005', brand: 'Lucky Me', unitPrice: 10, costPrice: 8, tingiPrice: 10, tingiPerPack: 1, tingiUnit: 'pack', stock: 156, reorderLevel: 72 },
    { name: 'Lucky Me Beef 55g', barcode: '4800016105012', brand: 'Lucky Me', unitPrice: 10, costPrice: 8, tingiPrice: 10, tingiPerPack: 1, tingiUnit: 'pack', stock: 132, reorderLevel: 72 },
    { name: 'Nissin Cup Noodles Seafood 60g', barcode: '4800024508013', brand: 'Nissin', unitPrice: 28, costPrice: 22, tingiPrice: 28, tingiPerPack: 1, tingiUnit: 'cup', stock: 72, reorderLevel: 36 },
    { name: 'Payless Pancit Canton 60g', barcode: '4800066100127', brand: 'Payless', unitPrice: 9, costPrice: 7, tingiPrice: 9, tingiPerPack: 1, tingiUnit: 'pack', stock: 168, reorderLevel: 72 },
    { name: 'Quickchow Mami 55g', barcode: '4800194104562', brand: 'Quickchow', unitPrice: 8.5, costPrice: 6.5, tingiPrice: 8.5, tingiPerPack: 1, tingiUnit: 'pack', stock: 144, reorderLevel: 72 },
    { name: 'Nissin Yakisoba 75g', barcode: '4800024508051', brand: 'Nissin', unitPrice: 32, costPrice: 25, tingiPrice: 32, tingiPerPack: 1, tingiUnit: 'pack', stock: 60, reorderLevel: 30 },
    { name: 'Lucky Me Supreme La Paz Batchoy 70g', barcode: '4800016105302', brand: 'Lucky Me', unitPrice: 18, costPrice: 14, tingiPrice: 18, tingiPerPack: 1, tingiUnit: 'pack', stock: 96, reorderLevel: 48 },
    { name: 'Lucky Me Go Cup Bulalo 65g', barcode: '4800016105708', brand: 'Lucky Me', unitPrice: 26, costPrice: 20, tingiPrice: 26, tingiPerPack: 1, tingiUnit: 'cup', stock: 72, reorderLevel: 36 }
  ],
  'Condiments & Sauces': [
    { name: 'Datu Puti Soy Sauce 385ml', barcode: '4800888104014', brand: 'Datu Puti', unitPrice: 32, costPrice: 25, tingiPrice: 2, tingiPerPack: 20, tingiUnit: 'sachet', stock: 48, reorderLevel: 24 },
    { name: 'Datu Puti Vinegar 385ml', barcode: '4800888103024', brand: 'Datu Puti', unitPrice: 28, costPrice: 22, tingiPrice: 2, tingiPerPack: 20, tingiUnit: 'sachet', stock: 48, reorderLevel: 24 },
    { name: 'Silver Swan Soy Sauce 385ml', barcode: '4800024513017', brand: 'Silver Swan', unitPrice: 34, costPrice: 26, tingiPrice: 2, tingiPerPack: 20, tingiUnit: 'sachet', stock: 36, reorderLevel: 20 },
    { name: 'UFC Banana Catsup 320g', barcode: '4800888105011', brand: 'UFC', unitPrice: 48, costPrice: 38, tingiPrice: 3, tingiPerPack: 20, tingiUnit: 'sachet', stock: 40, reorderLevel: 20 },
    { name: 'Mama Sita Oyster Sauce 405g', barcode: '4800016100116', brand: 'Mama Sita', unitPrice: 65, costPrice: 50, tingiPrice: 3, tingiPerPack: 25, tingiUnit: 'sachet', stock: 32, reorderLevel: 16 },
    { name: 'Ajinomoto Umami Seasoning 50g', barcode: '4800024510061', brand: 'Ajinomoto', unitPrice: 22, costPrice: 17, tingiPrice: 1, tingiPerPack: 25, tingiUnit: 'sachet', stock: 60, reorderLevel: 30 },
    { name: 'Maggi Magic Sarap 50g', barcode: '4800024512126', brand: 'Maggi', unitPrice: 28, costPrice: 22, tingiPrice: 1, tingiPerPack: 30, tingiUnit: 'sachet', stock: 72, reorderLevel: 36 },
    { name: 'Datu Puti Patis 350ml', barcode: '4800888102010', brand: 'Datu Puti', unitPrice: 30, costPrice: 23, tingiPrice: 2, tingiPerPack: 20, tingiUnit: 'sachet', stock: 40, reorderLevel: 20 },
    { name: 'Knorr Chicken Cubes 60g', barcode: '4800024512317', brand: 'Knorr', unitPrice: 36, costPrice: 28, tingiPrice: 3, tingiPerPack: 12, tingiUnit: 'cube', stock: 48, reorderLevel: 24 },
    { name: 'Papa Banana Catsup 320g', barcode: '4800194104111', brand: 'Papa', unitPrice: 42, costPrice: 32, tingiPrice: 2.5, tingiPerPack: 20, tingiUnit: 'sachet', stock: 36, reorderLevel: 20 }
  ],
  'Personal Care': [
    { name: 'Safeguard Classic White 135g', barcode: '4902430576819', brand: 'Safeguard', unitPrice: 45, costPrice: 35, tingiPrice: 8, tingiPerPack: 6, tingiUnit: 'bar', stock: 48, reorderLevel: 24 },
    { name: 'Palmolive Naturals Papaya 135g', barcode: '4891294010019', brand: 'Palmolive', unitPrice: 42, costPrice: 32, tingiPrice: 7, tingiPerPack: 6, tingiUnit: 'bar', stock: 54, reorderLevel: 30 },
    { name: 'Head & Shoulders Sachet 12ml', barcode: '4902430575713', brand: 'Head & Shoulders', unitPrice: 8, costPrice: 6, tingiPrice: 8, tingiPerPack: 1, tingiUnit: 'sachet', stock: 200, reorderLevel: 100 },
    { name: 'Cream Silk Conditioner Sachet 12ml', barcode: '4902430575904', brand: 'Cream Silk', unitPrice: 8, costPrice: 6, tingiPrice: 8, tingiPerPack: 1, tingiUnit: 'sachet', stock: 200, reorderLevel: 100 },
    { name: 'Colgate Toothpaste 150g', barcode: '8850006310311', brand: 'Colgate', unitPrice: 75, costPrice: 58, tingiPrice: 4, tingiPerPack: 20, tingiUnit: 'sachet', stock: 48, reorderLevel: 24 },
    { name: 'Close-Up Toothpaste 160g', barcode: '8851932314404', brand: 'Close-Up', unitPrice: 72, costPrice: 55, tingiPrice: 4, tingiPerPack: 20, tingiUnit: 'sachet', stock: 42, reorderLevel: 24 },
    { name: 'Tide Detergent Powder 30g Sachet', barcode: '4902430575119', brand: 'Tide', unitPrice: 8, costPrice: 6, tingiPrice: 8, tingiPerPack: 1, tingiUnit: 'sachet', stock: 240, reorderLevel: 120 },
    { name: 'Downy Fabric Conditioner 27ml', barcode: '4902430574921', brand: 'Downy', unitPrice: 7, costPrice: 5, tingiPrice: 7, tingiPerPack: 1, tingiUnit: 'sachet', stock: 240, reorderLevel: 120 },
    { name: 'Rejoice Shampoo Sachet 12ml', barcode: '4902430575201', brand: 'Rejoice', unitPrice: 8, costPrice: 6, tingiPrice: 8, tingiPerPack: 1, tingiUnit: 'sachet', stock: 200, reorderLevel: 100 },
    { name: 'Palmolive Shampoo Sachet 12ml', barcode: '4891294011016', brand: 'Palmolive', unitPrice: 7, costPrice: 5, tingiPrice: 7, tingiPerPack: 1, tingiUnit: 'sachet', stock: 200, reorderLevel: 100 }
  ],
  'Household Items': [
    { name: 'Ariel Detergent Powder 30g', barcode: '4902430575126', brand: 'Ariel', unitPrice: 8.5, costPrice: 6.5, tingiPrice: 8.5, tingiPerPack: 1, tingiUnit: 'sachet', stock: 240, reorderLevel: 120 },
    { name: 'Surf Powder Blossom Fresh 30g', barcode: '4902430574914', brand: 'Surf', unitPrice: 8, costPrice: 6, tingiPrice: 8, tingiPerPack: 1, tingiUnit: 'sachet', stock: 240, reorderLevel: 120 },
    { name: 'Champion Detergent Powder 30g', barcode: '4800066101018', brand: 'Champion', unitPrice: 7, costPrice: 5, tingiPrice: 7, tingiPerPack: 1, tingiUnit: 'sachet', stock: 240, reorderLevel: 120 },
    { name: 'Joy Dishwashing Liquid 25ml', barcode: '4902430575300', brand: 'Joy', unitPrice: 6, costPrice: 4.5, tingiPrice: 6, tingiPerPack: 1, tingiUnit: 'sachet', stock: 200, reorderLevel: 100 },
    { name: 'Zonrox Bleach 50ml', barcode: '4800888101025', brand: 'Zonrox', unitPrice: 10, costPrice: 7.5, tingiPrice: 10, tingiPerPack: 1, tingiUnit: 'sachet', stock: 120, reorderLevel: 60 },
    { name: 'Domex Toilet Bowl Cleaner 50ml', barcode: '8850006311011', brand: 'Domex', unitPrice: 12, costPrice: 9, tingiPrice: 12, tingiPerPack: 1, tingiUnit: 'sachet', stock: 96, reorderLevel: 48 },
    { name: 'Baygon Green 600ml', barcode: '8850006314012', brand: 'Baygon', unitPrice: 145, costPrice: 115, tingiPrice: 24, tingiPerPack: 6, tingiUnit: 'bottle', stock: 24, reorderLevel: 12 },
    { name: 'Lysol Disinfectant Spray 170g', barcode: '8850006313015', brand: 'Lysol', unitPrice: 165, costPrice: 130, tingiPrice: 28, tingiPerPack: 6, tingiUnit: 'can', stock: 18, reorderLevel: 12 },
    { name: 'Mr. Muscle Glass Cleaner 500ml', barcode: '8850006315019', brand: 'Mr. Muscle', unitPrice: 95, costPrice: 75, tingiPrice: 16, tingiPerPack: 6, tingiUnit: 'bottle', stock: 30, reorderLevel: 18 },
    { name: 'Smart Kitchen Sponge 2pcs', barcode: '4800066100332', brand: 'Smart', unitPrice: 25, costPrice: 18, tingiPrice: 13, tingiPerPack: 2, tingiUnit: 'piece', stock: 60, reorderLevel: 30 }
  ]
};

const customers = [
  { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@email.com', phone: '09171234567', address: '123 Mabini St., Brgy. 1', creditLimit: 5000 },
  { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@email.com', phone: '09281234567', address: '456 Rizal Ave., Brgy. 2', creditLimit: 3000 },
  { firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@email.com', phone: '09391234567', address: '789 Luna St., Brgy. 3', creditLimit: 4000 },
  { firstName: 'Pedro', lastName: 'Garcia', email: 'pedro.garcia@email.com', phone: '09451234567', address: '321 Bonifacio Rd., Brgy. 4', creditLimit: 2500 },
  { firstName: 'Rosa', lastName: 'Hernandez', email: 'rosa.hernandez@email.com', phone: '09561234567', address: '654 Aguinaldo St., Brgy. 5', creditLimit: 3500 },
  { firstName: 'Jose', lastName: 'Martinez', email: 'jose.martinez@email.com', phone: '09671234567', address: '987 Quezon Ave., Brgy. 6', creditLimit: 4500 },
  { firstName: 'Carmen', lastName: 'Lopez', email: 'carmen.lopez@email.com', phone: '09781234567', address: '147 Magsaysay Blvd., Brgy. 7', creditLimit: 3000 },
  { firstName: 'Miguel', lastName: 'Gonzales', email: 'miguel.gonzales@email.com', phone: '09891234567', address: '258 Roxas St., Brgy. 8', creditLimit: 2000 },
  { firstName: 'Elena', lastName: 'Ramos', email: 'elena.ramos@email.com', phone: '09121234567', address: '369 Osmeña Ave., Brgy. 9', creditLimit: 5000 },
  { firstName: 'Ricardo', lastName: 'Torres', email: 'ricardo.torres@email.com', phone: '09231234567', address: '741 Laurel Rd., Brgy. 10', creditLimit: 2500 }
];

const staff = [
  { firstName: 'Linda', lastName: 'Cruz', email: 'linda.cruz@lynxstore.com', phone: '09181234567', address: '111 Staff Housing, Brgy. 1', role: 'staff' },
  { firstName: 'Carlos', lastName: 'Bautista', email: 'carlos.bautista@lynxstore.com', phone: '09291234567', address: '222 Staff Housing, Brgy. 1', role: 'staff' }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Transaction.deleteMany({});
  await Debt.deleteMany({});
  console.log('✅ Database cleared');
};

// Seed users
const seedUsers = async () => {
  console.log('👥 Seeding users...');
  
  // Create admin (password will be hashed by User model's pre-save hook)
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@lynxstore.com',
    password: 'admin123',
    role: 'admin',
    phone: '09991234567',
    address: 'Main Office',
    creditLimit: 0
  });
  console.log('  ✓ Created admin user');

  // Create staff
  const staffUsers = [];
  for (const staffData of staff) {
    const staffUser = await User.create({
      ...staffData,
      password: 'admin123'
    });
    staffUsers.push(staffUser);
  }
  console.log(`  ✓ Created ${staffUsers.length} staff users`);

  // Create customers
  const customerUsers = [];
  for (const customerData of customers) {
    const customer = await User.create({
      ...customerData,
      password: 'admin123',
      role: 'customer'
    });
    customerUsers.push(customer);
  }
  console.log(`  ✓ Created ${customerUsers.length} customer users`);

  return { admin, staffUsers, customerUsers };
};

// Seed categories and products
const seedCategoriesAndProducts = async () => {
  console.log('📦 Seeding categories and products...');
  
  const createdCategories = [];
  const allProducts = [];

  for (const categoryData of categories) {
    const category = await Category.create(categoryData);
    createdCategories.push(category);
    
    const categoryProducts = products[categoryData.name] || [];
    for (const productData of categoryProducts) {
      const product = await Product.create({
        ...productData,
        category: category._id
      });
      allProducts.push(product);
    }
  }

  console.log(`  ✓ Created ${createdCategories.length} categories`);
  console.log(`  ✓ Created ${allProducts.length} products`);

  return { categories: createdCategories, products: allProducts };
};

// Generate historical transactions
const generateTransactions = async (customerUsers, staffUsers, allProducts) => {
  console.log('💰 Generating historical transactions...');
  
  const transactions = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  let receiptCounter = 1;
  
  // Generate 5-15 transactions per customer over 6 months
  for (const customer of customerUsers) {
    const numTransactions = Math.floor(Math.random() * 11) + 5; // 5-15 transactions
    
    for (let i = 0; i < numTransactions; i++) {
      const transactionDate = randomDateWithinMonths(6);
      const staff = staffUsers[Math.floor(Math.random() * staffUsers.length)];
      
      // Random 2-6 items per transaction
      const numItems = Math.floor(Math.random() * 5) + 2;
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const isTingi = Math.random() > 0.5;
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = isTingi ? product.tingiPrice : product.unitPrice;
        const subtotal = quantity * unitPrice;
        
        items.push({
          product: product._id,
          productName: product.name,
          quantity,
          unitPrice,
          subtotal,
          isTingi
        });
        
        totalAmount += subtotal;
      }
      
      // 70% cash, 20% credit, 10% split
      const paymentRandom = Math.random();
      let paymentMethod, cashReceived, changeAmount, creditAmount;
      
      if (paymentRandom < 0.7) {
        paymentMethod = 'cash';
        cashReceived = Math.ceil(totalAmount / 100) * 100; // Round up to nearest 100
        changeAmount = cashReceived - totalAmount;
        creditAmount = 0;
      } else if (paymentRandom < 0.9) {
        paymentMethod = 'credit';
        cashReceived = 0;
        changeAmount = 0;
        creditAmount = totalAmount;
      } else {
        paymentMethod = 'split';
        const cashPortion = Math.floor(totalAmount * (Math.random() * 0.5 + 0.3)); // 30-80% cash
        cashReceived = cashPortion;
        changeAmount = 0;
        creditAmount = totalAmount - cashPortion;
      }
      
      // Generate unique receipt number based on transaction date
      const dateStr = transactionDate.toISOString().slice(0,10).replace(/-/g, '');
      const receiptNumber = `RCT-${dateStr}-${String(receiptCounter++).padStart(4, '0')}`;
      
      const transaction = await Transaction.create({
        receiptNumber,
        customer: customer._id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        staff: staff._id,
        items,
        totalAmount,
        paymentMethod,
        cashReceived,
        changeAmount,
        creditAmount,
        createdAt: transactionDate,
        updatedAt: transactionDate
      });
      
      transactions.push(transaction);
      
      // Create debt if there's credit amount
      if (creditAmount > 0) {
        await createDebtFromTransaction(transaction, customer, staff, transactionDate);
      }
    }
  }
  
  console.log(`  ✓ Created ${transactions.length} transactions`);
  return transactions;
};

// Create debt from transaction and generate payments
const createDebtFromTransaction = async (transaction, customer, staff, transactionDate) => {
  const dueDate = new Date(transactionDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term
  
  const debtItems = transaction.items.map(item => ({
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal
  }));
  
  const debt = await Debt.create({
    customer: customer._id,
    transaction: transaction._id,
    items: debtItems,
    totalAmount: transaction.creditAmount,
    paidAmount: 0,
    status: 'pending',
    dueDate,
    createdBy: staff._id,
    createdAt: transactionDate,
    updatedAt: transactionDate,
    payments: []
  });
  
  // Generate payments for some debts
  // 60% fully paid, 25% partially paid, 15% unpaid
  const paymentRandom = Math.random();
  
  if (paymentRandom < 0.85) { // 85% have at least some payment
    const now = new Date();
    const isFullyPaid = paymentRandom < 0.6;
    
    // Number of payments: 1-4
    const numPayments = Math.floor(Math.random() * 4) + 1;
    let remainingAmount = debt.totalAmount;
    
    for (let i = 0; i < numPayments; i++) {
      // Payment date between transaction date and now
      const paymentDate = randomDateBetween(transactionDate, now);
      
      let paymentAmount;
      if (i === numPayments - 1 && isFullyPaid) {
        // Last payment, pay remaining amount
        paymentAmount = remainingAmount;
      } else {
        // Partial payment: 20-60% of remaining
        const percentage = Math.random() * 0.4 + 0.2;
        paymentAmount = Math.min(
          Math.floor(remainingAmount * percentage),
          remainingAmount
        );
      }
      
      debt.payments.push({
        amount: paymentAmount,
        paidAt: paymentDate,
        receivedBy: staff._id,
        method: 'cash',
        notes: ''
      });
      
      debt.paidAmount += paymentAmount;
      remainingAmount -= paymentAmount;
      
      if (remainingAmount <= 0.01) break;
    }
    
    // Update debt status
    debt.updateStatus();
    debt.updatedAt = debt.payments[debt.payments.length - 1].paidAt;
    await debt.save();
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await connectDB();
    await clearDatabase();
    
    console.log('');
    const { admin, staffUsers, customerUsers } = await seedUsers();
    
    console.log('');
    const { categories: createdCategories, products: allProducts } = await seedCategoriesAndProducts();
    
    console.log('');
    await generateTransactions(customerUsers, staffUsers, allProducts);
    
    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Admin: 1`);
    console.log(`   • Staff: ${staffUsers.length}`);
    console.log(`   • Customers: ${customerUsers.length}`);
    console.log(`   • Categories: ${createdCategories.length}`);
    console.log(`   • Products: ${allProducts.length}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Admin: admin@lynxstore.com / admin123');
    console.log('   Staff: linda.cruz@lynxstore.com / admin123');
    console.log('   Staff: carlos.bautista@lynxstore.com / admin123');
    console.log('   Customer: maria.santos@email.com / admin123');
    console.log('   (All users have password: admin123)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
