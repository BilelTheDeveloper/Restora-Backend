import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const LOCK_AFTER   = 5;          // failed attempts before lockout
const LOCK_MINUTES = 30;         // lockout duration in minutes

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone:    { type: String, trim: true },
    avatar:   { type: String },

    role: {
      type: String,
      enum: ['superadmin', 'owner', 'manager', 'cashier', 'waiter', 'kitchen', 'driver', 'customer'],
      default: 'customer',
    },

    restaurant:        { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    verificationStatus: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected'], default: 'pending' },
    rejectionReason:   { type: String },

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

    // ── Brute-force lockout ───────────────────────────────────
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil:     { type: Date, select: false },

    // ── Refresh token store (for rotation + revocation) ───────
    refreshTokens: {
      type: [{ token: { type: String }, createdAt: { type: Date, default: Date.now } }],
      select: false,
      default: [],
    },

    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────
userSchema.index({ lockUntil: 1 }, { sparse: true });

// ── Password hashing ──────────────────────────────���────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 14);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ── Lockout helpers ────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = async function () {
  // Clear expired lock
  if (this.lockUntil && this.lockUntil <= Date.now()) {
    await this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: '' } });
    return;
  }

  const update = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= LOCK_AFTER) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) };
  }
  await this.updateOne(update);
};

userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: '' } });
};

// ── Refresh token helpers ──────────────────────────────────
userSchema.methods.addRefreshToken = async function (token) {
  const cutoff = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  // MongoDB forbids $push and $pull on the same path in one operation — two steps
  await this.updateOne({ $pull: { refreshTokens: { createdAt: { $lt: cutoff } } } });
  await this.updateOne({
    $push: { refreshTokens: { $each: [{ token, createdAt: new Date() }], $slice: -10 } },
  });
};

userSchema.methods.removeRefreshToken = async function (token) {
  await this.updateOne({ $pull: { refreshTokens: { token } } });
};

export default mongoose.model('User', userSchema);
