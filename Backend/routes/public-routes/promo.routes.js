const express = require('express');
const router = express.Router();
const { applyPromo } = require('../../controllers/adminControllers/promoController');

// Public route to apply/verify promo code at checkout
router.post('/apply', applyPromo);

module.exports = router;
