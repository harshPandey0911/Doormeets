import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookingAlertModal } from '../bookings';
import { acceptBooking, rejectBooking, assignWorker } from '../../services/bookingService';
import { playAlertRing, stopAlertRing } from '../../../../utils/notificationSound';
import { FiMapPin } from 'react-icons/fi';

export default function GlobalBookingAlert() {
  const [activeAlertBookings, setActiveAlertBookings] = useState([]);
  const [activeWorkerAlerts, setActiveWorkerAlerts] = useState([]);
  const ignoredBookingIds = useRef(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  const [maxSearchTime, setMaxSearchTime] = useState(1);

  useEffect(() => {
    // 1. Logic to sync with localStorage and optionally Server
    const syncAlerts = async (forceServerSync = false) => {
      try {
        const now = Date.now();
        let pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');

        // Every few heartbeats or if forced, sync with Server API for missed sockets
        const token = localStorage.getItem('vendorAccessToken') || sessionStorage.getItem('vendorAccessToken');
        const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
        const isApproved = vendorData.approvalStatus?.toLowerCase() === 'approved';
        if (token && isApproved && (forceServerSync || (Math.random() > 0.8))) {
          try {
            const { getBookings } = await import('../../services/bookingService');
            const response = await getBookings();
            if (response.success && response.data) {
              const vId = String(vendorData._id || vendorData.id);

              const serverJobs = response.data
                .filter(b => {
                  const status = b.status?.toLowerCase();
                  const isRelevant = status === 'searching' || status === 'requested';
                  const isMine = !b.vendorId || String(b.vendorId?._id || b.vendorId) === vId;
                  return isRelevant && isMine;
                })
                .map(b => ({
                  ...b,
                  id: b._id || b.id,
                  serviceType: b.serviceName || b.serviceId?.title,
                  customerName: b.userId?.name || 'Customer',
                  assignedByAdmin: b.assignedByAdmin || false
                }));

              const existingIds = new Set(pendingJobs.map(j => String(j.id || j._id)));
              let updated = false;
              serverJobs.forEach(sj => {
                if (!existingIds.has(String(sj.id))) {
                  pendingJobs.unshift(sj);
                  updated = true;
                }
              });
              if (updated) localStorage.setItem('vendorPendingJobs', JSON.stringify(pendingJobs));
            }
          } catch (e) { console.error("Server sync error:", e); }
        }

        const validJobs = pendingJobs.filter(job => {
          return (now - (job.assignedAt || now)) < (maxSearchTime * 60 * 1000);
        });

        setActiveAlertBookings(validJobs);
        if (validJobs.length !== pendingJobs.length) {
          localStorage.setItem('vendorPendingJobs', JSON.stringify(validJobs));
        }

      } catch (err) {
        console.error('syncAlerts error:', err);
      }
    };

    // 2. Foreground Sync: Sync immediately when vendor resumes app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAlerts(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Fetch global config for accurate timer
    const fetchConfig = async () => {
      const token = localStorage.getItem('vendorAccessToken') || sessionStorage.getItem('vendorAccessToken');
      const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
      const isApproved = vendorData.approvalStatus?.toLowerCase() === 'approved';
      if (!token || !isApproved) return;

      try {
        const { vendorDashboardService } = await import('../../services/dashboardService');
        const response = await vendorDashboardService.getDashboardStats();
        if (response.success && response.data.config) {
          setMaxSearchTime(response.data.config.maxSearchTime || 1);
        }
      } catch (error) {
        console.error('Failed to fetch config for GlobalAlert:', error);
      }
    };

    syncAlerts(true);
    fetchConfig();

    // 3. Heartbeat: Periodic sync
    const heartbeat = setInterval(() => syncAlerts(false), 5000);

    // Listen for custom dashboard events from SocketContext
    const handleShowAlert = (e) => {
      if (e.detail) {
        setActiveAlertBookings(prev => {
          const bId = String(e.detail.id || e.detail._id);
          if (prev.find(b => String(b.id || b._id) === bId)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleRemoveBooking = (e) => {
      if (e.detail?.id) {
        const idToRemove = String(e.detail.id);
        ignoredBookingIds.current.add(idToRemove);
        setActiveAlertBookings(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));
      }
    };

    // Painting consultation real-time listener
    const handlePaintingConsultationAlert = (e) => {
      if (e.detail) {
        setActiveConsultationAlerts(prev => {
          const cId = String(e.detail.consultationId);
          if (prev.find(c => String(c.consultationId) === cId)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleWorkerAlert = (e) => {
      if (e.detail) {
        setActiveWorkerAlerts(prev => {
          const wId = String(e.detail.id || e.detail._id);
          if (prev.find(w => String(w.id || w._id) === wId)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    window.addEventListener('showDashboardBookingAlert', handleShowAlert);
    window.addEventListener('removeVendorBooking', handleRemoveBooking);
    window.addEventListener('showPaintingConsultationAlert', handlePaintingConsultationAlert);
    window.addEventListener('showWorkerJobAlert', handleWorkerAlert);

    return () => {
      window.removeEventListener('showDashboardBookingAlert', handleShowAlert);
      window.removeEventListener('removeVendorBooking', handleRemoveBooking);
      window.removeEventListener('showPaintingConsultationAlert', handlePaintingConsultationAlert);
      window.removeEventListener('showWorkerJobAlert', handleWorkerAlert);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, []);

  const [activeConsultationAlerts, setActiveConsultationAlerts] = useState([]);

  // Effect to manage sound based on pending bookings
  useEffect(() => {
    if (activeAlertBookings.length > 0 || activeConsultationAlerts.length > 0 || activeWorkerAlerts.length > 0) {
      playAlertRing(true); // Always loop for vendor/worker until actioned
    } else {
      stopAlertRing();
    }
    return () => stopAlertRing();
  }, [activeAlertBookings.length, activeConsultationAlerts.length, activeWorkerAlerts.length]);

  const handleAcceptConsultation = async (id) => {
    try {
      const { acceptConsultation } = await import('../../services/paintingConsultationService');
      await acceptConsultation(id);
      toast.success('Consultation Request Accepted!');
      setActiveConsultationAlerts(prev => prev.filter(c => String(c.consultationId) !== String(id)));
      navigate('/vendor/painting-consultations');
    } catch (err) {
      toast.error('Failed to accept consultation');
    }
  };

  const handleDeclineConsultation = async (id) => {
    try {
      const { declineConsultation } = await import('../../services/paintingConsultationService');
      await declineConsultation(id);
      toast.success('Consultation Request Declined');
    } catch (err) {
      console.error(err);
    } finally {
      setActiveConsultationAlerts(prev => prev.filter(c => String(c.consultationId) !== String(id)));
    }
  };

  if (activeAlertBookings.length === 0 && activeConsultationAlerts.length === 0) return null;

  return (
    <>
      {activeAlertBookings.length > 0 && (
        <BookingAlertModal
          isOpen={activeAlertBookings.length > 0}
          bookings={activeAlertBookings}
          maxSearchTimeMins={maxSearchTime}
          onAccept={async (id, price, note) => {
            try {
              if (price) {
                const { submitBid } = await import('../../services/bookingService');
                await submitBid(id, price, note);
                toast.success('Quote sent successfully!');
              } else {
                const bookingItem = activeAlertBookings.find(b => String(b.id || b._id) === String(id));
                const isScheduled = bookingItem?.bookingType === 'scheduled';
                await acceptBooking(id);
                if (!isScheduled) {
                  await assignWorker(id, 'SELF');
                  toast.success('Job claimed successfully! Assigned to you.');
                } else {
                  toast.success('Scheduled job accepted! You can assign yourself or a worker 30 minutes before the start time.');
                }
              }

              // Remove from local storage
              const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
              const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(id));
              localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

              // Dispatch remove event
              window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id } }));
              setActiveAlertBookings(prev => prev.filter(b => String(b.id || b._id) !== String(id)));

              window.dispatchEvent(new Event('vendorJobsUpdated'));
              window.dispatchEvent(new Event('vendorStatsUpdated'));
              toast.success('Job claimed successfully! Assigned to you.');
            } catch (e) {
              toast.error('Failed to claim job');
            }
          }}
          onAssign={async (id) => {
            try {
              await acceptBooking(id);

              // Remove from local storage
              const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
              const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(id));
              localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

              // Dispatch remove event
              window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id } }));
              setActiveAlertBookings(prev => prev.filter(b => String(b.id || b._id) !== String(id)));

              window.dispatchEvent(new Event('vendorJobsUpdated'));
              window.dispatchEvent(new Event('vendorStatsUpdated'));
              toast.success('Job claimed! Redirecting to assign...');
              navigate(`/vendor/booking/${id}/assign-worker`);
            } catch (e) {
              toast.error('Failed to claim job');
            }
          }}
          onReject={async (id) => {
            try {
              // Reject is often silent or via reject api
              await rejectBooking(id);
            } catch (error) {
              console.error("Failed to reject job via API, removing locally");
            } finally {
              const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
              const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(id));
              localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

              window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id } }));
              setActiveAlertBookings(prev => prev.filter(b => String(b.id || b._id) !== String(id)));

              toast.success('Booking application rejected');
              window.dispatchEvent(new Event('vendorJobsUpdated'));
            }
          }}
          onMinimize={() => {
            setActiveAlertBookings([]); // simply minimizes current visible ones. We can fetch them later from pending.
          }}
        />
      )}

      {/* Painting Consultation Live Alert Modal Overlay */}
      {activeConsultationAlerts.map((consultation) => (
        <div key={consultation.consultationId} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-orange-500 animate-bounce-short">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 6v12M6 12h12"/>
                </svg>
              </div>
              <div>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">New Consultation Request</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-orange-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Painting Inquiry
                </h3>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">BHK Type</span>
                <span className="font-bold text-gray-800">{consultation.propertyType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Customer</span>
                <span className="font-bold text-gray-800">{consultation.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Location</span>
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <FiMapPin className="text-sm text-orange-500" />
                  {consultation.city}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAcceptConsultation(consultation.consultationId)}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-200"
              >
                Accept Request
              </button>
              <button
                onClick={() => handleDeclineConsultation(consultation.consultationId)}
                className="px-4 py-3 border-2 border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Worker Job Live Alert Modal Overlay */}
      {activeWorkerAlerts.map((job) => (
        <div key={job.id || job._id} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-indigo-500 animate-bounce-short">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 6v12M6 12h12"/>
                </svg>
              </div>
              <div>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">New Job Assigned!</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  Action Required
                </h3>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Service</span>
                <span className="font-bold text-gray-800">{job.serviceType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Customer</span>
                <span className="font-bold text-gray-800">{job.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Address</span>
                <span className="font-bold text-gray-800 truncate max-w-[180px]">{job.location?.address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Amount</span>
                <span className="font-bold text-green-600">₹{job.price}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  stopAlertRing();
                  setActiveWorkerAlerts(prev => prev.filter(w => String(w.id || w._id) !== String(job.id || job._id)));
                  navigate(`/worker/booking/${job.id || job._id}`);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  stopAlertRing();
                  setActiveWorkerAlerts(prev => prev.filter(w => String(w.id || w._id) !== String(job.id || job._id)));
                }}
                className="px-4 py-3 border-2 border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
