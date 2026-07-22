import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX, FiFilter, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../../services/notificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [filter, setFilter] = useState('all'); // all, alerts, jobs, payments

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time updates (if implemented via window event)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('vendorNotificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('vendorNotificationsUpdated', handleUpdate);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      // Update local state to reflect change immediately
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      toast.success('All notifications cleared');
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear notifications', error);
      toast.error('Failed to clear');
      setShowClearConfirm(false);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;

    const type = (notif.type || '').toLowerCase();

    if (filter === 'payments') {
      return ['payment_', 'payout_', 'wallet_', 'refund_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'jobs') {
      return ['booking_', 'job_', 'worker_', 'visit_', 'work_', 'journey_', 'vendor_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'alerts') {
      return ['alert', 'general', 'security', 'account'].some(prefix => type.includes(prefix));
    }

    return type === filter;
  });

  const getNotificationIcon = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '💰';
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '📋';
    if (['alert', 'general'].some(t => type.includes(t))) return '🔔';

    return '📢';
  };

  const getNotificationColor = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '#10B981'; // Green
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '#3B82F6'; // Blue
    if (['alert', 'general'].some(t => type.includes(t))) return themeColors.button;

    return '#6B7280'; // Gray
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Notifications" />

      <main className="px-3.5 py-4 max-w-lg mx-auto">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'payments', label: 'Payments' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all ${filter === filterOption.id
                ? 'text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-100 shadow-2xs'
                }`}
              style={
                filter === filterOption.id
                  ? {
                    background: themeColors.button,
                    boxShadow: `0 2px 6px ${themeColors.button}30`,
                  }
                  : {}
              }
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="flex justify-end gap-3 mb-3 px-0.5">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Mark All as Read
            </button>
            <button
              onClick={handleClearAll}
              className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <FiTrash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-md p-6 text-center shadow-2xs border border-gray-100">
            <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-800 font-bold text-sm mb-1">No notifications</p>
            <p className="text-xs text-gray-500 font-medium">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((notif) => {
              const cardImage = notif.imageUrl || notif.image || notif.data?.imageUrl || notif.data?.image;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      handleMarkAsRead(notif.id);
                    }
                    if (cardImage || (!notif.relatedType && !notif.action && !notif.bookingId)) {
                      setSelectedNotif(notif);
                    } else if (notif.relatedType === 'booking' && notif.relatedId) {
                      if (notif.data?.isPainting || notif.title?.toLowerCase().includes('painting')) {
                        const consultationId = notif.data?.consultationId || notif.relatedId;
                        navigate(`/vendor/painting-consultations?consultationId=${consultationId}`);
                      } else {
                        navigate(`/vendor/booking/${notif.relatedId}`);
                      }
                    } else if (notif.action === 'view_booking' && notif.bookingId) {
                      if (notif.title?.toLowerCase().includes('painting')) {
                        navigate(`/vendor/painting-consultations?consultationId=${notif.bookingId}`);
                      } else {
                        navigate(`/vendor/booking/${notif.bookingId}`);
                      }
                    } else if (notif.action === 'view_wallet' || (notif.type && ['payment', 'payout', 'wallet'].some(t => notif.type.toLowerCase().includes(t)))) {
                      navigate('/vendor/wallet');
                    } else {
                      setSelectedNotif(notif);
                    }
                  }}
                  className={`bg-white rounded-md p-3 shadow-2xs border border-gray-100 hover:shadow-xs active:scale-[0.99] transition-all relative cursor-pointer ${!notif.read ? 'border-l-[3.5px]' : ''
                    }`}
                  style={{
                    borderLeftColor: !notif.read ? getNotificationColor(notif.type) : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm flex-shrink-0 shadow-2xs mt-0.5"
                      style={{ backgroundColor: `${getNotificationColor(notif.type)}15` }}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs text-gray-900 ${!notif.read ? 'font-bold' : 'font-semibold'}`}>{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug font-medium line-clamp-2">{notif.message}</p>
                      <p className="text-[9px] text-gray-400 mt-1.5 font-bold">{notif.time || (notif.createdAt && new Date(notif.createdAt).toLocaleString())}</p>
                    </div>

                    {/* Thumbnail if image attached */}
                    {cardImage && (
                      <div className="w-11 h-11 rounded-md overflow-hidden flex-shrink-0 border border-gray-100 shadow-2xs bg-gray-50">
                        <img src={cardImage} alt="Attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Notification Detail Modal */}
      {selectedNotif && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-md w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-xs md:text-sm">Notification Details</h3>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-3">
              {(selectedNotif.imageUrl || selectedNotif.image || selectedNotif.data?.imageUrl || selectedNotif.data?.image) && (
                <div className="w-full rounded-md overflow-hidden border border-gray-100 shadow-2xs max-h-60 bg-gray-50 flex items-center justify-center">
                  <img
                    src={selectedNotif.imageUrl || selectedNotif.image || selectedNotif.data?.imageUrl || selectedNotif.data?.image}
                    alt="Notification Attachment"
                    className="w-full h-full object-contain max-h-60"
                  />
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug">{selectedNotif.title}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  {selectedNotif.time || (selectedNotif.createdAt && new Date(selectedNotif.createdAt).toLocaleString())}
                </p>
              </div>

              <div className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-3 rounded-md border border-gray-100 whitespace-pre-wrap">
                {selectedNotif.message}
              </div>

              {(selectedNotif.actionUrl || selectedNotif.relatedId || selectedNotif.bookingId) && (
                <button
                  onClick={() => {
                    const notif = selectedNotif;
                    setSelectedNotif(null);
                    if (notif.actionUrl) {
                      window.open(notif.actionUrl, '_blank');
                    } else if (notif.relatedType === 'booking' && notif.relatedId) {
                      if (notif.data?.isPainting || notif.title?.toLowerCase().includes('painting')) {
                        const consultationId = notif.data?.consultationId || notif.relatedId;
                        navigate(`/vendor/painting-consultations?consultationId=${consultationId}`);
                      } else {
                        navigate(`/vendor/booking/${notif.relatedId}`);
                      }
                    } else if (notif.action === 'view_booking' && notif.bookingId) {
                      navigate(`/vendor/booking/${notif.bookingId}`);
                    } else if (notif.action === 'view_wallet') {
                      navigate('/vendor/wallet');
                    }
                  }}
                  className="w-full py-2 bg-orange-500 text-white font-bold text-xs rounded-md shadow-xs transition-transform active:scale-95 text-center mt-2"
                >
                  View Related Page
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {showClearConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-md p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center mb-3 shadow-2xs">
                <FiTrash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900">Clear All Notifications?</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">This action cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2 rounded-md font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="py-2 rounded-md font-bold text-xs text-white bg-red-500 shadow-xs hover:bg-red-600 active:scale-95 transition-all"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Notifications;
