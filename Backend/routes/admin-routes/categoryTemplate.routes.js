const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const categoryTemplateController = require('../../controllers/adminControllers/categoryTemplateController');

router.use(authenticate, isAdmin);

// GET /api/admin/category-templates - Get all templates
router.get('/', categoryTemplateController.getAllTemplates);

// GET /api/admin/category-templates/:code - Get single template by code
router.get('/:code', categoryTemplateController.getTemplateByCode);

// PUT /api/admin/category-templates/:id - Update template config (like blocks/schema)
router.put('/:id', categoryTemplateController.updateTemplate);

module.exports = router;
