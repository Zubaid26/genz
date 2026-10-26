const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/tryonController');

// Snapshot history
router.post('/save-snapshot', auth, ctrl.saveSnapshot);
router.get('/history', auth, ctrl.getHistory);

// eCommerce Virtual Try-On API (FASHN VTON v1.5, proxied)
router.get('/health', ctrl.getHealth);
router.post('/ai-try-on', auth, ctrl.aiTryOn);

module.exports = router;
