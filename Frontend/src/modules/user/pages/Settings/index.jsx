import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiMail, FiPhone, FiMessageCircle, FiShield, FiChevronRight, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import { userAuthService } from '../../../../services/authService';
import { registerFCMToken, removeFCMToken } from '../../../../services/pushNotificationService';
import BottomNav from '../../components/layout/BottomNav';

const Settings = () => {
  const navigate = useNavigate();

  // State for notification toggles
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
  });

  // Load user settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await userAuthService.getProfile();
      if (response.success && response.user?.settings) {
        setNotifications(prev => ({
          ...prev,
          push: response.user.settings.notifications ?? true
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggle = async (key) => {
    // Optimistic update
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Handle Push Toggle specifically
    if (key === 'push') {
      const newState = !notifications.push;
      const toastId = toast.loading(newState ? 'Enabling notifications...' : 'Disabling notifications...');

      try {
        if (newState) {
          // Enable
          const token = await registerFCMToken('user', true);
          if (!token) {
            toast.error('Failed to enable. Check permissions.', { id: toastId });
            // Revert state
            setNotifications(prev => ({ ...prev, push: false }));
            return;
          }
        } else {
          // Disable
          await removeFCMToken('user');
        }

        // Persist preference to backend
        await userAuthService.updateProfile({
          settings: { notifications: newState }
        });

        toast.success(newState ? 'Notifications enabled' : 'Notifications disabled', { id: toastId });

      } catch (error) {
        console.error('Error updating notification settings:', error);
        toast.error('Failed to update settings', { id: toastId });
        // Revert
        setNotifications(prev => ({ ...prev, push: !newState }));
      }
    }
  };

  const handlePrivacyClick = () => {
    // Navigate to privacy page (can be implemented later)
    // navigate('/privacy');
  };

  return (
    <div className="min-h-screen bg-light-bg pb-20">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-xl border-b border-border-color sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-orange-50/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-text" />
            </button>
            <h1 className="text-xl font-bold text-dark-text tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Order Related Messages Section */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-dark-text tracking-tight mb-2">Order related messages</h2>
          <p className="text-sm text-secondary-text leading-relaxed">
            Order related messages can't be turned off as they are important for service experience.
          </p>
        </div>



        {/* Account Actions Section */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-dark-text tracking-tight mb-4">Account</h2>
          <div className="space-y-3">
            <button
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to log out?');
                if (confirmed) {
                  await userAuthService.logout();
                  navigate('/user/login');
                  toast.success('Logged out successfully');
                }
              }}
              className="w-full bg-card-bg rounded-md border border-border-color p-4 flex items-center gap-3 hover:bg-gray-800/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-red-500/10">
                <FiLogOut className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-600">Log Out</span>
            </button>
 
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                  const toastId = toast.loading('Deleting your account...');
                  try {
                    await userAuthService.deleteProfile();
                    toast.success('Account deleted successfully', { id: toastId });
                    
                    // Clear credentials and logout
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userData');
                    
                    navigate('/user/login');
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete account. Please try again later.', { id: toastId });
                  }
                }
              }}
              className="w-full bg-card-bg rounded-md border border-border-color p-4 flex items-center gap-3 hover:bg-gray-800/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gray-500/10">
                <FiTrash2 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-dark-text block">Delete Account</span>
                <span className="text-xs text-secondary-text">Permanently remove your data</span>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handlePrivacyClick}
            className="w-full bg-card-bg rounded-md border border-border-color p-4 flex items-center justify-between hover:bg-gray-800/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 159, 69, 0.1)' }}>
                <FiShield className="w-5 h-5" style={{ color: themeColors.button }} />
              </div>
              <span className="text-sm font-medium text-dark-text">Privacy & data</span>
            </div>
            <FiChevronRight className="w-5 h-5 text-secondary-text" />
          </button>
        </div>
      </main>

      {/* BottomNav hidden on this page */}
    </div>
  );
};

export default Settings;
