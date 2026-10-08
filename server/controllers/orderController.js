const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const generateInvoice = require('../utils/generateInvoice');

// POST /api/orders/place — place order after payment
exports.placeOrder = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    const cart = await Cart.findOne({ user_id: req.user._id })
      .populate('items.product_id');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product_id._id || item.product_id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product?.name || 'a product'}.`
        });
      }
    }

    // Create order
    const order = await Order.create({
      user_id: req.user._id,
      items: cart.items.map(item => ({
        product_id: item.product_id._id || item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      total_price: cart.total,
      payment_intent_id: payment_intent_id || '',
      status: 'Placed'
    });

    // Decrement stock for each product
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product_id._id || item.product_id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Generate invoice
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product_id', 'name')
      .populate('user_id', 'full_name email');

    const invoiceUrl = await generateInvoice(populatedOrder, req.user);
    order.invoice_url = invoiceUrl;
    await order.save();

    // Clear cart
    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        _id: order._id,
        total_price: order.total_price,
        status: order.status,
        created_at: order.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/orders/:id — get single order detail
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product_id', 'name image_url price')
      .populate('user_id', 'full_name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Only allow the order owner or admin to view
    if (order.user_id._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/orders — all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user_id', 'full_name email')
      .populate('items.product_id', 'name')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/orders/:id/status — update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order status updated.', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/orders/:id/invoice — get invoice
exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (!order.invoice_url) {
      // Regenerate invoice if missing
      const populatedOrder = await Order.findById(order._id)
        .populate('items.product_id', 'name')
        .populate('user_id', 'full_name email');
      const invoiceUrl = await generateInvoice(populatedOrder, req.user);
      order.invoice_url = invoiceUrl;
      await order.save();
    }

    res.json({ invoice_url: order.invoice_url });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
