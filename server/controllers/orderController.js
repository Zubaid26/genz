const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const generateInvoice = require('../utils/generateInvoice');
const { recalcCart } = require('../utils/cartTotals');
const { verifyWalletPayment } = require('../utils/verifyPayment');
const { findMethod, normalizeMobile } = require('../config/paymentMethods');

const REQUIRED_ADDRESS_FIELDS = ['full_name', 'phone', 'address', 'city'];

// Normalise and validate the shipping address submitted at checkout.
const parseShippingAddress = (raw = {}) => {
  const clean = (v) => String(v || '').trim();
  const address = {
    full_name: clean(raw.full_name),
    phone: clean(raw.phone),
    address: clean(raw.address),
    city: clean(raw.city),
    zip: clean(raw.zip),
    country: clean(raw.country) || 'Pakistan'
  };

  const missing = REQUIRED_ADDRESS_FIELDS.filter((f) => !address[f]);
  if (missing.length) {
    return { error: `Shipping address incomplete: ${missing.join(', ').replace(/_/g, ' ')}.` };
  }
  if (address.phone.replace(/\D/g, '').length < 7) {
    return { error: 'Please provide a valid phone number.' };
  }
  return { address };
};

// POST /api/orders/place — place order after payment
exports.placeOrder = async (req, res) => {
  try {
    const { payment_reference, payment_signature, payment_method } = req.body;

    // Reject unknown or currently unavailable payment methods.
    const method = findMethod(payment_method);
    if (!method) {
      return res.status(400).json({ message: 'Unsupported payment method.' });
    }

    const { address, error: addressError } = parseShippingAddress(req.body.shipping_address);
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    const cart = await Cart.findOne({ user_id: req.user._id })
      .populate('items.product_id');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    // Re-validate the coupon so an expired or used-up code can't be applied
    await recalcCart(cart);

    // Verify the money actually arrived before creating the order. The total is
    // recomputed above, so this compares against the server's figure, not the client's.
    let paymentStatus = 'pending';
    if (method.requiresPayment) {
      const result = await verifyWalletPayment({
        reference: payment_reference,
        signature: payment_signature,
        userId: req.user._id,
        expectedTotal: cart.total
      });
      if (!result.ok) {
        return res.status(result.status).json({ message: result.message });
      }
      paymentStatus = 'paid';
    }

    // Check stock availability (per variant when the product has variants)
    for (const item of cart.items) {
      const product = await Product.findById(item.product_id._id || item.product_id);
      const hasVariants = product?.variants?.length > 0;
      const variant = hasVariants
        ? product.variants.find((v) => v.size === (item.size || '') && v.color === (item.color || ''))
        : null;
      const available = hasVariants ? (variant ? variant.stock : 0) : product?.stock;
      if (!product || available < item.quantity) {
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
        price: item.price,
        size: item.size || '',
        color: item.color || ''
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      coupon_code: cart.coupon_code,
      total_price: cart.total,
      payment_method: method.id,
      payment_status: paymentStatus,
      payment_reference: method.requiresPayment ? payment_reference : '',
      payer_mobile: method.requiresPayment ? (normalizeMobile(req.body.payer_mobile) || '') : '',
      shipping_address: address,
      status: 'Placed',
      status_history: [{ status: 'Placed', at: new Date() }]
    });

    if (cart.coupon_code) {
      await Coupon.updateOne({ code: cart.coupon_code }, { $inc: { used_count: 1 } });
    }

    // Decrement stock for each product
    for (const item of cart.items) {
      const productId = item.product_id._id || item.product_id;
      const product = await Product.findById(productId).select('variants');
      if (product?.variants?.length) {
        await Product.updateOne(
          { _id: productId, variants: { $elemMatch: { size: item.size || '', color: item.color || '' } } },
          { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(productId, { $inc: { stock: -item.quantity } });
      }
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
    cart.coupon_code = '';
    await recalcCart(cart);
    await cart.save();

    res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        _id: order._id,
        total_price: order.total_price,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
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
      { status, $push: { status_history: { status, at: new Date() } } },
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
