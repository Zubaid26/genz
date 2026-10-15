const Product = require('../models/Product');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { created_at: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { avg_rating: -1, review_count: -1 }
};

// Keep product.stock in sync with the sum of its variants
const normalizeVariants = (body) => {
  if (!Array.isArray(body.variants)) return body;
  const variants = body.variants
    .filter((v) => (v.size || '').trim() || (v.color || '').trim())
    .map((v) => ({
      size: (v.size || '').trim(),
      color: (v.color || '').trim(),
      stock: Math.max(0, Number(v.stock) || 0)
    }));
  const data = { ...body, variants };
  if (variants.length > 0) {
    data.stock = variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return data;
};

// GET /api/products — all products with search, filter & sort
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, sort, minPrice, maxPrice, inStock } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (category) {
      query.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    const products = await Product.find(query).sort(SORTS[sort] || SORTS.newest);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/suggest?q= — quick matches for the search box
exports.suggestProducts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const re = { $regex: escapeRegex(q), $options: 'i' };
    const products = await Product.find({ $or: [{ name: re }, { category: re }] })
      .select('name category price image_url')
      .sort({ avg_rating: -1, created_at: -1 })
      .limit(6);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/products/:id/related — "you may also like"
exports.getRelated = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('category price');
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const limit = 4;
    let related = await Product.find({ _id: { $ne: product._id }, category: product.category })
      .sort({ avg_rating: -1, review_count: -1, created_at: -1 })
      .limit(limit);

    // Top up with other products when the category is small
    if (related.length < limit) {
      const excluded = [product._id, ...related.map((r) => r._id)];
      const more = await Product.find({ _id: { $nin: excluded } })
        .sort({ avg_rating: -1, created_at: -1 })
        .limit(limit - related.length);
      related = related.concat(more);
    }

    res.json(related);
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

// POST /api/products — add product (admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, image_url, overlay_image_url, description, variants } =
      normalizeVariants(req.body);

    const product = await Product.create({
      name, category, price, stock,
      image_url, overlay_image_url, description, variants
    });

    res.status(201).json({ message: 'Product created.', product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(' ') });
    }
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/products/:id — update product (admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      normalizeVariants(req.body),
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product updated.', product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(' ') });
    }
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
