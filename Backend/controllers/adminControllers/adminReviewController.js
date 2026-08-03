const Review = require('../../models/Review');
const Booking = require('../../models/Booking');
const { getBookingQueryFilter } = require('../../utils/adminFilterHelper');

/**
 * Get all reviews with pagination and filters
 */
exports.getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      rating,
      vendorId,
      serviceId,
      userId
    } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }
    if (rating) query.rating = parseInt(rating);
    if (vendorId) query.vendorId = vendorId;
    if (serviceId) query.serviceId = serviceId;
    if (userId) query.userId = userId;

    const bookingFilter = await getBookingQueryFilter(req.user);
    Object.assign(query, bookingFilter);

    // Auto-migration / Sync: Ensure all bookings with rating exist in Review collection
    const bookingsWithReviews = await Booking.find({
      rating: { $exists: true, $ne: null }
    });

    if (bookingsWithReviews.length > 0) {
      const ops = bookingsWithReviews.map(booking => ({
        updateOne: {
          filter: { bookingId: booking._id },
          update: {
            $setOnInsert: {
              bookingId: booking._id,
              userId: booking.userId,
              serviceId: booking.serviceId,
              vendorId: booking.vendorId,
              workerId: booking.workerId,
              rating: booking.rating,
              review: booking.review || '',
              images: booking.reviewImages || [],
              status: booking.isReviewHidden ? 'hidden' : (booking.isReviewDeleted ? 'deleted' : 'active'),
              createdAt: booking.reviewedAt || booking.updatedAt
            }
          },
          upsert: true
        }
      }));
      await Review.bulkWrite(ops).catch(err => console.error('Review sync bulkWrite error:', err));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('userId', 'name phone email profilePhoto')
      .populate('vendorId', 'businessName name phone')
      .populate('serviceId', 'title iconUrl name')
      .populate('workerId', 'name phone')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber status serviceName vendorId serviceId subCategoryId',
        populate: [
          { path: 'vendorId', select: 'businessName name phone' },
          { path: 'serviceId', select: 'title iconUrl name' },
          { path: 'subCategoryId', select: 'title name' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

/**
 * Update review status (active, hidden, deleted)
 */
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Fallback: If not found in Review model by id, try finding by bookingId
    if (!review) {
      review = await Review.findOneAndUpdate(
        { bookingId: id },
        { status },
        { new: true }
      );
    }

    // Fallback 2: If still not found, check if a Booking exists with this ID and create/update Review
    if (!review) {
      const booking = await Booking.findById(id);
      if (booking && booking.rating) {
        review = await Review.create({
          bookingId: booking._id,
          userId: booking.userId,
          serviceId: booking.serviceId,
          vendorId: booking.vendorId,
          workerId: booking.workerId,
          rating: booking.rating,
          review: booking.review || '',
          images: booking.reviewImages || [],
          status,
          createdAt: booking.reviewedAt || booking.updatedAt
        });
      }
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Sync with Booking model if booking exists
    if (review.bookingId) {
      await Booking.findByIdAndUpdate(review.bookingId, {
        isReviewHidden: status === 'hidden',
        isReviewDeleted: status === 'deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: `Review status updated to ${status}`,
      data: review
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
};

/**
 * Get review statistics
 */
exports.getReviewStats = async (req, res) => {
  try {
    const matchFilter = await getBookingQueryFilter(req.user);

    const stats = await Review.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        }
      }
    ]);

    const statusStats = await Review.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || { averageRating: 0, totalReviews: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
      statusStats
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics'
    });
  }
};
