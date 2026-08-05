import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        productName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, default: 'piece' },
        price: { type: Number, required: true, min: 0 },
        pricePerUnit: { type: Boolean, default: false },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'paid',
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ userId: 1, createdAt: -1 });
billSchema.index({ userId: 1, paymentStatus: 1 });
billSchema.index({ userId: 1, customerId: 1 });

export const Bill = mongoose.model('Bill', billSchema);
