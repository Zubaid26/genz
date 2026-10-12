const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Recompute the cached average rating on the product
const refreshRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product_id: productId } },
    { $group: { _id: '$product_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  await Product.findByIdAndUpdate(productId, {
    avg_rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    review_count: stats ? stats.count : 0
  });
};

// GET /api/products/:id/reviews — public
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id }).sort({ created_at: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/:id/reviews/eligibility — can the current user review?
exports.getEligibility = async (req, res) => {
  try {
    const purchased = await Order.exists({
      user_id: req.user._id,
      status: { $ne: 'Cancelled' },
      'items.product_id': req.params.id
    });
    const mine = await Review.findOne({ product_id: req.params.id, user_id: req.user._id });
    res.json({ canReview: !!purchased, review: mine });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/products/:id/reviews — create or update the current user's review
exports.saveReview = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const purchased = await Order.exists({
      user_id: req.user._id,
      status: { $ne: 'Cancelled' },
      'items.product_id': product._id
    });
    if (!purchased) {
      return res.status(403).json({ message: 'Only customers who bought this product can review it.' });
    }

    const review = await Review.findOneAndUpdate(
      { product_id: product._id, user_id: req.user._id },
      {
        rating,
        comment: (req.body.comment || '').trim(),
        user_name: req.user.full_name,
        created_at: Date.now()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await refreshRating(product._id);
    res.json({ message: 'Review saved.', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/products/:id/reviews — remove the current user's review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      product_id: req.params.id,
      user_id: req.user._id
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }
    await refreshRating(review.product_id);
    res.json({ message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
