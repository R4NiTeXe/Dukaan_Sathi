import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ userId: 1, customerNumber: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
