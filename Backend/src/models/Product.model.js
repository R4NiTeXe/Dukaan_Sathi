import mongoose from 'mongoose';
import { buildSearchKeys } from '../helpers/smartMatch.helper.js';

const productSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: 'piece',
    },
    autoAdded: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: 'other',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    aliases: {
      type: [String],
      default: [],
    },
    searchKeys: {
      type: [String],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ userId: 1, name: 1 });
productSchema.index({ userId: 1, searchKeys: 1 });

productSchema.pre('save', function (next) {
  this.searchKeys = buildSearchKeys(this.name, this.aliases);
  next();
});

export const Product = mongoose.model('Product', productSchema);
