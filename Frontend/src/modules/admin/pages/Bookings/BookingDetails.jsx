import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiClock, FiCheckCircle, FiXCircle, FiUser, FiBriefcase,
  FiMapPin, FiCreditCard, FiDollarSign, FiTrash2, FiActivity, FiCpu
} from 'react-icons/fi';
import { adminBookingService } from '../../../../services/adminBookingService';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/adminHelpers';

const statusBadgeClass = (status) => {
  const s = (status || 'OTHER').toUpperCase();
  const map = {
    ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    VISITED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    WORK_DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FINAL_SETTLEMENT: 'bg-purple-100 text-purple-700 border-purple-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    CANCELED: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[s] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await adminBookingService.getBookingById(id);
      if (res.success) {
        setBooking(res.data);
      } else {
        toast.error(res.message || 'Failed to load booking details');
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error(error.message || 'Error fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    try {
      setCancelling(true);
      const res = await adminBookingService.cancelBooking(id, cancelReason);
      if (res.success) {
        toast.success('Booking cancelled successfully');
        setShowCancelModal(false);
        fetchBookingDetails();
      } else {
        toast.error(res.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Error cancelling booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
        <FiXCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Booking Not Found</h3>
        <p className="text-gray-500 text-sm mb-6">The requested booking does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors"
        >
          Go Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <FiArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-800">
                Booking Details
              </h2>
              <span className="text-xs font-bold text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                #{booking.bookingNumber || booking._id}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Created on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => navigate('/admin/bookings/tracking', { state: { selectedOrderId: booking._id } })}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <FiActivity className="w-3.5 h-3.5" /> Track Booking
          </button>
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FiTrash2 className="w-3.5 h-3.5" /> Cancel Booking
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiCpu className="text-green-500" /> Service & Schedule Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Service Category</p>
                <p className="text-sm font-semibold text-gray-700">{booking.categoryId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Sub-Category</p>
                <p className="text-sm font-semibold text-gray-700">{booking.subCategoryId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Specific Service</p>
                <p className="text-sm font-semibold text-gray-700">{booking.serviceId?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadgeClass(booking.status)}`}>
                  {booking.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Scheduled Date</p>
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mt-1">
                  <FiClock className="text-gray-400 w-3.5 h-3.5" />
                  {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Flexible'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Scheduled Time Slot</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {booking.scheduledTime || (booking.timeSlot?.start ? `${booking.timeSlot.start} - ${booking.timeSlot.end}` : 'Flexible')}
                </p>
              </div>
            </div>

            {booking.notes && (
              <div className="pt-2">
                <p className="text-[10px] uppercase font-bold text-gray-400">Customer Instructions / Notes</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-1">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Booked Items (If any) */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Booked Items</h3>
            {booking.items && booking.items.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {booking.items.map((item, index) => (
                  <div key={index} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-700">{item.name || item.title || 'Item'}</p>
                      <p className="text-gray-400">Quantity: {item.quantity || 1}</p>
                    </div>
                    <span className="font-bold text-gray-800">{formatCurrency(item.price || 0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No specific items listed. Basic service selected.</p>
            )}
          </div>

          {/* Address & Geographic Details */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiMapPin className="text-blue-500" /> Location & Service Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase font-bold text-gray-400">Full Address</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {typeof booking.address === 'string' ? booking.address : (
                    booking.address ? `${booking.address.addressLine2 ? booking.address.addressLine2 + ', ' : ''}${booking.address.addressLine1 || ''}, ${booking.address.city || ''}` : 'Address not provided'
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Coordinates</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  Lat: {booking.address?.lat || 'N/A'}<br />
                  Lng: {booking.address?.lng || 'N/A'}
                </p>
              </div>
            </div>
            {booking.address?.lat && booking.address?.lng && (
              <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${booking.address.lat},${booking.address.lng}&z=15&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Roles & Billing */}
        <div className="space-y-6">
          {/* People Involved (Customer, Vendor, Worker) */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Parties Involved</h3>

            {/* Customer Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <FiUser className="text-green-600" /> Customer
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-800">{booking.userId?.name || 'Guest'}</p>
                <p className="text-xs text-gray-600">{booking.userId?.phone || booking.customerPhone || 'Phone hidden'}</p>
                <p className="text-xs text-gray-500 truncate">{booking.userId?.email || 'No email'}</p>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <FiBriefcase className="text-blue-600" /> Vendor
              </div>
              {booking.vendorId ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm font-bold text-gray-800">{booking.vendorId.name || 'Vendor'}</p>
                  {booking.vendorId.businessName && (
                    <p className="text-xs text-blue-700 font-semibold">{booking.vendorId.businessName}</p>
                  )}
                  <p className="text-xs text-gray-600">{booking.vendorId.phone || 'Phone hidden'}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.vendorId.email || 'No email'}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic px-2">No vendor accepted yet.</p>
              )}
            </div>

            {/* Worker Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <FiUser className="text-indigo-600" /> Worker Assigned
              </div>
              {booking.workerId ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm font-bold text-gray-800">{booking.workerId.name || 'Worker'}</p>
                  <p className="text-xs text-gray-600">{booking.workerId.phone || 'Phone hidden'}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic px-2">
                  {booking.vendorId ? 'Vendor doing self or worker not assigned.' : 'Pending vendor acceptance.'}
                </p>
              )}
            </div>
          </div>

          {/* Billing & Settlement Details */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiCreditCard className="text-green-600" /> Pricing & Settlement
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Base Service Price:</span>
                <span className="font-semibold text-gray-700">{formatCurrency(booking.basePrice || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>GST Tax (18%):</span>
                <span className="font-semibold text-gray-700">{formatCurrency(booking.tax || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Visiting/Visitation Charges:</span>
                <span className="font-semibold text-gray-700">{formatCurrency(booking.visitingCharges || booking.visitationFee || 0)}</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-xs text-red-500">
                  <span>Discounts Applied:</span>
                  <span className="font-semibold">-{formatCurrency(booking.discount || 0)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-sm font-bold text-gray-800">
                <span>Grand Total:</span>
                <span className="text-green-600">{formatCurrency(booking.finalAmount || 0)}</span>
              </div>
            </div>

            {/* Split Details */}
            <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 bg-gray-50/50 p-2.5 rounded-lg text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Admin Commission:</span>
                <span className="font-bold text-gray-800">{formatCurrency(booking.adminCommission || booking.commission || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Vendor Earnings:</span>
                <span className="font-bold text-green-700">{formatCurrency(booking.vendorEarnings || 0)}</span>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <p className="text-[9px] uppercase font-bold text-gray-400">Payment Method</p>
                <p className="font-semibold text-gray-700 capitalize mt-0.5">{booking.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <p className="text-[9px] uppercase font-bold text-gray-400">Payment Status</p>
                <p className="font-semibold text-gray-700 capitalize mt-0.5">{booking.paymentStatus || 'PENDING'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800">Cancel Booking</h3>
            <p className="text-xs text-gray-500">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain the reason for cancellation..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                disabled={cancelling}
              >
                No, Keep it
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookingDetails;
