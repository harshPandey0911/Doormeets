import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import { userAuthService } from '../../../../services/authService';
import api from '../../../../services/api';
import { apiCache } from '../../../../utils/apiCache';
import { getPlans } from '../../services/planService';
import bookingService from '../../../../services/bookingService';
import { walletService } from '../../../../services/walletService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import { useTheme } from '../../../../context/ThemeContext';
import {
  FiArrowLeft,
  FiUser,
  FiEdit3,
  FiClipboard,
  FiHeadphones,
  FiFileText,
  FiStar,
  FiMapPin,
  FiCreditCard,
  FiSettings,
  FiChevronRight,
  FiBell,
  FiShoppingBag,
  FiLogOut,
  FiGift,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import NotificationBell from '../../components/common/NotificationBell';
import Logo from '../../../../components/common/Logo';

const PROFILE_CACHE_KEY = 'user:profile';

const Account = () => {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  // Initialize instantly from localStorage (no loader on first render)
  const [userProfile, setUserProfile] = useState(() => {
    // 1. Check apiCache first (fastest)
    const cached = apiCache.getStale(PROFILE_CACHE_KEY);
    if (cached) return cached;
    // 2. Fallback to localStorage (always available)
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name: u.name || 'Verified Customer',
          phone: u.phone || '',
          email: u.email || '',
          isPhoneVerified: u.isPhoneVerified || false,
          isEmailVerified: u.isEmailVerified || false,
          profilePhoto: u.profilePhoto || '',
          walletBalance: u.wallet?.balance ?? 0,
          plans: u.plans || null
        };
      }
    } catch {}
    return { name: 'Verified Customer', phone: '', email: '', isPhoneVerified: false, isEmailVerified: false, walletBalance: 0, plans: null };
  });

  // Never show full-screen loader — data always available from localStorage/cache
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // SWR: if cache is still valid, skip the API call
        const cached = apiCache.get(PROFILE_CACHE_KEY);
        if (cached) {
          setUserProfile(cached);
          return;
        }

        // Fetch fresh data from API (background — no loader shown)
        const response = await userAuthService.getProfile();
        if (response.success && response.user) {
          const freshProfile = {
            name: response.user.name || 'Verified Customer',
            phone: response.user.phone || '',
            email: response.user.email || '',
            isPhoneVerified: response.user.isPhoneVerified || false,
            isEmailVerified: response.user.isEmailVerified || false,
            profilePhoto: response.user.profilePhoto || '',
            walletBalance: response.user.wallet?.balance ?? 0,
            plans: response.user.plans
          };
          apiCache.set(PROFILE_CACHE_KEY, freshProfile, 60); // Cache 60 seconds
          setUserProfile(freshProfile);
          // Update localStorage too for next visit
          try { localStorage.setItem('userData', JSON.stringify(response.user)); } catch {}
        }
      } catch (error) {
        // Silently fail — localStorage data already shown
      }
    };

    fetchProfile();
  }, []);

  // Pre-fetch sub-page data so they load instantly when user navigates
  useEffect(() => {
    const prefetchSubPages = () => {
      // 1. My Ratings — prefetch page 1 if not cached
      if (!apiCache.getStale('user:ratings:page1')) {
        bookingService.getRatings({ page: 1, limit: 10 })
          .then(res => { if (res.success) apiCache.set('user:ratings:page1', res, 60); })
          .catch(() => {});
      }

      // 2. My Plans — prefetch plans list if not cached
      if (!apiCache.getStale('public:plans')) {
        getPlans().catch(() => {});
      }

      // 3. My Bookings — prefetch if not cached
      if (!apiCache.getStale('user:bookings:')) {
        bookingService.getUserBookings({}).catch(() => {});
      }

      // 4. Wallet Transactions — prefetch if not cached
      if (!apiCache.getStale('user:wallet:transactions')) {
        walletService.getTransactions()
          .then(res => { if (res.success) apiCache.set('user:wallet:transactions', res.data || [], 30); })
          .catch(() => {});
      }
    };

    // Small delay so profile fetch takes priority
    const timer = setTimeout(prefetchSubPages, 500);
    return () => clearTimeout(timer);
  }, []);

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('+91')) return phone;
    if (phone.length === 10) return `+91 ${phone}`;
    return phone;
  };

  // Get initials for avatar
  const getInitials = () => {
    if (userProfile.name && userProfile.name !== 'Verified Customer') {
      const names = userProfile.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (userProfile.phone) {
      return userProfile.phone.slice(-2);
    }
    return 'VC';
  };

  const handleLogout = async () => {
    try {
      await userAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/user/login');
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      toast.success('Logged out successfully');
      navigate('/user/login');
    }
  };

  const [sosTriggering, setSosTriggering] = useState(false);

  const handleSOSClick = () => {
    const confirmSOS = window.confirm("EMERGENCY SOS: Are you in danger? Clicking OK will immediately alert our emergency response team and admins with your live coordinates.");
    if (!confirmSOS) return;

    setSosTriggering(true);
    const loadingToast = toast.loading('Activating SOS Alert...');

    const sendAlert = async (lat = null, lng = null) => {
      try {
        const res = await api.post('/users/sos', { lat, lng });
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

  const MenuItem = ({ icon: Icon, label, onClick, color = "text-dark-text", badge, isLast = false }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3.5 bg-card-bg hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer text-left ${!isLast ? 'border-b border-border-color' : ''}`}
    >
      <div className="flex items-center gap-2.5 md:gap-3.5">
        <div className={`w-7.5 h-7.5 md:w-9 md:h-9 rounded-md flex items-center justify-center transition-colors shrink-0`}
          style={{
            backgroundColor: color === 'text-red-500' ? '#FEF2F2' : 'var(--divider)',
            color: color === 'text-red-500' ? '#EF4444' : 'var(--primary)'
          }}
        >
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color === 'text-red-500' ? 'text-red-500' : ''}`} />
        </div>
        <span className={`font-semibold text-xs sm:text-sm md:text-base ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-red-100 text-red-600 text-[10px] md:text-xs font-bold rounded-full">
            {badge}
          </span>
        )}
        <FiChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
      </div>
    </motion.button>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Never block render with full-screen spinner — data available from cache/localStorage

  return (
    <div className="min-h-screen pb-32 relative bg-transparent">
      {/* Clean Theme Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'var(--background)'
          }}
        />
      </div>

      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-transparent border-b border-border-color px-4 py-4 w-full">
          <div className="max-w-[1360px] mx-auto px-0 md:px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="w-9 h-9 md:w-10 md:h-10 bg-card-bg rounded-md flex items-center justify-center shadow-sm border border-border-color"
              >
                <FiArrowLeft className="w-5 h-5 text-dark-text" />
              </motion.button>
              <h1 className="text-xl md:text-2xl font-bold text-dark-text tracking-tight">Account</h1>
            </div>
            <NotificationBell />
          </div>
        </header>

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4 md:px-8 lg:px-12 pt-[88px] max-w-[1360px] mx-auto w-full pb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 lg:gap-10 items-start">
            {/* Left Column: Profile Card, Active Plan, Quick Actions */}
            <div className="md:col-span-5 lg:col-span-5 space-y-4 md:sticky md:top-[96px]">
              {/* Elevated Profile Card */}
              <motion.div
                variants={itemVariants}
                className="bg-card-bg rounded-md p-2.5 md:p-4 shadow-sm relative overflow-hidden border border-border-color"
              >
                {/* Vivid Brand Accents */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 blur-3xl opacity-[0.2]"
                  style={{ backgroundColor: themeColors.brand.yellow }}
                ></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full -ml-14 -mb-14 blur-3xl opacity-[0.2]"
                  style={{ backgroundColor: themeColors.brand.teal }}
                ></div>

                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                  <div className="relative">
                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-md p-0.5 md:p-1 bg-card-bg border border-border-color shadow-sm">
                      {userProfile.profilePhoto ? (
                        <img
                          src={userProfile.profilePhoto}
                          alt={userProfile.name}
                          className="w-full h-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-md flex items-center justify-center text-white font-bold text-xs md:text-base"
                          style={{ background: themeColors.gradient }}>
                          {getInitials()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/user/update-profile')}
                      className="absolute -bottom-1 -right-1 p-0.5 md:p-1 bg-gray-900 text-white rounded-md border border-card-bg shadow-sm active:scale-95 transition-transform"
                    >
                      <FiEdit3 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm md:text-lg font-bold text-dark-text tracking-tight truncate leading-tight mb-0.5">
                      {userProfile.name}
                    </h2>
                    <p className="text-[10.5px] md:text-xs text-secondary-text font-semibold uppercase tracking-wider mb-1">
                      {userProfile.phone ? formatPhoneNumber(userProfile.phone) : 'No phone linked'}
                    </p>
                    <button
                      onClick={() => navigate('/user/update-profile')}
                      className="px-2 py-0.5 md:px-3 md:py-1 bg-light-bg hover:bg-border-color text-secondary-text border border-border-color text-[8.5px] md:text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Designer Active Plan Card */}
              {userProfile.plans && userProfile.plans.isActive && (
                <motion.div
                  variants={itemVariants}
                  onClick={() => navigate('/user/my-plan')}
                  className="relative overflow-hidden rounded-md p-5 text-white cursor-pointer group transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.brand.teal} -10%, ${themeColors.brand.orange} 120%)`,
                    boxShadow: `0 20px 40px -12px ${themeColors.brand.teal}40`
                  }}
                >
                  {/* Decorative elements */}
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FiShield className="w-4 h-4 text-white/80" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/70">Membership Status</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-1">{userProfile.plans.name}</h3>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full w-fit mt-2 border border-white/10">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Expires: {new Date(userProfile.plans.expiry).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-md flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                      <FiZap className="w-6 h-6 md:w-7 md:h-7 fill-white text-white drop-shadow-lg" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
                    <span className="text-xs md:text-sm font-bold text-white/80">Manage Benefits</span>
                    <FiChevronRight className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              )}

              {/* Quick Actions Grid */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2.5 md:gap-3.5">
                <button
                  onClick={() => navigate('/user/wallet')}
                  className="bg-card-bg py-2 px-2.5 md:p-3.5 rounded-md border border-border-color shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-md flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${themeColors.brand.teal}15`, color: themeColors.brand.teal }}
                  >
                    <MdAccountBalanceWallet className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                  </div>
                  <span className="text-[9px] md:text-xs text-secondary-text font-bold uppercase tracking-wider block">Balance</span>
                  <p className={`text-xs sm:text-sm md:text-base font-bold leading-tight mt-0.5 ${userProfile.walletBalance < 0 ? 'text-red-500' : 'text-dark-text'}`}>
                    ₹{Math.abs(userProfile.walletBalance || 0).toLocaleString('en-IN')}
                    {userProfile.walletBalance < 0 && <span className="text-[9px] font-normal ml-1">(Penalty)</span>}
                  </p>
                </button>
                <button
                  onClick={() => navigate('/user/rewards')}
                  className="bg-gray-900 py-2 px-2.5 md:p-3.5 rounded-md shadow-md hover:shadow-lg transition-all text-left relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50"></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 text-yellow-400 rounded-md flex items-center justify-center mb-1 md:mb-2 backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <FiGift className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] md:text-xs text-white/60 font-bold uppercase tracking-wider block">Rewards</span>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-white leading-tight mt-0.5">Refer & Earn</p>
                    </div>
                  </div>
                </button>
              </motion.div>

              {/* Desktop / Tablet Log Out Button */}
              <div className="hidden md:block pt-1">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs md:text-sm font-bold uppercase tracking-wider rounded-md shadow-md transition-all"
                >
                  <FiLogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Log out</span>
                </motion.button>
              </div>
            </div>

            {/* Right Column: Menu Groups (Activity, Preferences, Support & More) */}
            <div className="md:col-span-7 lg:col-span-7 space-y-5">
              {/* Activity */}
              <motion.div variants={itemVariants}>
                <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2.5 pl-1">Activity</h3>
                <div className="bg-card-bg rounded-md border border-border-color shadow-sm overflow-hidden">
                  <MenuItem
                    icon={FiClipboard}
                    label="My Bookings"
                    onClick={() => navigate('/user/my-bookings')}
                  />
                  <MenuItem
                    icon={FiFileText}
                    label="My Plans"
                    onClick={() => navigate('/user/my-plan')}
                  />
                  <MenuItem
                    icon={FiStar}
                    label="My Ratings"
                    onClick={() => navigate('/user/my-rating')}
                    isLast={true}
                  />
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div variants={itemVariants}>
                <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2.5 pl-1">Preferences</h3>
                <div className="bg-card-bg rounded-md border border-border-color shadow-sm overflow-hidden">
                  <MenuItem
                    icon={isDark ? FiSun : FiMoon}
                    label={isDark ? "Dark Mode" : "Light Mode"}
                    badge={isDark ? "Dark" : "Light"}
                    onClick={toggleTheme}
                  />
                  <MenuItem
                    icon={FiMapPin}
                    label="Manage Addresses"
                    onClick={() => navigate('/user/manage-addresses')}
                  />
                  <MenuItem
                    icon={FiSettings}
                    label="Settings"
                    onClick={() => navigate('/user/settings')}
                    isLast={true}
                  />
                </div>
              </motion.div>

              {/* Support & Legal */}
              <motion.div variants={itemVariants}>
                <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2.5 pl-1">Support & More</h3>
                <div className="bg-card-bg rounded-md border border-border-color shadow-sm overflow-hidden">
                  <MenuItem
                    icon={FiHeadphones}
                    label="Help & Support"
                    onClick={() => navigate('/user/help-support')}
                  />
                  <MenuItem
                    icon={FiShield}
                    label="SOS Emergency Alert"
                    color="text-red-500"
                    onClick={handleSOSClick}
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/user/about-cleaning-expert')}
                    className="w-full flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3.5 bg-card-bg hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 md:gap-3.5">
                      <div className="w-7.5 h-7.5 md:w-9 md:h-9 rounded-md flex items-center justify-center bg-gray-500/10 transition-colors group-hover:bg-opacity-80 shrink-0">
                        <Logo className="w-6 h-6 md:w-7 md:h-7" iconOnly={true} />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm md:text-base text-dark-text">About Doormeets</span>
                    </div>
                    <FiChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Mobile Only Log Out Button */}
              <div className="block md:hidden pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md transition-all mb-3"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </motion.button>
              </div>

              <motion.div variants={itemVariants} className="text-center md:text-left pt-2 pb-4">
                <p className="text-xs md:text-sm font-medium text-gray-400">Version 7.6.27 R547</p>
              </motion.div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Account;
