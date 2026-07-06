import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminBottomNav from './AdminBottomNav';
import useAdminHeaderHeight from '../../hooks/useAdminHeaderHeight';
import { useSocket } from '../../../../context/SocketContext';
import { FiAlertTriangle, FiX, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { playSirenAlarm, stopSirenAlarm, unlockAudioContext, playNotificationSound } from '../../../../utils/notificationSound';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerHeight = useAdminHeaderHeight();
  const socket = useSocket();
  const navigate = useNavigate();
  const [currentSOS, setCurrentSOS] = useState(null);
  const [panelMode, setPanelMode] = useState(() => {
    return localStorage.getItem('adminPanelMode') || 'app';
  });

  const handleTogglePanelMode = (mode) => {
    setPanelMode(mode);
    localStorage.setItem('adminPanelMode', mode);
  };

  // Bottom nav height is 64px (h-16)
  const bottomNavHeight = 64;

  // Add small buffer to prevent content overlap (8px)
  const topPadding = headerHeight + 8;
  const bottomPadding = bottomNavHeight + 8;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('adminSidebarCollapsed', String(next));
      return next;
    });
  };

  const handleDismissSOS = () => {
    setCurrentSOS(null);
    stopSirenAlarm();
  };

  useEffect(() => {
    const unlock = () => {
      unlockAudioContext();
      // Remove listeners once active
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSOSAlert = (data) => {
      console.log('🚨 SOS alert received in AdminLayout:', data);
      setCurrentSOS(data);
      
      // Trigger a 30-second toast alert on Admin panel
      try {
        const isVendor = data.userType === 'vendor';
        toast.error(`🚨 EMERGENCY SOS! ${isVendor ? 'Vendor' : 'User'} ${data.name} (${data.phone}) has triggered an SOS alert!`, {
          duration: 30000,
          position: 'top-right'
        });
      } catch (err) {
        console.warn('Toast display failed:', err.message);
      }
      
      // Play premium siren alarm sound
      playSirenAlarm();
    };

    const handleAdminBookingRequest = (data) => {
      console.log('💼 Admin Booking Request received:', data);
      window.dispatchEvent(new CustomEvent('adminBookingUpdated'));
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3 max-w-sm pointer-events-auto transition-all animate-slide-up">
          <span className="text-2xl">💼</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Manual Assignment Needed</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Booking #{data.bookingNumber} has no available vendors.</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/admin/bookings/${data.bookingId}`);
              }}
              className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
            >
              Assign Vendor Now
            </button>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
      ), {
        duration: Infinity,
        position: 'top-right'
      });

      // Play chime/beep sound
      playNotificationSound().catch(e => console.warn('Admin notification sound failed:', e));
    };

    const handleAdminBookingRejected = (data) => {
      console.log('💼 Admin Booking Rejection received:', data);
      window.dispatchEvent(new CustomEvent('adminBookingUpdated'));
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3 max-w-sm pointer-events-auto transition-all animate-slide-up">
          <span className="text-2xl">❌</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Manual Reassignment Needed</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vendor {data.vendorName || 'assigned'} rejected manual assignment for booking #{data.bookingNumber}.</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/admin/bookings/${data.bookingId}`);
              }}
              className="mt-2 px-3 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
            >
              Reassign Vendor Now
            </button>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
      ), {
        duration: Infinity,
        position: 'top-right'
      });
      playNotificationSound().catch(e => console.warn('Admin notification sound failed:', e));
    };

    const handleBookingEscalation = (data) => {
      console.log('🚨 Booking Escalation/Cancellation received:', data);
      window.dispatchEvent(new CustomEvent('adminBookingUpdated'));
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3 max-w-sm pointer-events-auto transition-all animate-slide-up">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-red-600 dark:text-red-400">Cancellation Request Received</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{data.message}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/admin/bookings/${data.bookingId}`);
              }}
              className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
            >
              Review Booking
            </button>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
      ), {
        duration: Infinity,
        position: 'top-right'
      });
      playNotificationSound().catch(e => console.warn('Admin notification sound failed:', e));
    };

    socket.on('sos_alert_triggered', handleSOSAlert);
    socket.on('admin_booking_requested', handleAdminBookingRequest);
    socket.on('admin_booking_rejected', handleAdminBookingRejected);
    socket.on('booking_escalation', handleBookingEscalation);
    return () => {
      socket.off('sos_alert_triggered', handleSOSAlert);
      socket.off('admin_booking_requested', handleAdminBookingRequest);
      socket.off('admin_booking_rejected', handleAdminBookingRejected);
      socket.off('booking_escalation', handleBookingEscalation);
      stopSirenAlarm(); // Ensure sound stops if layout unmounts
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        panelMode={panelMode}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[320px]'}`}>
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          isCollapsed={isCollapsed} 
          panelMode={panelMode}
          onTogglePanelMode={handleTogglePanelMode}
        />

        {/* Page Content - with dynamic padding to account for fixed header and bottom nav */}
        <main
          className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden lg:pb-6 lg:pt-24 scrollbar-admin w-full min-w-0"
          style={{
            // Mobile: Use calculated heights with safe area support
            // Desktop: Tailwind classes override these (lg:pt-24, lg:pb-6)
            paddingTop: `${Math.max(topPadding, 80)}px`,
            paddingBottom: `calc(${Math.max(bottomPadding, 80)}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <AdminBottomNav />

      {/* Real-time Emergency SOS Alert Modal */}
      {currentSOS && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border-2 border-red-500 animate-[bounce_0.5s_ease-out_1]">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <FiAlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight uppercase">Emergency SOS Alert</h3>
                  <span className="text-[10px] bg-red-800 text-red-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Critical Level
                  </span>
                </div>
              </div>
              <button 
                onClick={handleDismissSOS}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 animate-slide-up">
              <div className="space-y-2">
                <p className="text-gray-500 text-xs">A {currentSOS.userType === 'vendor' ? 'vendor' : 'user'} has triggered an emergency SOS panic button from their profile dashboard.</p>
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">{currentSOS.userType === 'vendor' ? 'Vendor / Partner' : 'Customer'}</span>
                    <span className="text-gray-900 font-bold">{currentSOS.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">Phone Number</span>
                    <a href={`tel:${currentSOS.phone}`} className="text-red-600 font-bold hover:underline flex items-center gap-1">
                      <span>{currentSOS.phone}</span>
                    </a>
                  </div>
                  {currentSOS.email && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase">Email</span>
                      <span className="text-gray-900 font-medium">{currentSOS.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">Trigger Time</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(currentSOS.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {currentSOS.lat && currentSOS.lng && (
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">Live Coordinates</p>
                      <p className="text-xs text-gray-700 font-medium">{Number(currentSOS.lat).toFixed(4)}, {Number(currentSOS.lng).toFixed(4)}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${currentSOS.lat},${currentSOS.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Open Map
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDismissSOS}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Dismiss Alert
                </button>
                <button
                  onClick={() => {
                    handleDismissSOS();
                    navigate('/admin/sos-alerts');
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors text-center"
                >
                  View SOS Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
