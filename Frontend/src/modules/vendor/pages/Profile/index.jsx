import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiEdit2, FiMapPin, FiPhone, FiMail, FiBriefcase, FiStar, FiArrowRight, FiSettings, FiChevronRight, FiCreditCard, FiLogOut, FiTrash2, FiGrid, FiBox } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { vendorAuthService } from '../../../../services/authService';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';
import api from '../../../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const isWorker = localStorage.getItem('role') === 'worker' || window.location.pathname.startsWith('/worker');

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const menuItems = isWorker ? [
    { id: 2, label: 'Wallet & Payouts', icon: FaWallet, path: '/worker/wallet' },
    { id: 8, label: 'Settings', icon: FiSettings, path: '/worker/settings' },
    { id: 9, label: 'About Doormeets', icon: null, customIcon: 'S', path: '/worker/about-cleaning-expert' },
  ] : [
    { id: 2, label: 'Wallet', icon: FaWallet, path: '/vendor/wallet' },
    { id: 5, label: 'My Ratings', icon: FiStar, path: '/vendor/my-ratings' },
    { id: 10, label: 'Categories', icon: FiGrid, path: '/vendor/categories' },
    { id: 12, label: 'Performance & Stats', icon: FiBox, path: '/vendor/my-services' },
    { id: 7, label: 'Manage Address', icon: FiMapPin, path: '/vendor/address-management' },
    { id: 8, label: 'Settings', icon: FiSettings, path: '/vendor/settings' },
    { id: 9, label: 'About Doormeets', icon: null, customIcon: 'S', path: '/vendor/about-cleaning-expert' },
    { id: 13, label: 'Stock Management', icon: FiBox, path: '/vendor/stock' },
  ];

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sosTriggering, setSosTriggering] = useState(false);

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

  const handleSOSClick = () => {
    const confirmSOS = window.confirm("EMERGENCY SOS: Are you in danger? Clicking OK will immediately alert our emergency response team and admins with your live coordinates.");
    if (!confirmSOS) return;

    setSosTriggering(true);
    const loadingToast = toast.loading('Activating SOS Alert...');

    const sendAlert = async (lat = null, lng = null) => {
      try {
        const res = await api.post('/vendors/profile/sos', { lat, lng });
        toast.dismiss(loadingToast);
        if (res.data.success) {
          toast.error('🚨 SOS Alert Triggered! Help is on the way. Our team will contact you shortly.', { duration: 30000 });
        } else {
          toast.error(res.data.message || 'Failed to trigger SOS');
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error('Failed to contact emergency support. Please call emergency services directly.');
      } finally {
        setSosTriggering(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendAlert(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation failed, triggering SOS without coordinates:', error.message);
          sendAlert();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      sendAlert();
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // Try to load from local storage first for immediate display
      const storageKey = isWorker ? 'workerData' : 'vendorData';
      const storedVendorData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (storedVendorData && Object.keys(storedVendorData).length > 0) {
        setProfile({
          name: storedVendorData.name || (isWorker ? 'Worker Name' : 'Vendor Name'),
          businessName: isWorker ? 'Worker' : (storedVendorData.businessName || null),
          phone: storedVendorData.phone || '',
          email: storedVendorData.email || '',
          address: storedVendorData.address ?
            (typeof storedVendorData.address === 'string' ? storedVendorData.address :
              `${storedVendorData.address.addressLine1 || ''} ${storedVendorData.address.addressLine2 || ''} ${storedVendorData.address.city || ''} ${storedVendorData.address.state || ''} ${storedVendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set',
          rating: storedVendorData.rating || 0,
          totalJobs: storedVendorData.totalJobs || 0,
          completionRate: storedVendorData.completionRate || 0,
          serviceCategory: storedVendorData.service || '',
          skills: [],
          photo: storedVendorData.profilePhoto || null,
          approvalStatus: storedVendorData.approvalStatus || 'approved',
          isPhoneVerified: storedVendorData.isPhoneVerified || false,
          isEmailVerified: storedVendorData.isEmailVerified || false
        });
        setIsLoading(false); // Show content immediately
      }

      setError(null);
      try {
        const response = await vendorAuthService.getProfile();
        if (response.success) {
          const vendorData = response.vendor;
          // Format address
          const addressString = vendorData.address
            ? (typeof vendorData.address === 'string' ? vendorData.address :
              `${vendorData.address.addressLine1 || ''} ${vendorData.address.addressLine2 || ''} ${vendorData.address.city || ''} ${vendorData.address.state || ''} ${vendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set';

          setProfile({
            name: vendorData.name || (isWorker ? 'Worker Name' : 'Vendor Name'),
            businessName: isWorker ? 'Worker' : (vendorData.businessName || null),
            phone: vendorData.phone || '',
            email: vendorData.email || '',
            address: addressString,
            rating: vendorData.rating || 0,
            totalJobs: vendorData.totalJobs || 0,
            completionRate: vendorData.completionRate || 0,
            serviceCategory: vendorData.service || '',
            skills: [],
            photo: vendorData.profilePhoto || null,
            approvalStatus: vendorData.approvalStatus || 'approved',
            isPhoneVerified: vendorData.isPhoneVerified || false,
            isEmailVerified: vendorData.isEmailVerified || false
          });
          localStorage.setItem(storageKey, JSON.stringify(vendorData));
        } else {
          // If API fails but we have local data, stick with it?
          if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
            setError(response.message || 'Failed to fetch profile');
            toast.error(response.message || 'Failed to fetch profile');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
          setError(err.response?.data?.message || 'Failed to fetch profile');
          toast.error(err.response?.data?.message || 'Failed to fetch profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    const updateEvent = isWorker ? 'workerProfileUpdated' : 'vendorProfileUpdated';
    window.addEventListener('vendorDataUpdated', fetchProfile);
    window.addEventListener(updateEvent, fetchProfile);

    return () => {
      window.removeEventListener('vendorDataUpdated', fetchProfile);
      window.removeEventListener(updateEvent, fetchProfile);
    };
  }, []);

  if (isLoading) {
    return <LogoLoader />;
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: themeColors.backgroundGradient }}>
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error loading profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: themeColors.button }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Profile" />

      <main className="px-4 pt-4 pb-6">
        {/* Profile Header Card with Phone & Email (Light Orange Theme) */}
        <div
          className="rounded-[2rem] p-4 mb-4 shadow-xl relative overflow-hidden border border-white/60"
          style={{
            background: 'linear-gradient(135deg, #FFF5EB 0%, #FFEBD6 100%)',
            boxShadow: '0 15px 30px rgba(255, 159, 69, 0.12)',
          }}
        >
          {/* Decorative Patterns */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`,
              transform: 'translate(30px, -30px)',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              {/* Profile Photo - Circle with Rating Below */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="rounded-full flex items-center justify-center overflow-hidden mb-1.5 transition-transform duration-500 hover:rotate-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 16px rgba(255, 159, 69, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.8)',
                    border: '3px solid white',
                    width: '70px',
                    height: '70px',
                  }}
                >
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-8 h-8 text-orange-500" />
                  )}
                </div>
                {/* Star Rating Below Photo */}
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/50 backdrop-blur-md border border-white/50">
                    <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-orange-900">{profile.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Name and Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <h2 className="text-xl font-black text-orange-950 mb-0 break-words tracking-tight leading-tight">{profile.name}</h2>
                <p className="text-orange-900/70 text-[10px] mb-2 font-bold break-words tracking-wide uppercase">{profile.businessName}</p>

                {/* Phone and Email */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-white/40 backdrop-blur-sm flex-shrink-0 border border-white/60">
                      <FiPhone className="w-3 h-3 text-orange-800" />
                    </div>
                    <span className="text-xs text-orange-950 font-bold tracking-tight">{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-white/40 backdrop-blur-sm flex-shrink-0 border border-white/60">
                      <FiMail className="w-3 h-3 text-orange-800" />
                    </div>
                    <span className="text-xs text-orange-950 font-bold tracking-tight truncate max-w-[150px]">{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Navigate Button */}
              <button
                onClick={() => navigate(isWorker ? '/worker/profile/details' : '/vendor/profile/details')}
                className="p-3.5 rounded-2xl flex-shrink-0 transition-all duration-500 active:scale-90 group bg-white shadow-lg"
              >
                <FiArrowRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Three Cards Section - Horizontal */}
        {!isWorker && (
          <div className="mb-5">
            <div className="grid grid-cols-3 gap-3">
              {/* Active Jobs */}
              <button
                onClick={() => navigate('/vendor/jobs')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl active:scale-95 transition-all duration-300 relative overflow-hidden bg-white"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1.5px solid rgba(0, 166, 166, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 166, 166, 0.15), 0 3px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.25);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.15);
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: hexToRgba(themeColors.button, 0.12),
                    boxShadow: `0 2px 8px ${hexToRgba(themeColors.button, 0.2)}`,
                  }}
                >
                  <FiBriefcase className="w-5 h-5" style={{ color: themeColors.button }} />
                </div>
                <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">
                  Active Jobs
                </span>
              </button>

              {/* Wallet */}
              <button
                onClick={() => navigate('/vendor/wallet')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl active:scale-95 transition-all duration-300 relative overflow-hidden bg-white"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 166, 166, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1.5px solid rgba(0, 166, 166, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 166, 166, 0.15), 0 3px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.25);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.15);
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: hexToRgba(themeColors.button, 0.12),
                    boxShadow: `0 2px 8px ${hexToRgba(themeColors.button, 0.2)}`,
                  }}
                >
                  <FaWallet className="w-5 h-5" style={{ color: themeColors.button }} />
                </div>
                <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">
                  Wallet
                </span>
              </button>

              {/* Workers */}
              <button
                onClick={() => navigate('/vendor/workers')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl active:scale-95 transition-all duration-300 relative overflow-hidden bg-white"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 166, 166, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1.5px solid rgba(0, 166, 166, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 166, 166, 0.15), 0 3px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.25);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = hexToRgba(themeColors.button, 0.15);
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: hexToRgba(themeColors.button, 0.12),
                    boxShadow: `0 2px 8px ${hexToRgba(themeColors.button, 0.2)}`,
                  }}
                >
                  <FiUser className="w-5 h-5" style={{ color: themeColors.button }} />
                </div>
                <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">
                  Workers
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Menu List Section */}
        <div className="mb-4 space-y-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  {item.customIcon ? (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-teal-50"
                      style={{
                        backgroundColor: hexToRgba(themeColors.button, 0.1),
                        border: `1px solid ${hexToRgba(themeColors.button, 0.2)}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: themeColors.button }}>{item.customIcon}</span>
                    </div>
                  ) : (
                    IconComponent && (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: hexToRgba(themeColors.button, 0.1) }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: themeColors.button }} />
                      </div>
                    )
                  )}
                  <span className="text-[15px] font-bold text-gray-800 text-left">
                    {item.label}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* SOS Button */}
        <div className="mb-3">
          <button
            type="button"
            disabled={sosTriggering}
            onClick={handleSOSClick}
            className="w-full font-black py-4 rounded-xl active:scale-98 transition-all text-white flex items-center justify-center gap-2 uppercase tracking-wider text-sm animate-pulse"
            style={{
              backgroundColor: '#DC2626',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              cursor: 'pointer'
            }}
          >
            <span className="text-base">🚨</span>
            {sosTriggering ? 'Sending SOS Alert...' : 'SOS Emergency Alert'}
          </button>
        </div>

        {/* Logout Button */}
        <div className="mb-3">
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const clearAllTokens = () => {
                localStorage.removeItem('vendorAccessToken');
                localStorage.removeItem('vendorRefreshToken');
                localStorage.removeItem('vendorData');
                localStorage.removeItem('workerAccessToken');
                localStorage.removeItem('workerRefreshToken');
                localStorage.removeItem('workerData');
                localStorage.removeItem('role');
              };
              try {
                await vendorAuthService.logout();
                clearAllTokens();
                toast.success('Logged out successfully');
                navigate('/vendor/login');
              } catch (error) {
                clearAllTokens();
                toast.success('Logged out successfully');
                navigate('/vendor/login');
              }
            }}
            className="w-full font-semibold py-3 rounded-xl active:scale-98 transition-all text-white flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#EF4444',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#DC2626';
              e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#EF4444';
              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;


