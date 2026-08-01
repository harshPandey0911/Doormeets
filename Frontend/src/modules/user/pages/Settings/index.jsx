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
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-5xl mx-auto">
        {/* Order Related Messages Section */}
        <div className="mb-6">
          <h2 className="text-base font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Order related messages</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Order related messages can't be turned off as they are important for service experience.
          </p>
        </div>

        {/* Account Actions Section */}
        <div className="mb-6">
          <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Account</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to log out?');
                if (confirmed) {
                  await userAuthService.logout();
                  navigate('/user/login');
                  toast.success('Logged out successfully');
                }
              }}
              className="w-full rounded-xl border p-4 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10">
                <FiLogOut className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-red-500">Log Out</span>
            </button>

            <button
              type="button"
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
              className="w-full rounded-xl border p-4 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
                <FiTrash2 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>Delete Account</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Permanently remove your data</span>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={openPrivacyModal}
            className="w-full rounded-xl border p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10">
                <FiShield className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Privacy & data</span>
            </div>
            <FiChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </main>

      {/* Privacy Policy Modal / Drawer */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border flex flex-col max-h-[85vh] animate-slideUp" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FiShield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base leading-tight">Privacy & Data Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed whitespace-pre-wrap font-normal" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--card-bg)' }}>
              {privacyText || 'Loading Privacy Policy...'}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t flex justify-end" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-brand hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
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
