const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getAllProducts);
router.get('/analytics', auth, admin, ctrl.getProductAnalytics);
router.get('/:id', ctrl.getProduct);
router.get('/:id/overlay', ctrl.getOverlay);
router.post('/', auth, admin, ctrl.createProduct);
router.put('/:id', auth, admin, ctrl.updateProduct);
router.delete('/:id', auth, admin, ctrl.deleteProduct);

module.exports = router;
