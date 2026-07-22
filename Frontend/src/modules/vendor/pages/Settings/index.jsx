import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiVolume2, FiGlobe, FiInfo, FiLogOut, FiTrash2, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { vendorAuthService } from '../../../../services/authService';
import { registerFCMToken, removeFCMToken } from '../../../../services/pushNotificationService';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    soundAlerts: true,
    language: 'en',
  });

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
    const loadSettings = () => {
      try {
        const savedSettings = JSON.parse(localStorage.getItem('vendorSettings') || '{}');
        if (Object.keys(savedSettings).length > 0) {
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('vendorSettings', JSON.stringify(updated));

    // Handle FCM Token registration/removal if notifications toggled
    if (key === 'notifications') {
      if (updated.notifications) {
        // Turning ON
        try {
          await registerFCMToken('vendor', true);
          toast.success('Notifications enabled');
        } catch (error) {
          console.error('Error enabling notifications:', error);
          toast.error('Failed to enable notifications');
          // Revert toggle if failed? For now, we keep UI in sync with intent.
        }
      } else {
        // Turning OFF
        try {
          await removeFCMToken('vendor');
          toast.success('Notifications disabled');
        } catch (error) {
          console.error('Error disabling notifications:', error);
        }
      }
    }
  };

  const handleLanguageChange = (lang) => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    localStorage.setItem('vendorSettings', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    try {
      await vendorAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/vendor/login');
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('vendorAccessToken');
      localStorage.removeItem('vendorRefreshToken');
      localStorage.removeItem('vendorData');
      toast.success('Logged out successfully');
      navigate('/vendor/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const toastId = toast.loading('Deleting your account...');
      try {
        await vendorAuthService.deleteProfile();
        toast.success('Account deleted successfully', { id: toastId });

        // Clear all vendor data
        localStorage.removeItem('vendorProfile');
        localStorage.removeItem('vendorSettings');
        localStorage.removeItem('vendorWorkers');
        localStorage.removeItem('vendorAcceptedBookings');
        localStorage.removeItem('vendorWallet');
        localStorage.removeItem('vendorTransactions');
        localStorage.removeItem('vendorAccessToken');
        localStorage.removeItem('vendorRefreshToken');
        localStorage.removeItem('vendorData');

        // Navigate to login
        navigate('/vendor/login');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete account. Please try again later.', { id: toastId });
      }
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Settings" />

      <main className="px-3.5 py-4 max-w-lg mx-auto space-y-3">
        {/* Address Management */}
        <div
          className="bg-white rounded-md p-3 shadow-2xs border border-gray-100 cursor-pointer hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => navigate('/vendor/address-management')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiMapPin className="w-4 h-4" style={{ color: themeColors.icon }} />
              <div>
                <p className="font-bold text-gray-900 text-xs md:text-sm">Manage Address</p>
                <p className="text-[10px] text-gray-500 font-medium">Set your business location</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Helpdesk & Support */}
        <div
          className="bg-white rounded-md p-3 shadow-2xs border border-gray-100 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => navigate('/vendor/support')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiInfo className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-bold text-gray-900 text-xs md:text-sm">Helpdesk & Support</p>
                <p className="text-[10px] text-gray-500 font-medium">Raise a ticket or view status</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-md p-3 shadow-2xs border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5">
            <FiGlobe className="w-4 h-4" style={{ color: themeColors.icon }} />
            <h3 className="font-bold text-gray-800 text-xs md:text-sm uppercase tracking-wider">Language</h3>
          </div>

          <div className="space-y-1.5">
            {[
              { code: 'en', name: 'English' },
              { code: 'hi', name: 'हिंदी' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full py-2 px-3 rounded-md text-left text-xs font-bold transition-all ${settings.language === lang.code
                  ? 'text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                style={
                  settings.language === lang.code
                    ? {
                      background: themeColors.button,
                      boxShadow: `0 2px 6px ${themeColors.button}30`,
                    }
                    : {}
                }
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-md p-3 shadow-2xs border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2">
            <FiInfo className="w-4 h-4" style={{ color: themeColors.icon }} />
            <h3 className="font-bold text-gray-800 text-xs md:text-sm uppercase tracking-wider">About</h3>
          </div>

          <div className="space-y-1 text-[11px] font-medium text-gray-500">
            <p>App Version: 1.0.0</p>
            <p>Vendor App</p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          className="w-full py-2.5 rounded-md font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
          style={{
            background: themeColors.button,
            boxShadow: `0 4px 12px ${themeColors.button}30`,
            cursor: 'pointer'
          }}
        >
          <FiLogOut className="w-4 h-4" />
          Logout
        </button>

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          className="w-full py-2.5 rounded-md font-bold text-xs text-red-600 border border-red-500 hover:bg-red-50 transition-all active:scale-95"
        >
          <div className="flex items-center justify-center gap-1.5">
            <FiTrash2 className="w-4 h-4" />
            Delete Account
          </div>
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;

