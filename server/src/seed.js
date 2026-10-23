const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');
const ActivityLog = require('./models/ActivityLog');
const { calculateSplits } = require('./services/splitCalculator');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('Seeding demo database...');

    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    await Settlement.deleteMany({});
    await ActivityLog.deleteMany({});

    // 1. Create Demo Users
    const users = await User.create([
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      },
      {
        name: 'Aman Verma',
        email: 'aman@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      },
      {
        name: 'Neha Gupta',
        email: 'neha@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
      },
    ]);

    const [rahul, priya, aman, neha] = users;

    // 2. Create Group: Goa Roadtrip 2026
    const goaGroup = await Group.create({
      name: 'Goa Roadtrip 2026',
      description: 'Beach villa, car rental, beach shacks, and seafood party!',
      currency: 'INR',
      category: 'Trip',
      inviteCode: 'GOA202',
      createdBy: rahul._id,
      members: [
        { user: rahul._id, role: 'admin' },
        { user: priya._id, role: 'member' },
        { user: aman._id, role: 'member' },
        { user: neha._id, role: 'member' },
      ],
    });

    // 3. Add Expenses with diverse split types
    // Expense 1: Beach Villa Stay - Equal split, paid by Rahul (12,000 INR)
    const villaSplits = calculateSplits(12000, 'equal', [
      { user: rahul._id },
      { user: priya._id },
      { user: aman._id },
      { user: neha._id },
    ]);
    await Expense.create({
      group: goaGroup._id,
      description: 'Private Beach Villa (3 nights)',
      amount: 12000,
      currency: 'INR',
      paidBy: [{ user: rahul._id, amount: 12000 }],
      splitType: 'equal',
      splits: villaSplits,
      category: 'housing',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Booked via Airbnb in Anjuna',
      createdBy: rahul._id,
    });

    // Expense 2: Seafood Feast at Fisherman's Wharf - Percentage split, paid by Priya (4,800 INR)
    const dinnerSplits = calculateSplits(4800, 'percentage', [
      { user: rahul._id, percentage: 35 },
      { user: priya._id, percentage: 25 },
      { user: aman._id, percentage: 25 },
      { user: neha._id, percentage: 15 },
    ]);
    await Expense.create({
      group: goaGroup._id,
      description: 'Seafood & Drinks Feast',
      amount: 4800,
      currency: 'INR',
      paidBy: [{ user: priya._id, amount: 4800 }],
      splitType: 'percentage',
      splits: dinnerSplits,
      category: 'food',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: 'Rahul ordered extra lobster, Neha only had dessert',
      createdBy: priya._id,
    });

    // Expense 3: Highway Fuel & Tolls - Exact split, paid by Aman (2,500 INR)
    const fuelSplits = calculateSplits(2500, 'exact', [
      { user: rahul._id, amount: 700 },
      { user: priya._id, amount: 600 },
      { user: aman._id, amount: 700 },
      { user: neha._id, amount: 500 },
    ]);
    await Expense.create({
      group: goaGroup._id,
      description: 'Highway Fuel & Toll Taxes',
      amount: 2500,
      currency: 'INR',
      paidBy: [{ user: aman._id, amount: 2500 }],
      splitType: 'exact',
      splits: fuelSplits,
      category: 'transport',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: 'Filled tank near Kolhapur',
      createdBy: aman._id,
    });

    // Expense 4: Scuba Diving & Water Sports - Multi-payer! (Rahul paid 3000, Neha paid 3000, total 6000)
    const scubaSplits = calculateSplits(6000, 'equal', [
      { user: rahul._id },
      { user: priya._id },
      { user: aman._id },
      { user: neha._id },
    ]);
    await Expense.create({
      group: goaGroup._id,
      description: 'Grand Island Scuba Diving & Parasailing',
      amount: 6000,
      currency: 'INR',
      paidBy: [
        { user: rahul._id, amount: 3000 },
        { user: neha._id, amount: 3000 },
      ],
      splitType: 'equal',
      splits: scubaSplits,
      category: 'entertainment',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Split payment between Rahul & Neha directly to dive operator',
      createdBy: neha._id,
    });

    // 4. Record a partial settlement (Aman paid Rahul 1,500 INR via UPI)
    await Settlement.create({
      group: goaGroup._id,
      fromUser: aman._id,
      toUser: rahul._id,
      amount: 1500,
      currency: 'INR',
      notes: 'UPI transfer for initial villa advance',
      date: new Date(Date.now() - 12 * 60 * 60 * 1000),
      recordedBy: aman._id,
    });

    // 5. Activity Logs
    await ActivityLog.create([
      {
        group: goaGroup._id,
        user: rahul._id,
        action: 'GROUP_CREATED',
        message: 'Rahul Sharma created group "Goa Roadtrip 2026"',
      },
      {
        group: goaGroup._id,
        user: rahul._id,
        action: 'EXPENSE_ADDED',
        message: 'Rahul Sharma added "Private Beach Villa (3 nights)" (INR 12,000.00)',
      },
      {
        group: goaGroup._id,
        user: priya._id,
        action: 'EXPENSE_ADDED',
        message: 'Priya Patel added "Seafood & Drinks Feast" (INR 4,800.00)',
      },
      {
        group: goaGroup._id,
        user: aman._id,
        action: 'SETTLEMENT_RECORDED',
        message: 'Aman Verma paid Rahul Sharma INR 1,500.00 (Settled up)',
      },
    ]);

    // 6. Create Group 2: Flat 402 Roommates
    const flatGroup = await Group.create({
      name: 'Flat 402 Roommates',
      description: 'Monthly flat rent, Wi-Fi fiber, groceries, and maid charges',
      currency: 'INR',
      category: 'Home',
      inviteCode: 'FLAT42',
      createdBy: priya._id,
      members: [
        { user: priya._id, role: 'admin' },
        { user: rahul._id, role: 'member' },
        { user: neha._id, role: 'member' },
      ],
    });

    const wifiSplits = calculateSplits(1199, 'equal', [
      { user: priya._id },
      { user: rahul._id },
      { user: neha._id },
    ]);
    await Expense.create({
      group: flatGroup._id,
      description: 'Airtel Fiber 200Mbps Monthly Bill',
      amount: 1199,
      currency: 'INR',
      paidBy: [{ user: priya._id, amount: 1199 }],
      splitType: 'equal',
      splits: wifiSplits,
      category: 'utilities',
      date: new Date(),
      notes: 'Invoice attached in WhatsApp group',
      createdBy: priya._id,
    });

    console.log(' Demo seed data populated successfully!');
    console.log('Login credentials:');
    console.log(' rahul@example.com / password123');
    console.log(' priya@example.com / password123');
    console.log(' aman@example.com  / password123');
    console.log(' neha@example.com  / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
