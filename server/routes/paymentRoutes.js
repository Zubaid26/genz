const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/paymentController');

router.get('/methods', auth, ctrl.getMethods);
router.post('/initiate', auth, ctrl.initiatePayment);

module.exports = router;
