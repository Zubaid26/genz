const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true, maxlength: 1000 },
  created_at: { type: Date, default: Date.now }
});

// One review per user per product
ReviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
