const TryOnSession = require('../models/TryOnSession');

const TRYON_API_URL = process.env.TRYON_API_URL || 'http://localhost:2000';

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

// GET /api/tryon/health — proxy to eCommerce Virtual Try-On API (FASHN VTON v1.5)
exports.getHealth = async (req, res) => {
  try {
    const { status, data } = await proxyJson('/api/health');
    res.status(status).json(data);
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      model_loaded: false,
      message: 'Virtual Try-On API is not running. Start it on port 2000.',
      error: error.message
    });
  }
};

// POST /api/tryon/ai-try-on — real AI try-on: customer's own photo + a garment photo (FASHN VTON v1.5)
exports.aiTryOn = async (req, res) => {
  const { person_image, garment_image, garment_image_url, garment_description, garment_category, denoise_steps, seed } = req.body;
  if (!person_image) {
    return res.status(400).json({ success: false, message: 'A photo of yourself is required.' });
  }
  if (!garment_image && !garment_image_url) {
    return res.status(400).json({ success: false, message: 'A garment image is required.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 170000);
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
        message: 'AI try-on timed out. Please try again.'
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
