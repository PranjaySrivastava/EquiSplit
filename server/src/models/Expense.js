const mongoose = require('mongoose');

const payerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount paid must be greater than zero'],
    },
  },
  { _id: false }
);

const splitShareSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Share amount cannot be negative'],
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    shares: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
      maxlength: [100, 'Description cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Total expense amount is required'],
      min: [0.01, 'Total amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paidBy: {
      type: [payerSchema],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'At least one payer must be specified',
      },
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      default: 'equal',
    },
    splits: {
      type: [splitShareSchema],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'At least one split participant must be specified',
      },
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'entertainment', 'groceries', 'utilities', 'housing', 'shopping', 'other'],
      default: 'food',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for high performance queries
expenseSchema.index({ group: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
