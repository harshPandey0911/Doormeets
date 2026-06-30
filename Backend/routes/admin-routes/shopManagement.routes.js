const express = require('express');
const router = express.Router();
const {
  getAllShopOwners,
  getShopOwnerDetails,
  updateShopOwnerStatus,
  adjustShopOwnerWallet
} = require('../../controllers/adminControllers/adminShopController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Protect all routes with admin check
router.use(authenticate, isAdmin);

router.get('/', getAllShopOwners);
router.get('/:id', getShopOwnerDetails);
router.put('/:id/status', updateShopOwnerStatus);
router.post('/:id/wallet-adjust', adjustShopOwnerWallet);

module.exports = router;
