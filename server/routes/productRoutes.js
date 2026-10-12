const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/productController');
const reviews = require('../controllers/reviewController');

router.get('/', ctrl.getAllProducts);
router.get('/analytics', auth, admin, ctrl.getProductAnalytics);
router.get('/suggest', ctrl.suggestProducts);
router.get('/:id', ctrl.getProduct);
router.get('/:id/related', ctrl.getRelated);
router.get('/:id/reviews', reviews.getReviews);
router.get('/:id/reviews/eligibility', auth, reviews.getEligibility);
router.post('/:id/reviews', auth, reviews.saveReview);
router.delete('/:id/reviews', auth, reviews.deleteReview);
router.get('/:id/overlay', ctrl.getOverlay);
router.post('/', auth, admin, ctrl.createProduct);
router.put('/:id', auth, admin, ctrl.updateProduct);
router.delete('/:id', auth, admin, ctrl.deleteProduct);

module.exports = router;
