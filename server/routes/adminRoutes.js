const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/adminController');

router.get('/stats', auth, admin, ctrl.getStats);
router.get('/users', auth, admin, ctrl.getAllUsers);
router.put('/users/:id', auth, admin, ctrl.updateUser);
router.delete('/users/:id', auth, admin, ctrl.deleteUser);
router.get('/analytics/sales', auth, admin, ctrl.getSalesAnalytics);
router.get('/analytics/products', auth, admin, ctrl.getProductAnalytics);
router.get('/analytics/users', auth, admin, ctrl.getUserAnalytics);
router.get('/analytics/orders', auth, admin, ctrl.getOrderStatusAnalytics);

module.exports = router;
