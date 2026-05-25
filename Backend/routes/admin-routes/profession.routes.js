const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllProfessions,
  getProfessionById,
  createProfession,
  updateProfession,
  deleteProfession
} = require('../../controllers/adminControllers/professionController');

router.get('/', authenticate, isAdmin, getAllProfessions);
router.get('/:id', authenticate, isAdmin, getProfessionById);
router.post('/', authenticate, isAdmin, createProfession);
router.put('/:id', authenticate, isAdmin, updateProfession);
router.delete('/:id', authenticate, isAdmin, deleteProfession);

module.exports = router;
