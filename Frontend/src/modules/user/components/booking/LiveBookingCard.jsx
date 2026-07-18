import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiMapPin, FiTool, FiCheckCircle, FiChevronRight, FiNavigation, FiX } from 'react-icons/fi';
import userBookingService from '../../../../services/bookingService';
import { userTheme } from '../../../../theme';
import RatingModal from './RatingModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../../../context/SocketContext';

const LiveBookingCard = ({ hasBottomNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when location changes (page changes)
  useEffect(() => {
    setIsDismissed(false);
  }, [location.pathname]);

  // Status mapping for UI
  const getStatusInfo = (status) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED':
        return { label: 'Worker Assigned', icon: FiCheckCircle, color: 'bg-blue-500', sub: 'Worker will start journey soon' };
      case 'STARTED':
      case 'JOURNEY_STARTED':
        return { label: 'Worker on the Way', icon: FiNavigation, color: 'bg-orange-500', sub: 'Track location live', pulse: true };
      case 'VISITED':
        return { label: 'Reached & Started Work', icon: FiMapPin, color: 'bg-green-500', sub: 'At your location • Work Started' };
      case 'IN_PROGRESS':
        return { label: 'Reached & Working', icon: FiTool, color: 'bg-purple-500', sub: 'Work successfully started' };
      case 'WORK_DONE':
        return { label: 'Work Completed', icon: FiCheckCircle, color: 'bg-green-600', sub: 'Review payment details' };
      // New Finding Status
      case 'REQUESTED':
      case 'SEARCHING':
        return { label: 'Finding Nearby Vendors', icon: FiClock, color: 'bg-teal-500', sub: 'Scanning within 10km...', pulse: true };
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchActiveBooking();

    if (socket) {
      socket.on('booking_updated', fetchActiveBooking);
      socket.on('notification', fetchActiveBooking);
    }

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchActiveBooking, 30000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('booking_updated', fetchActiveBooking);
        socket.off('notification', fetchActiveBooking);
      }
    };
  }, [socket]);

  const fetchActiveBooking = async () => {
    try {
      // Check if user is logged in before polling
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await userBookingService.getUserBookings({ limit: 5 });
      if (res.success && res.data.length > 0) {
        // Find the first booking that is in an active state (checking both cases to be safe)
        const ongoing = res.data.find(b => {
          const s = b.status?.toUpperCase();
          // Hide LiveBookingCard if status is WORK_DONE and review is already done
          if (s === 'WORK_DONE' && b.rating) return false;

          return ['STARTED', 'JOURNEY_STARTED', 'VISITED', 'IN_PROGRESS', 'WORK_DONE', 'SEARCHING', 'REQUESTED'].includes(s);
        });
        setActiveBooking(ongoing || null);
      }
    } catch (error) {
      // Failed to fetch active booking
      if (error.response?.status === 401) {
        // Token is dead, remove it to prevent 401 spam
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-show rating modal when work is marked done
  useEffect(() => {
    if (activeBooking && activeBooking.status?.toUpperCase() === 'WORK_DONE' && !activeBooking.rating && !showRatingModal) {
      const dismissed = localStorage.getItem(`rating_dismissed_live_${activeBooking._id}`);
      if (!dismissed) {
        setShowRatingModal(true);
      }
    }
  }, [activeBooking]);

  const handleRateSubmit = async (ratingData) => {
    try {
      const response = await userBookingService.addReview(activeBooking._id || activeBooking.id, ratingData);
      if (response.success) {
        toast.success('Thank you for your rating!', {
          icon: '🌟',
          style: { borderRadius: '15px', background: '#333', color: '#fff' }
        });
        setShowRatingModal(false);
        fetchActiveBooking(); // Refresh to hide card or update state
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  if (!activeBooking || isDismissed) return null;

  const statusInfo = getStatusInfo(activeBooking.status);
  if (!statusInfo) return null;

  const Icon = statusInfo.icon;

  return (
    <>
      {/* Global Rating Modal */}
      <RatingModal
        key="rating-modal"
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          if (activeBooking) {
            localStorage.setItem(`rating_dismissed_live_${activeBooking._id}`, 'true');
          }
        }}
        onSubmit={handleRateSubmit}
        bookingName={activeBooking.serviceName || 'Service'}
        workerName={activeBooking.workerId?.name || 'Worker'}
      />
    </>
  );
};

export default LiveBookingCard;
