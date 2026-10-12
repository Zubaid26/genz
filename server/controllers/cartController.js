const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { evaluateCoupon, recalcCart } = require('../utils/cartTotals');

const POPULATE = 'name image_url price stock variants';

// Find the size/color variant of a product
const findVariant = (product, size, color) =>
  product.variants.find((v) => v.size === (size || '') && v.color === (color || ''));

// GET /api/cart — get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id })
      .populate('items.product_id', POPULATE);

    if (!cart) {
      cart = { items: [], total: 0, subtotal: 0, discount: 0, coupon_code: '' };
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/cart/add — add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, size = '', color = '' } = req.body;
    const qty = quantity || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Products with variants need a valid size/color selection
    let available = product.stock;
    if (product.variants.length > 0) {
      const variant = findVariant(product, size, color);
      if (!variant) {
        return res.status(400).json({ message: 'Please choose a size/color.' });
      }
      available = variant.stock;
    }

    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      cart = new Cart({ user_id: req.user._id, items: [], total: 0 });
    }

    // Same product + size + color merges into one line
    const existingItem = cart.items.find(
      (item) =>
        item.product_id.toString() === productId &&
        (item.size || '') === size &&
        (item.color || '') === color
    );

    const newQty = (existingItem ? existingItem.quantity : 0) + qty;
    if (newQty > available) {
      return res.status(400).json({ message: `Only ${available} in stock.` });
    }

    if (existingItem) {
      existingItem.quantity = newQty;
    } else {
      // Price always comes from the database
      cart.items.push({ product_id: productId, quantity: qty, price: product.price, size, color });
    }

    await recalcCart(cart);
    await cart.save();

    await cart.populate('items.product_id', POPULATE);
    res.json({ message: 'Item added to cart.', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/cart/update/:itemId — update item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart.' });
    }

    const product = await Product.findById(item.product_id);
    if (product) {
      const variant = product.variants.length ? findVariant(product, item.size, item.color) : null;
      const available = product.variants.length ? (variant ? variant.stock : 0) : product.stock;
      if (quantity > available) {
        return res.status(400).json({ message: `Only ${available} in stock.` });
      }
    }

    item.quantity = quantity;

    await recalcCart(cart);
    await cart.save();
    await cart.populate('items.product_id', POPULATE);

    res.json({ message: 'Cart updated.', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/cart/remove/:itemId — remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await recalcCart(cart);
    await cart.save();
    await cart.populate('items.product_id', POPULATE);

    res.json({ message: 'Item removed from cart.', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/cart/clear — clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id });
    if (cart) {
      cart.items = [];
      cart.coupon_code = '';
      await recalcCart(cart);
      await cart.save();
    }

    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/cart/coupon — apply a coupon code
exports.applyCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    await recalcCart(cart);
    const result = await evaluateCoupon(req.body.code, cart.subtotal);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    cart.coupon_code = result.coupon.code;
    await recalcCart(cart);
    await cart.save();
    await cart.populate('items.product_id', POPULATE);

    res.json({ message: `Coupon ${result.coupon.code} applied!`, cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/cart/coupon — remove the applied coupon
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    cart.coupon_code = '';
    await recalcCart(cart);
    await cart.save();
    await cart.populate('items.product_id', POPULATE);

    res.json({ message: 'Coupon removed.', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
