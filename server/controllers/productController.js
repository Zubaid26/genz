const Product = require('../models/Product');

// GET /api/products — all products with search & filter
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    const products = await Product.find(query).sort({ created_at: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/:id — single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/:id/overlay — overlay image URL for Try-On
exports.getOverlay = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('overlay_image_url');
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ overlay_image_url: product.overlay_image_url });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/products — add product (admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, image_url, overlay_image_url, description } = req.body;

    const product = await Product.create({
      name, category, price, stock,
      image_url, overlay_image_url, description
    });

    res.status(201).json({ message: 'Product created.', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/products/:id — update product (admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product updated.', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/products/:id — delete product (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/analytics — product performance (admin)
exports.getProductAnalytics = async (req, res) => {
  try {
    const products = await Product.find().select('name category price stock').sort({ stock: 1 });
    const lowStock = products.filter(p => p.stock < 10);

    res.json({
      total: products.length,
      lowStock,
      products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
