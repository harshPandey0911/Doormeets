const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');
const { 
  createTicket, 
  getMyTickets, 
  getTicketDetails, 
  replyToTicket 
} = require('../../controllers/userControllers/userSupportController');

// All routes require user authentication
router.use(authenticate, isUser);

router.post('/tickets', createTicket);
router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getTicketDetails);
router.post('/tickets/:id/reply', replyToTicket);

module.exports = router;
