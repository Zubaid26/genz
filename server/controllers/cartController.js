const Cart = require('../models/Cart');

// GET /api/cart — get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id })
      .populate('items.product_id', 'name image_url price stock');

    if (!cart) {
      cart = { items: [], total: 0 };
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/cart/add — add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;

    let cart = await Cart.findOne({ user_id: req.user._id });

    if (!cart) {
      cart = new Cart({ user_id: req.user._id, items: [], total: 0 });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.product_id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        product_id: productId,
        quantity: quantity || 1,
        price
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updated_at = Date.now();

    await cart.save();

    // Populate and return
    await cart.populate('items.product_id', 'name image_url price stock');
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

    item.quantity = quantity;

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updated_at = Date.now();

    await cart.save();
    await cart.populate('items.product_id', 'name image_url price stock');

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

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updated_at = Date.now();

    await cart.save();
    await cart.populate('items.product_id', 'name image_url price stock');

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
      cart.total = 0;
      cart.updated_at = Date.now();
      await cart.save();
    }

    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
