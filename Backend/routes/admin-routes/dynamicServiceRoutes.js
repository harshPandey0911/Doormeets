const express = require('express');
const router = express.Router();
const dynamicServiceController = require('../../controllers/adminControllers/dynamicServiceController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

router.use(authenticate);
router.use(isAdmin);

router.route('/:serviceId/fields')
  .get(dynamicServiceController.getFields)
  .post(dynamicServiceController.saveFields);

router.route('/:serviceId/workflow')
  .get(dynamicServiceController.getWorkflow)
  .post(dynamicServiceController.saveWorkflow);

router.route('/:serviceId/pricing')
  .get(dynamicServiceController.getPricing)
  .post(dynamicServiceController.savePricing);

router.post('/:serviceId/apply-template', dynamicServiceController.applyTemplate);

module.exports = router;
