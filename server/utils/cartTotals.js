const Coupon = require('../models/Coupon');

const round = (n) => Math.round(n * 100) / 100;

// Check a coupon code against a subtotal. Returns { coupon, discount } or { error }.
const evaluateCoupon = async (code, subtotal) => {
  const coupon = await Coupon.findOne({ code: String(code || '').trim().toUpperCase() });
  if (!coupon || !coupon.active) return { error: 'Invalid coupon code.' };
  if (coupon.expires_at && coupon.expires_at < new Date()) return { error: 'This coupon has expired.' };
  if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
    return { error: 'This coupon has reached its usage limit.' };
  }
  if (subtotal < coupon.min_order) {
    return { error: `Minimum order of $${coupon.min_order.toFixed(2)} required for this coupon.` };
  }
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return { coupon, discount: round(Math.min(raw, subtotal)) };
};

// Recompute subtotal / discount / total on a cart document (does not save).
const recalcCart = async (cart) => {
  cart.subtotal = round(cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  cart.discount = 0;
  if (cart.coupon_code) {
    const result = await evaluateCoupon(cart.coupon_code, cart.subtotal);
    if (result.error) cart.coupon_code = '';
    else cart.discount = result.discount;
  }
  cart.total = round(Math.max(0, cart.subtotal - cart.discount));
  cart.updated_at = Date.now();
};

module.exports = { evaluateCoupon, recalcCart };
