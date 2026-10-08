const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/cartController');

router.get('/', auth, ctrl.getCart);
router.post('/add', auth, ctrl.addToCart);
router.put('/update/:itemId', auth, ctrl.updateCartItem);
router.delete('/remove/:itemId', auth, ctrl.removeFromCart);
router.delete('/clear', auth, ctrl.clearCart);

module.exports = router;
