const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    size: { type: String, default: '' },
    color: { type: String, default: '' }
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  coupon_code: {
    type: String,
    default: ''
  },
  status_history: [{
    _id: false,
    status: String,
    at: { type: Date, default: Date.now }
  }],
  total_price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  payment_method: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'cod'],
    default: 'cod'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  // Gateway transaction reference (JC-… / EP-…). Empty for cash on delivery.
  payment_reference: {
    type: String,
    default: ''
  },
  // Mobile wallet number the payment was taken from.
  payer_mobile: {
    type: String,
    default: ''
  },
  // Deprecated: Stripe intent id kept so historical orders still render.
  payment_intent_id: {
    type: String,
    default: ''
  },
  shipping_address: {
    full_name: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true }
  },
  invoice_url: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// One gateway reference can back at most one order. The partial filter keeps the
// uniqueness rule from applying to COD orders, which have no reference.
OrderSchema.index(
  { payment_reference: 1 },
  { unique: true, partialFilterExpression: { payment_reference: { $type: 'string', $gt: '' } } }
);

module.exports = mongoose.model('Order', OrderSchema);
