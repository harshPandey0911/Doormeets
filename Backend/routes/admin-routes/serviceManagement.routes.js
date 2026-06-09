const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getPageBlocks,
  savePageBlocks
} = require('../../controllers/adminControllers/serviceController');

const serviceValidation = [
  body('categoryId').optional({ checkFalsy: true }).isMongoId().withMessage('Valid Category ID is required'),
  body('title').notEmpty().withMessage('Title is required')
];

router.get('/services', authenticate, isAdmin, getAllServices);
router.get('/services/:id', authenticate, isAdmin, getServiceById);
router.post('/services', authenticate, isAdmin, serviceValidation, createService);
router.put('/services/:id', authenticate, isAdmin, updateService);
router.delete('/services/:id', authenticate, isAdmin, deleteService);

// Page Builder blocks routes
router.get('/services/:id/page-blocks', authenticate, isAdmin, getPageBlocks);
router.put('/services/:id/page-blocks', authenticate, isAdmin, savePageBlocks);

module.exports = router;
