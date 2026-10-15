const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

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

/**
 * Star breakdown for a product: how many 5-star reviews, 4-star, and so on.
 * Always returns all five buckets so the UI can render empty bars.
 */
const ratingSummary = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { product_id: productId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } }
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let weighted = 0;
  for (const row of rows) {
    distribution[row._id] = row.count;
    total += row.count;
    weighted += row._id * row.count;
  }

  return {
    count: total,
    average: total ? Math.round((weighted / total) * 10) / 10 : 0,
    distribution
  };
};

// Only a customer who actually bought the product may review it.
const hasPurchased = (userId, productId) =>
  Order.exists({
    user_id: userId,
    status: { $ne: 'Cancelled' },
    'items.product_id': productId
  });

// GET /api/products/:id/reviews — public, paginated, optionally filtered by stars
exports.getReviews = async (req, res) => {
  try {
    const productId = new mongoose.Types.ObjectId(req.params.id);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));

    const filter = { product_id: productId };
    const rating = parseInt(req.query.rating, 10);
    if (rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }

    // "helpful" isn't tracked yet, so the useful orders are newest and by score.
    const SORTS = {
      recent: { created_at: -1 },
      highest: { rating: -1, created_at: -1 },
      lowest: { rating: 1, created_at: -1 }
    };
    const sort = SORTS[req.query.sort] || SORTS.recent;

    const [reviews, matching, summary] = await Promise.all([
      Review.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      Review.countDocuments(filter),
      ratingSummary(productId)
    ]);

    res.json({
      reviews,
      summary,
      page,
      pages: Math.max(1, Math.ceil(matching / limit)),
      total: matching
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/:id/reviews/eligibility — can the current user review?
exports.getEligibility = async (req, res) => {
  try {
    const purchased = await hasPurchased(req.user._id, req.params.id);
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

    const comment = String(req.body.comment || '').trim();
    if (comment.length > 1000) {
      return res.status(400).json({ message: 'Review must be 1000 characters or fewer.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (!(await hasPurchased(req.user._id, product._id))) {
      return res.status(403).json({ message: 'Only customers who bought this product can review it.' });
    }

    const existing = await Review.findOne({ product_id: product._id, user_id: req.user._id });

    const review = await Review.findOneAndUpdate(
      { product_id: product._id, user_id: req.user._id },
      {
        rating,
        comment,
        user_name: req.user.full_name,
        created_at: Date.now()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await refreshRating(product._id);
    res.status(existing ? 200 : 201).json({
      message: existing ? 'Review updated.' : 'Review posted.',
      review,
      summary: await ratingSummary(product._id)
    });
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
    res.json({ message: 'Review deleted.', summary: await ratingSummary(review.product_id) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
