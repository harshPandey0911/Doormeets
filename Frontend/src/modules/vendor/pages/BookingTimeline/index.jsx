import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiClock, FiUser, FiMapPin, FiTool, FiDollarSign, FiFileText, FiCheckCircle, FiX, FiChevronDown, FiChevronUp, FiPhone, FiMail, FiCalendar, FiPackage, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { getBookingById, updateBookingStatus, startSelfJob, verifySelfVisit, completeSelfJob, collectSelfCash, payWorker } from '../../services/bookingService';
import { CashCollectionModal, ConfirmDialog } from '../../components/common';
import WorkCompletionModal from '../../components/common/WorkCompletionModal';
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';

const BookingTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isWorkDoneModalOpen, setIsWorkDoneModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState(['', '', '', '']);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [workPhotos, setWorkPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isWorkApproved, setIsWorkApproved] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (key) => setOpenDropdown(prev => prev === key ? null : key);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await getBookingById(id);
        const apiData = response.data || response;

        const isSelfJob = apiData.isSelfJob === true || (apiData.assignedAt && !apiData.workerId);
        const mappedBooking = {
          ...apiData,
          id: apiData._id || apiData.id,
          isSelfJob,
          assignedTo: apiData.workerId ? { name: apiData.workerId.name } : (apiData.assignedAt ? { name: 'You (Self)' } : null),
          location: {
            address: apiData.address?.addressLine1 || apiData.location?.address || 'Address not available',
            lat: apiData.address?.lat || apiData.location?.lat,
            lng: apiData.address?.lng || apiData.location?.lng
          },
          status: apiData.status,
          // Timeline mapping if backend supports it, otherwise derived from status/timestamps
          timeline: [
            { stage: 1, timestamp: apiData.createdAt },
            { stage: 2, timestamp: apiData.acceptedAt },
            { stage: 3, timestamp: apiData.assignedAt },
            { stage: 4, timestamp: apiData.startedAt }, // Assuming started means visited for now? Or keep null
            { stage: 5, timestamp: apiData.completedAt }, // Simplified mapping
          ]
        };
        setBooking(mappedBooking);

        // Determine current stage based on status
        // Determine current stage based on status
        const statusMap = {
          'requested': 1,
          'searching': 1,
          'confirmed': 2,
          'assigned': 3,
          'journey_started': 4,
          'visited': 5,
          'in_progress': 5,
          'work_done': 7,
          'completed': 8,
        };

        const isActuallyPaid = apiData.isWorkerPaid || apiData.workerPaymentStatus === 'PAID' || apiData.workerPaymentStatus === 'SUCCESS';
        const isSettled = apiData.finalSettlementStatus === 'DONE';

        // Custom logic for later stages
        let stage = statusMap[apiData.status] || 2;
        if (apiData.status === 'completed') {
          // If worker job, jump to end (Stage 11) because intermediate payment steps are hidden/simplified
          if (!isSelfJob) {
            stage = 11;
          } else {
            // For self-jobs, follow the settlement flow
            if (isSettled) stage = 11; // Final tick
            else stage = 9; // Final Settlement stage
          }
        }

        setCurrentStage(stage);
      } catch (error) {
        console.error('Error loading booking:', error);
      }
    };

    loadBooking();

    const handleUpdate = () => {
      loadBooking();
    };

    window.addEventListener('vendorJobsUpdated', handleUpdate);
    return () => window.removeEventListener('vendorJobsUpdated', handleUpdate);
  }, [id, isWorkApproved]);

  // Handle modal closing if payment is detected
  useEffect(() => {
    if (booking?.paymentStatus === 'SUCCESS') {
      // payment was successful
    }
  }, [booking?.paymentStatus]);

  /* Handlers */
  const handleWorkerPayment = async () => {
    // Determine payment type
    const confirmMsg = booking?.cashCollected
      ? `Worker has collected ₹${booking.finalAmount}. Confirm payment of ₹${booking.vendorEarnings} to worker?`
      : `Confirm payment of ₹${booking.vendorEarnings} to the worker?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Pay Worker',
      message: confirmMsg,
      type: 'info',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await payWorker(id);
          toast.success('Worker payment processed successfully');
          window.location.reload();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Payment failed');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleApproveWork = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Work',
      message: "Approve worker's work and proceed to settlement?",
      type: 'info',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await updateBookingStatus(id, 'completed');
          toast.success('Work approved successfully');
          window.location.reload();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Approval failed');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleFinalSettlement = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Final Settlement',
      message: 'Mark final settlement as done? This will allow you to complete the booking.',
      type: 'warning',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          // Using existing updateBookingStatus to mark settlement
          await updateBookingStatus(id, booking.status, { finalSettlementStatus: 'DONE' });
          toast.success('Final settlement completed!');
          window.location.reload();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Final settlement failed');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };



  const isStartJourneyDisabled = () => {
    if (!booking || !booking.scheduledDate) return false;
    if (booking.bookingType === 'instant' || booking.scheduledTime === 'ASAP') return false;

    try {
      const schedDateObj = new Date(booking.scheduledDate);
      const timeStr = booking.scheduledTime || "";
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];
        
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
          }
          if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        schedDateObj.setHours(hours, minutes, 0, 0);
      }
      
      const now = new Date();
      const diffMs = schedDateObj.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      return diffMs > oneHourInMs;
    } catch (e) {
      console.error("Error checking journey start time:", e);
      return false;
    }
  };

  const handleStartSelfJob = async () => {
    try {
      setActionLoading(true);
      await startSelfJob(id);
      toast.success('Journey Started');
      navigate(`/vendor/booking/${id}/map`);
    } catch (error) {
      toast.error('Failed to start journey');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyVisit = async () => {
    const otp = otpInput.join('');
    if (otp.length !== 4) return toast.error('Enter 4-digit OTP');

    setActionLoading(true);
    // Location check for vendor? Optional or same as worker.
    if (!navigator.geolocation) return toast.error('Geolocation required');

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        await verifySelfVisit(id, otp, location);
        toast.success('Visit Verified');
        setIsVisitModalOpen(false);
        window.location.reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Verification failed');
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleCompleteWork = async (photos = []) => {
    try {
      setActionLoading(true);
      await completeSelfJob(id, { workPhotos: photos });
      toast.success('Work marked done');
      setIsWorkDoneModalOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  async function handleVisitSite() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.location?.lat || 22.7196},${booking.location?.lng || 75.8577}`;
    window.open(url, '_blank');

    try {
      await updateBookingStatus(id, 'visited');
      setCurrentStage(4);
      // Reload booking to get latest state
      const response = await getBookingById(id);
      setBooking(prev => ({ ...prev, status: response.data.status }));
    } catch (error) {
      console.error('Error updating status to visited:', error);
      // alert('Failed to update status');
    }
  }

  const handleWorkDone = async () => {
    try {
      setActionLoading(true);
      // If it's a worker job, go directly to 'completed' to skip billing for user
      const targetStatus = booking?.isSelfJob ? 'work_done' : 'completed';

      await updateBookingStatus(id, targetStatus);
      toast.success(booking?.isSelfJob ? 'Work marked as done' : 'Booking completed successfully');

      // Refresh data
      const response = await getBookingById(id);
      const apiData = response.data || response;
      setBooking({
        ...apiData,
        id: apiData._id || apiData.id,
        isSelfJob: apiData.isSelfJob || (apiData.assignedAt && !apiData.workerId)
      });
      window.location.reload();
    } catch (error) {
      console.error('Error updating status to work done:', error);
      toast.error('Failed to update status. Please follow valid status flow.');
    } finally {
      setActionLoading(false);
    }
  }

  const timelineStages = [
    {
      id: 1,
      title: 'Booking Requested',
      icon: FiClock,
      action: null,
      description: 'Booking request received',
    },
    {
      id: 2,
      title: (booking?.isBidding && booking?.status === 'bidding') ? 'USER IS WAITING' : 'Booking Accepted',
      icon: (booking?.isBidding && booking?.status === 'bidding') ? FiClock : FiCheck,
      action: null,
      description: (booking?.isBidding && booking?.status === 'bidding')
        ? 'User is comparing quotes. Waiting for 5 mins.'
        : 'You accepted the booking',
    },
    {
      id: 3,
      title: 'Assigned',
      icon: FiUser,
      // Block assignment if still bidding
      action: (currentStage === 2 && booking?.status !== 'bidding') ? () => navigate(`/vendor/booking/${id}/assign-worker`) : null,
      description: booking?.assignedTo ? `Assigned to ${booking.assignedTo.name}` : 'Assign worker or start yourself',
    },
    {
      id: 4,
      title: 'Journey Started',
      icon: FiMapPin,
      action: (currentStage === 3 && booking?.isSelfJob) ? handleStartSelfJob : null,
      description: booking?.isSelfJob ? 'You started journey' : (booking?.assignedTo ? 'Worker started journey' : 'Waiting for journey start'),
    },
    {
      id: 5,
      title: 'Visited Site',
      icon: FiMapPin,
      action: (currentStage === 4 && booking?.isSelfJob) ? () => setIsVisitModalOpen(true) : null,
      description: 'Arrived at location',
    },
    {
      id: 6,
      title: 'Work Done',
      icon: FiTool,
      action: (() => {
        // For self job, show the photo modal (the 'old' way)
        if (booking?.isSelfJob) {
          return currentStage === 5 ? () => setIsWorkDoneModalOpen(true) : null;
        }
        // For worker job, just mark it done directly (the 'simple' way)
        return (booking?.assignedTo && currentStage >= 3 && booking?.status !== 'work_done' && booking?.status !== 'completed')
          ? handleWorkDone
          : null;
      })(),
      description: 'Service work completed',
    },
    {
      id: 7,
      title: booking?.isSelfJob ? 'Collect Payment' : 'Approve Worker Work',
      icon: FiCheckCircle,
      action: (() => {
        const isPaid = ['success', 'paid', 'completed'].includes(booking?.paymentStatus?.toLowerCase());
        if (booking?.status === 'completed' || booking?.status === 'COMPLETED') return null;

        if (isPaid && currentStage === 7) {
          return async () => {
            try {
              setActionLoading(true);
              await updateBookingStatus(id, 'completed');
              toast.success('Booking completed successfully');
              window.location.reload();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to complete booking');
            } finally {
              setActionLoading(false);
            }
          };
        }

        if (booking?.isSelfJob && currentStage === 7) {
          return () => navigate(`/vendor/booking/${id}`);
        }

        if (!booking?.isSelfJob && currentStage === 7) {
          return handleApproveWork;
        }
        return null;
      })(),
      description: booking?.isSelfJob ? 'Collect cash and complete booking' : 'Review and approve worker work',
    },
    {
      id: 8,
      title: 'Pay Worker',
      icon: FiDollarSign,
      action: (currentStage === 8 && !['paid', 'success', 'completed'].includes(booking?.workerPaymentStatus?.toLowerCase() || '')) ? handleWorkerPayment : null,
      description: ['paid', 'success', 'completed'].includes(booking?.workerPaymentStatus?.toLowerCase() || '') ? 'Worker Paid' : 'Settle payment with worker',
    },
    {
      id: 9,
      title: 'Final Settlement',
      icon: FiFileText,
      action: (currentStage === 9) ? handleFinalSettlement : null,
      description: booking?.finalSettlementStatus === 'DONE' ? 'Settlement Done' : 'Complete final settlement',
    },
    {
      id: 10,
      title: 'Booking Complete',
      icon: FiCheckCircle,
      action: null,
      description: 'Booking successfully finalized',
    },
  ].filter(stage => {
    // CRITICAL: If worker is assigned (not self), hide most tracking steps but KEEP Work Done
    if (booking?.assignedTo && !booking?.isSelfJob) {
      // Hide stages 4, 5, 7, 8, 9 for worker jobs. KEEP 1, 2, 3, 6, 10
      if ([4, 5, 7, 8, 9].includes(stage.id)) return false;
    }

    // Hide worker-specific stages for self jobs
    if (booking?.isSelfJob && stage.id === 8) return false;

    return true;
  });

  // Auto-verify as last digit enters
  useEffect(() => {
    const otpValue = otpInput.join('');
    if (otpValue.length === 4 && !actionLoading && isVisitModalOpen) {
      handleVerifyVisit();
    }
  }, [otpInput]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otpInput];
    newOtp[index] = value;
    setOtpInput(newOtp);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`).focus();
  };


  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Booking Timeline" />

      <main className="px-4 py-6">
        <div
          className="bg-white rounded-xl p-6 shadow-md"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Timeline */}
          <div className="relative">
            {timelineStages.map((stage, index) => {
              const IconComponent = stage.icon;
              const isCompleted = stage.id < currentStage;
              const isCurrent = stage.id === currentStage;
              const isPending = stage.id > currentStage;
              const isSkipped = false; // We filter stages now, no need to skip visually in the flow unless needed for other reasons

              return (
                <div key={stage.id} className="relative pb-8 last:pb-0">
                  {/* Timeline Line */}
                  {index < timelineStages.length - 1 && (
                    <div
                      className="absolute left-6 top-12 w-0.5 h-full"
                      style={{
                        background: isCompleted ? themeColors.button : '#E5E7EB',
                      }}
                    />
                  )}

                  {/* Timeline Item */}
                  <div className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-white' : isCurrent ? 'bg-white' : 'bg-gray-100'
                        }`}
                      style={{
                        border: `3px solid ${isCompleted || isCurrent ? themeColors.button : '#E5E7EB'}`,
                        boxShadow: isCurrent ? `0 0 0 4px ${themeColors.button}20` : 'none',
                      }}
                    >
                      {isCompleted ? (
                        <FiCheck className="w-6 h-6" style={{ color: themeColors.button }} />
                      ) : (
                        <IconComponent
                          className="w-6 h-6"
                          style={{
                            color: isCurrent ? themeColors.button : '#9CA3AF',
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                            }`}
                        >
                          {stage.title}
                        </h3>
                        {isSkipped && (
                          <span className="text-xs text-gray-500">Skipped</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{stage.description}</p>

                      {/* ── Booking Detail Accordions (inside Booking Requested step) ── */}
                      {stage.id === 1 && booking && (
                        <div className="space-y-1.5 mb-3">

                          {/* 1. Service Type */}
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => toggleDropdown('service')}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FiPackage className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Service Type</span>
                              </div>
                              {openDropdown === 'service' ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                            {openDropdown === 'service' && (
                              <div className="px-3 py-2.5 bg-white border-t border-gray-100 space-y-2">
                                <p className="text-sm font-semibold text-gray-800">{booking.serviceCategory || booking.serviceName || 'N/A'}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    booking.bookingType === 'instant' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {booking.bookingType === 'instant' ? '⚡ Instant' : '📅 Scheduled'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    booking.isSelfJob ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {booking.isSelfJob ? '👤 Self Job' : '👷 Worker Job'}
                                  </span>
                                  {booking.status && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-gray-100 text-gray-600">
                                      {booking.status.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                {booking.specialInstructions && (
                                  <p className="text-xs text-gray-500 italic">"{booking.specialInstructions}"</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 2. Customer Info */}
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => toggleDropdown('customer')}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FiUser className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Customer Info</span>
                              </div>
                              {openDropdown === 'customer' ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                            {openDropdown === 'customer' && (
                              <div className="px-3 py-2.5 bg-white border-t border-gray-100 space-y-1.5">
                                {(booking.userId?.name || booking.customerName) && (
                                  <div className="flex items-center gap-2">
                                    <FiUser className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-xs font-semibold text-gray-800">{booking.userId?.name || booking.customerName}</span>
                                  </div>
                                )}
                                {(booking.userId?.phone || booking.customerPhone) && (
                                  <a href={`tel:${booking.userId?.phone || booking.customerPhone}`} className="flex items-center gap-2 group">
                                    <FiPhone className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-xs text-blue-600 group-hover:underline">{booking.userId?.phone || booking.customerPhone}</span>
                                  </a>
                                )}
                                {(booking.userId?.email || booking.customerEmail) && (
                                  <div className="flex items-center gap-2">
                                    <FiMail className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-xs text-gray-600 break-all">{booking.userId?.email || booking.customerEmail}</span>
                                  </div>
                                )}
                                {booking.address && (
                                  <div className="flex items-start gap-2 pt-1 border-t border-gray-50">
                                    <FiMapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                                    <span className="text-xs text-gray-600 leading-relaxed">
                                      {typeof booking.address === 'string'
                                        ? booking.address
                                        : [
                                          booking.address.addressLine1,
                                          booking.address.addressLine2,
                                          booking.address.city,
                                          booking.address.state,
                                          booking.address.pincode
                                        ].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 3. Order Summary */}
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => toggleDropdown('order')}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FiFileText className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Order Summary</span>
                                {booking.items?.length > 0 && (
                                  <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{booking.items.length}</span>
                                )}
                              </div>
                              {openDropdown === 'order' ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                            {openDropdown === 'order' && (
                              <div className="px-3 py-2.5 bg-white border-t border-gray-100">
                                {booking.items && booking.items.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {booking.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                        <span className="text-xs text-gray-700 flex-1">{item.name || item.serviceName || `Item ${idx + 1}`}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-gray-400">x{item.quantity || item.qty || 1}</span>
                                          <span className="text-xs font-semibold text-gray-800">₹{item.price || item.amount || 0}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">No itemized list available</p>
                                )}
                                {booking.notes && (
                                  <p className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500 italic">
                                    📝 {booking.notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 4. Preferred Time */}
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => toggleDropdown('time')}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FiCalendar className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Preferred Time</span>
                              </div>
                              {openDropdown === 'time' ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                            {openDropdown === 'time' && (
                              <div className="px-3 py-2.5 bg-white border-t border-gray-100 space-y-1.5">
                                {booking.bookingType === 'instant' || booking.scheduledTime === 'ASAP' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">⚡ ASAP — Instant Booking</span>
                                  </div>
                                ) : (
                                  <>
                                    {booking.scheduledDate && (
                                      <div className="flex items-center gap-2">
                                        <FiCalendar className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-800 font-medium">
                                          {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {booking.scheduledTime && (
                                      <div className="flex items-center gap-2">
                                        <FiClock className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-800 font-medium">{booking.scheduledTime}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {booking.createdAt && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                                    <FiClock className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-[10px] text-gray-400">Placed: {new Date(booking.createdAt).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 5. Payment Summary */}
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => toggleDropdown('payment')}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FiCreditCard className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Payment Summary</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                  ['success', 'paid', 'completed'].includes(booking.paymentStatus?.toLowerCase())
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {booking.paymentStatus || 'pending'}
                                </span>
                              </div>
                              {openDropdown === 'payment' ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                            {openDropdown === 'payment' && (
                              <div className="px-3 py-2.5 bg-white border-t border-gray-100 space-y-1">
                                {[
                                  { label: 'Base Price', value: booking.basePrice },
                                  { label: 'Tax (GST)', value: booking.tax },
                                  { label: 'Visiting Charges', value: booking.visitingCharges || booking.visitationFee },
                                  { label: 'Discount', value: booking.discount ? -booking.discount : null },
                                ].filter(r => r.value != null && r.value !== 0).map((row, i) => (
                                  <div key={i} className="flex items-center justify-between py-0.5">
                                    <span className="text-xs text-gray-500">{row.label}</span>
                                    <span className={`text-xs font-medium ${row.value < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                      {row.value < 0 ? '-' : ''}₹{Math.abs(row.value)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                                  <span className="text-xs font-bold text-gray-800">Total</span>
                                  <span className="text-sm font-black" style={{ color: themeColors.button }}>₹{booking.finalAmount || booking.totalAmount || booking.basePrice || 0}</span>
                                </div>
                                <div className="mt-1.5 pt-1.5 border-t border-gray-50 space-y-0.5">
                                  {booking.paymentMethod && (
                                    <div className="flex items-center gap-1.5">
                                      <FiCreditCard className="w-3 h-3 text-gray-400" />
                                      <span className="text-[10px] text-gray-500 capitalize">{booking.paymentMethod.replace(/_/g, ' ')}</span>
                                    </div>
                                  )}
                                  {booking.codAdvanceAmount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <FiAlertCircle className="w-3 h-3 text-amber-500" />
                                      <span className="text-[10px] text-amber-600 font-semibold">COD Advance: ₹{booking.codAdvanceAmount}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                      {/* Action Button */}
                      {stage.action && !isSkipped && (() => {
                        const isStartJourneyStage = stage.id === 4;
                        const disabled = isStartJourneyStage && isStartJourneyDisabled();
                        return (
                          <div className="w-full mt-2">
                            <button
                              onClick={disabled ? undefined : stage.action}
                              disabled={disabled}
                              className={`px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
                              style={disabled ? { background: '#9CA3AF', boxShadow: 'none' } : {
                                background: themeColors.button,
                                boxShadow: `0 2px 8px ${themeColors.button}40`,
                              }}
                            >
                              {stage.id === 3 ? 'Assign Worker' :
                                stage.id === 4 ? 'Start Journey' :
                                  stage.id === 5 ? 'Mark Arrived' :
                                    stage.id === 6 ? 'Mark workdone' :
                                      stage.id === 7 ? (
                                        ['success', 'paid', 'completed'].includes(booking?.paymentStatus?.toLowerCase())
                                          ? 'Complete Booking'
                                          : (booking?.isSelfJob ? 'Collect Cash' : 'Approve Work')
                                      ) :
                                        stage.id === 8 ? 'Pay Worker' :
                                          stage.id === 9 ? 'Final Settlement' : 'Continue'}
                            </button>
                            {disabled && (
                              <p className="text-[10px] text-amber-600 font-semibold mt-1.5 bg-amber-50 py-1 px-2 rounded border border-amber-100 max-w-max">
                                🔒 Journey can only be started 1 hour before the scheduled time.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Online Payment Status Badge for Stage 7 */}
                      {stage.id === 7 && ['success', 'paid', 'completed'].includes(booking?.paymentStatus?.toLowerCase()) && !isCompleted && (
                        <div className="mt-2 flex items-center gap-1.5 text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <FiCheckCircle className="w-4 h-4" />
                          ONLINE PAYMENT RECEIVED
                        </div>
                      )}

                      {/* Timestamp */}
                      {isCompleted && booking.timeline && booking.timeline.find(t => t.stage === stage.id) && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(booking.timeline.find(t => t.stage === stage.id).timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Visit OTP Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Verify Self Visit</h3>
              <button onClick={() => setIsVisitModalOpen(false)}><FiX /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter user OTP to verify arrival.</p>
            <div className="flex gap-2 justify-center mb-4">
              {[0, 1, 2, 3].map((i) => (
                <input key={i} id={`otp-${i}`} type="number" value={otpInput[i]} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-10 h-10 border rounded text-center" maxLength={1} />
              ))}
            </div>
            <button onClick={handleVerifyVisit} disabled={actionLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg">{actionLoading ? 'Verifying...' : 'Verify'}</button>
          </div>
        </div>
      )}

      {/* Work Done Modal */}
      <WorkCompletionModal
        isOpen={isWorkDoneModalOpen}
        onClose={() => setIsWorkDoneModalOpen(false)}
        job={booking}
        onComplete={handleCompleteWork}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default BookingTimeline;

