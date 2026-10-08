const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/orderController');

router.post('/place', auth, ctrl.placeOrder);
router.get('/:id/invoice', auth, ctrl.getInvoice);
router.get('/:id', auth, ctrl.getOrder);
router.get('/', auth, admin, ctrl.getAllOrders);
router.put('/:id/status', auth, admin, ctrl.updateOrderStatus);

module.exports = router;
