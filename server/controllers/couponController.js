const Coupon = require('../models/Coupon');

// GET /api/coupons (admin)
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ created_at: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/coupons (admin)
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, min_order, expires_at, usage_limit } = req.body;

    if (!code || !['percent', 'fixed'].includes(type) || !(Number(value) > 0)) {
      return res.status(400).json({ message: 'Code, type and a positive value are required.' });
    }
    if (type === 'percent' && Number(value) > 100) {
      return res.status(400).json({ message: 'Percent discount cannot exceed 100.' });
    }

    const coupon = await Coupon.create({
      code,
      type,
      value: Number(value),
      min_order: Number(min_order) || 0,
      expires_at: expires_at || null,
      usage_limit: Number(usage_limit) || 0
    });

    res.status(201).json({ message: 'Coupon created.', coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A coupon with this code already exists.' });
    }
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/coupons/:id (admin) — toggle active, etc.
exports.updateCoupon = async (req, res) => {
  try {
    const allowed = ['active', 'value', 'min_order', 'expires_at', 'usage_limit'];
    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    res.json({ message: 'Coupon updated.', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/coupons/:id (admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    res.json({ message: 'Coupon deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
