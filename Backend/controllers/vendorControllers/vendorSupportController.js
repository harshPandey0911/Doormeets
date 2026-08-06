const Ticket = require('../../models/Ticket');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * Create a new support ticket
 */
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message, attachment, relatedBookingId } = req.body;
    const vendorId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    let attachmentUrl = null;
    if (attachment && attachment.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(attachment, { folder: 'support/tickets' });
      if (uploadRes.success) {
        attachmentUrl = uploadRes.url;
      }
    }

    const ticket = new Ticket({
      creatorRole: 'vendor',
      creatorId: vendorId,
      creatorModel: 'Vendor',
      zoneId: req.user?.zoneId || (req.user?.zoneIds && req.user.zoneIds[0]) || null,
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      relatedBookingId: relatedBookingId || null,
      messages: [{
        sender: 'vendor',
        senderId: vendorId,
        senderModel: 'Vendor',
        message: message,
        attachment: attachmentUrl
      }]
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

/**
 * Get all tickets for current vendor
 */
const getMyTickets = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { creatorId: vendorId, creatorRole: 'vendor' };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await Ticket.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

/**
 * Get single ticket details
 */
const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const ticket = await Ticket.findOne({ _id: id, creatorId: vendorId });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

/**
 * Reply to a ticket
 */
const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachment } = req.body;
    const vendorId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const ticket = await Ticket.findOne({ _id: id, creatorId: vendorId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed ticket' });
    }

    let attachmentUrl = null;
    if (attachment && attachment.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(attachment, { folder: 'support/tickets' });
      if (uploadRes.success) {
        attachmentUrl = uploadRes.url;
      }
    }

    // Add message
    ticket.messages.push({
      sender: 'vendor',
      senderId: vendorId,
      senderModel: 'Vendor',
      message: message,
      attachment: attachmentUrl
    });

    // Update status if it was waiting on user
    if (ticket.status === 'waiting_on_user') {
      ticket.status = 'open'; // or in_progress
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      ticket
    });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketDetails,
  replyToTicket
};
