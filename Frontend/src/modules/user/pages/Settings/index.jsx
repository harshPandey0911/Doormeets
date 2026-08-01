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

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyText, setPrivacyText] = useState('');

  const openPrivacyModal = async () => {
    setShowPrivacyModal(true);
    if (!privacyText) {
      try {
        const { configService } = await import('../../../../services/configService');
        const res = await configService.getSettings();
        if (res.success && res.settings?.privacyPolicy) {
          setPrivacyText(res.settings.privacyPolicy);
        } else {
          setPrivacyText('Your data security and privacy is our top priority. We only collect essential name, address and phone data to match you with verified service partners.');
        }
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
        setPrivacyText('Your data security and privacy is our top priority. We only collect essential name, address and phone data to match you with verified service partners.');
      }
    }
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
            onClick={openPrivacyModal}
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

      {/* Privacy Policy Modal / Drawer */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[85vh] animate-slideUp">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <FiShield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base leading-tight">Privacy & Data Policy</h3>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap font-normal">
              {privacyText || 'Loading Privacy Policy...'}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-black dark:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BottomNav hidden on this page */}
    </div>
  );
};

export default Settings;
