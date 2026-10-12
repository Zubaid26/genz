const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  min_order: { type: Number, default: 0, min: 0 },
  expires_at: { type: Date, default: null },
  usage_limit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
  used_count: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
