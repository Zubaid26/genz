const TryOnSession = require('../models/TryOnSession');

const TRYON_API_URL = process.env.TRYON_API_URL || 'http://localhost:8000';

async function proxyJson(path, options = {}) {
  const response = await fetch(`${TRYON_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function proxyImage(path, res) {
  const response = await fetch(`${TRYON_API_URL}${path}`);
  if (!response.ok) {
    return res.status(response.status).json({ message: 'Image not found.' });
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  res.set('Content-Type', response.headers.get('content-type') || 'image/png');
  return res.send(buffer);
}

function rewritePreviewUrls(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item?.preview_url) return item;
    // Python API: /api/person-image/... or /api/garment-image/...
    // Node proxy: /api/tryon/person-image/... or /api/tryon/garment-image/...
    const rewritten = item.preview_url
      .replace('/api/person-image/', '/api/tryon/person-image/')
      .replace('/api/garment-image/', '/api/tryon/garment-image/');
    return { ...item, preview_url: rewritten };
  });
}

// POST /api/tryon/save-snapshot
exports.saveSnapshot = async (req, res) => {
  try {
    const { product_id, snapshot_url } = req.body;
    if (!product_id || !snapshot_url) {
      return res.status(400).json({ message: 'Product ID and snapshot are required.' });
    }
    const session = await TryOnSession.create({
      user_id: req.user._id, product_id, snapshot_url
    });
    res.status(201).json({ message: 'Snapshot saved.', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/tryon/history
exports.getHistory = async (req, res) => {
  try {
    const sessions = await TryOnSession.find({ user_id: req.user._id })
      .populate('product_id', 'name image_url')
      .sort({ created_at: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/tryon/health — proxy to eCommerce Virtual Try-On API
exports.getHealth = async (req, res) => {
  try {
    const { status, data } = await proxyJson('/api/health');
    res.status(status).json(data);
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      model_loaded: false,
      message: 'Virtual Try-On API is not running. Start it on port 8000.',
      error: error.message
    });
  }
};

// GET /api/tryon/persons
exports.getPersons = async (req, res) => {
  try {
    const { status, data } = await proxyJson('/api/persons');
    res.status(status).json(rewritePreviewUrls(data));
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// GET /api/tryon/garments?garment_type=
exports.getGarments = async (req, res) => {
  try {
    const qs = req.query.garment_type != null ? `?garment_type=${req.query.garment_type}` : '';
    const { status, data } = await proxyJson(`/api/garments${qs}`);
    res.status(status).json(rewritePreviewUrls(data));
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// GET /api/tryon/garment-types
exports.getGarmentTypes = async (req, res) => {
  try {
    const { status, data } = await proxyJson('/api/garment-types');
    res.status(status).json(data);
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// GET /api/tryon/categories
exports.getCategories = async (req, res) => {
  try {
    const { status, data } = await proxyJson('/api/categories');
    res.status(status).json(data);
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// GET /api/tryon/person-image/:category/:index
exports.getPersonImage = async (req, res) => {
  try {
    const { category, index } = req.params;
    await proxyImage(`/api/person-image/${encodeURIComponent(category)}/${index}`, res);
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// GET /api/tryon/garment-image/:category/:index/:garment_type
exports.getGarmentImage = async (req, res) => {
  try {
    const { category, index, garment_type } = req.params;
    await proxyImage(
      `/api/garment-image/${encodeURIComponent(category)}/${index}/${garment_type}`,
      res
    );
  } catch (error) {
    res.status(503).json({ message: 'Try-On API unavailable.', error: error.message });
  }
};

// POST /api/tryon/ai-try-on — real AI try-on: customer's own photo + a garment photo (IDM-VTON)
exports.aiTryOn = async (req, res) => {
  const { person_image, garment_image, garment_image_url, garment_description, garment_category, denoise_steps, seed } = req.body;
  if (!person_image) {
    return res.status(400).json({ success: false, message: 'A photo of yourself is required.' });
  }
  if (!garment_image && !garment_image_url) {
    return res.status(400).json({ success: false, message: 'A garment image is required.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 170000); // IDM-VTON's free queue can be slow
  try {
    const response = await fetch(`${TRYON_API_URL}/api/ai-try-on`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person_image, garment_image, garment_image_url,
        garment_description: garment_description || '',
        garment_category: garment_category || '',
        denoise_steps: denoise_steps || 30,
        seed: seed ?? 42
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'AI try-on timed out. The free Hugging Face queue may be busy — please try again.'
      });
    }
    res.status(503).json({
      success: false,
      message: 'AI Try-On API unavailable. Make sure the eCommerce API is running.',
      error: error.message
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

// POST /api/tryon/virtual — perform AI virtual try-on
exports.virtualTryOn = async (req, res) => {
  try {
    const { person_category, person_index, garments, dressing_order, pose_transfer } = req.body;
    if (!person_category || person_index == null || !Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'person_category, person_index, and garments are required.'
      });
    }
    const { status, data } = await proxyJson('/api/try-on', {
      method: 'POST',
      body: JSON.stringify({
        person_category,
        person_index,
        garments,
        dressing_order: dressing_order || [2, 5, 1, 3],
        pose_transfer: pose_transfer || null
      })
    });
    res.status(status).json(data);
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Try-On API unavailable. Make sure the eCommerce API is running on port 8000.',
      error: error.message
    });
  }
};
