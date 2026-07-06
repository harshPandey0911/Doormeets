const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  getTemplateUsage
} = require('../../controllers/adminControllers/propertyTemplateController');

// Secure all routes with admin middleware
router.use(authenticate, isAdmin);

router.route('/templates')
  .get(getTemplates)
  .post(createTemplate);

router.route('/templates/:id')
  .get(getTemplateById)
  .put(updateTemplate)
  .delete(deleteTemplate);

router.route('/templates/:id/duplicate')
  .post(duplicateTemplate);

router.route('/templates/:id/analytics')
  .get(getTemplateUsage);

module.exports = router;
