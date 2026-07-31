import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    lastPurchase: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ userId: 1, name: 1 });
customerSchema.index({ userId: 1, phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
