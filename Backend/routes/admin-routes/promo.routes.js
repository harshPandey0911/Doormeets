const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, hasPermission } = require('../../middleware/roleMiddleware');
const {
  createPromo,
  getAllPromos,
  updatePromo,
  deletePromo
} = require('../../controllers/adminControllers/promoController');

// All routes require authentication, admin role and promo management permission
router.use(authenticate, isAdmin, hasPermission('manage_promos'));

router.post('/', createPromo);
router.get('/', getAllPromos);
router.put('/:id', updatePromo);
router.delete('/:id', deletePromo);

module.exports = router;
