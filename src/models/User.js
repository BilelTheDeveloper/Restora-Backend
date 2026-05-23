import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['superadmin', 'owner', 'manager', 'cashier', 'waiter', 'kitchen', 'driver', 'customer'],
      default: 'customer',
    },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    kycData: {
      documentType:  { type: String, enum: ['national_id', 'passport', 'drivers_license'] },
      documentFront: { type: String },
      documentBack:  { type: String },
      selfies:       [{ type: String }],
      fullName:      { type: String },
      nationalId:    { type: String },
      taxNumber:     { type: String },
      businessReg:   { type: String },
    },
    notifications: {
      email:       { type: Boolean, default: true  },
      orders:      { type: Boolean, default: true  },
      marketing:   { type: Boolean, default: false },
      lowStock:    { type: Boolean, default: true  },
      dailyReport: { type: Boolean, default: false },
      sms:         { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 14);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
