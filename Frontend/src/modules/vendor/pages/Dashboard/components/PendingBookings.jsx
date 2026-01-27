import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiMapPin, FiBell } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../../theme';
import { toast } from 'react-hot-toast';
import { acceptBooking, rejectBooking } from '../../../services/bookingService';

const PendingBookings = memo(({ bookings, setPendingBookings, setActiveAlertBooking }) => {
  const navigate = useNavigate();

  if (bookings.length === 0) {
    return null;
  }

  const handleAcceptBooking = async (e, booking) => {
    e.stopPropagation();
    try {
      await acceptBooking(booking.id);

      // Remove this booking from pending list
      setPendingBookings(prev => prev.filter(b => b.id !== booking.id));

      // Sync localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updated = pendingJobs.filter(b => b.id !== booking.id);
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

      // Dispatch stats update event
      window.dispatchEvent(new Event('vendorStatsUpdated'));
      toast.success('Booking accepted successfully!');
    } catch (error) {
      console.error('Error accepting:', error);
      toast.error('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (e, booking) => {
    e.stopPropagation();
    try {
      await rejectBooking(booking.id, 'Vendor Dashboard Reject');

      setPendingBookings(prev => prev.filter(b => b.id !== booking.id));

      // Sync localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updated = pendingJobs.filter(b => b.id !== booking.id);
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));
      toast.success('Booking rejected');
      navigate('/vendor/jobs');
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject booking');
      navigate('/vendor/jobs');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-800">Pending Alerts</h2>
        <button
          onClick={() => navigate('/vendor/booking-alerts')}
          className="text-sm font-medium"
          style={{ color: themeColors.button }}
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => setActiveAlertBooking(booking)}
            className="bg-white rounded-xl p-4 shadow-md cursor-pointer active:scale-98 transition-transform border-l-4"
            style={{
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
              borderLeftColor: '#F59E0B',
              borderTop: '1px solid rgba(245, 158, 11, 0.2)',
              borderRight: '1px solid rgba(245, 158, 11, 0.2)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{booking.serviceType || 'New Booking Request'}</p>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">
                    REQUEST
                  </span>
                </div>
                <p className="text-sm text-gray-600">{booking.customerName || 'Customer'}</p>
                <p className="text-sm text-gray-600 mt-1">{booking.location?.address || 'Location'}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiBell className="w-5 h-5 animate-pulse" style={{ color: '#F59E0B' }} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FiClock className="w-4 h-4" />
                <span>
                  {booking.timeSlot?.date ? `${booking.timeSlot.date} • ` : ''}
                  {booking.timeSlot?.time || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FiMapPin className="w-4 h-4" />
                <span>{booking.location?.distance || 'N/A'} km</span>
              </div>
              <div className="text-sm font-bold text-gray-800">
                ₹{booking.price || 0}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => handleAcceptBooking(e, booking)}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={(e) => handleRejectBooking(e, booking)}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PendingBookings.displayName = 'VendorPendingBookings';

export default PendingBookings;
