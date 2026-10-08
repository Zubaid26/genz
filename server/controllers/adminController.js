const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const lowStock = await Product.find({ stock: { $lt: 10 } })
      .select('name stock category');
    res.json({ totalUsers, totalOrders, totalProducts, totalRevenue, lowStock });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password_hash').sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { status, role } = req.body;
    const update = {};
    if (typeof status === 'boolean') update.status = status;
    if (role) update.role = role;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User updated.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admin/analytics/sales
exports.getSalesAnalytics = async (req, res) => {
  try {
    const salesByMonth = await Order.aggregate([
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        revenue: { $sum: '$total_price' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    res.json(salesByMonth);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admin/analytics/products
exports.getProductAnalytics = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product_id',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'products', localField: '_id',
        foreignField: '_id', as: 'product'
      }},
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
    ]);
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admin/analytics/users
exports.getUserAnalytics = async (req, res) => {
  try {
    const usersByMonth = await User.aggregate([
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    res.json(usersByMonth);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/admin/analytics/orders
exports.getOrderStatusAnalytics = async (req, res) => {
  try {
    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(byStatus.map((s) => ({ status: s._id || 'Unknown', count: s.count })));
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
