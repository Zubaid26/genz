const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/couponController');

router.get('/', auth, admin, ctrl.getCoupons);
router.post('/', auth, admin, ctrl.createCoupon);
router.put('/:id', auth, admin, ctrl.updateCoupon);
router.delete('/:id', auth, admin, ctrl.deleteCoupon);

module.exports = router;
