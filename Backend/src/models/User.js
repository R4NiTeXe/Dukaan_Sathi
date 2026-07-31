import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopType: {
      type: String,
      enum: ['grocery', 'stationery', 'pharmacy', 'electronics', 'clothing', 'other'],
      required: true,
    },
    shopAddress: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['bn', 'hi', 'en'],
      default: 'en',
    },
    upiQrCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      ownerName: this.ownerName,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

export const User = mongoose.model('User', userSchema);
