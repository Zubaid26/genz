const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/authController');

router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], ctrl.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], ctrl.login);

router.post('/logout', ctrl.logout);
router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, ctrl.updateProfile);
router.get('/wishlist', auth, ctrl.getWishlist);
router.post('/wishlist/:id', auth, ctrl.addToWishlist);
router.delete('/wishlist/:id', auth, ctrl.removeFromWishlist);
router.get('/orders', auth, ctrl.getOrderHistory);

module.exports = router;
