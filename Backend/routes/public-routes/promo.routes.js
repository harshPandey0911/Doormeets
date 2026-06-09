const express = require('express');
const router = express.Router();
const { applyPromo, getActivePublicPromos } = require('../../controllers/adminControllers/promoController');

// Public route to apply/verify promo code at checkout
router.post('/apply', applyPromo);

// Public route to list all active promo codes
router.get('/', getActivePublicPromos);

module.exports = router;
