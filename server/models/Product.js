const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: 0
  },
  image_url: {
    type: String,
    required: [true, 'Image URL is required']
  },
  overlay_image_url: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  variants: [{
    _id: false,
    size: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    stock: { type: Number, default: 0, min: 0 }
  }],
  avg_rating: {
    type: Number,
    default: 0
  },
  review_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Text index for search functionality
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
