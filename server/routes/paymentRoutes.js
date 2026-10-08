const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/paymentController');

router.post('/create-intent', auth, ctrl.createPaymentIntent);

module.exports = router;
