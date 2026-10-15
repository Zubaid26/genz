const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/tryonController');

// Existing snapshot routes
router.post('/save-snapshot', auth, ctrl.saveSnapshot);
router.get('/history', auth, ctrl.getHistory);

// eCommerce Virtual Try-On API (proxied)
router.get('/health', ctrl.getHealth);
router.get('/persons', ctrl.getPersons);
router.get('/garments', ctrl.getGarments);
router.get('/garment-types', ctrl.getGarmentTypes);
router.get('/categories', ctrl.getCategories);
router.get('/person-image/:category/:index', ctrl.getPersonImage);
router.get('/garment-image/:category/:index/:garment_type', ctrl.getGarmentImage);
router.post('/virtual', auth, ctrl.virtualTryOn);

module.exports = router;
