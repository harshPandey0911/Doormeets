import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiStar, FiCheckCircle, FiInfo, FiChevronLeft, FiActivity, FiShield } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import { vendorAuthService } from '../../../../services/authService';
import { configService } from '../../../../services/configService';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';

const MyLevel = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dynamicConfig, setDynamicConfig] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const loadProfile = async () => {
      try {
        const [res, configRes] = await Promise.all([
          vendorAuthService.getProfile(),
          configService.getSettings().catch(() => null)
        ]);
        if (res && res.success) {
          setProfile(res.vendor);
        }
        if (configRes && configRes.success && configRes.settings?.levelConfig) {
          setDynamicConfig(configRes.settings.levelConfig);
        }
      } catch (err) {
        console.error('Error loading level data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return <LogoLoader />;
  }

  // Fallback defaults
  const currentLevel = profile?.currentLevel || 'L3'; // 'L1', 'L2', 'L3'
  const rating = profile?.rating || 0;
  const totalJobs = profile?.totalJobs || 0;
  const completionRate = profile?.completionRate || 0;

  // Level Details Configuration
  const levelsInfo = {
    L3: {
      name: dynamicConfig?.L3?.name || 'Level 3 (Beginner)',
      badge: dynamicConfig?.L3?.badge || 'Bronze Partner',
      color: dynamicConfig?.L3?.color || '#D97706', // Amber/Bronze
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L3?.color || '#D97706')}10 0%, ${(dynamicConfig?.L3?.color || '#D97706')}20 100%)`,
      text: dynamicConfig?.L3?.color || '#D97706',
      desc: dynamicConfig?.L3?.desc || 'You are currently on Level 3. Complete more jobs and maintain high ratings to upgrade your level.',
      steps: [
        { label: `Complete ${dynamicConfig?.L3?.targetJobs || 15} successful bookings`, target: dynamicConfig?.L3?.targetJobs || 15, current: totalJobs, metric: 'jobs' },
        { label: `Maintain a customer rating of ${dynamicConfig?.L3?.targetRating || 4.2} or above`, target: dynamicConfig?.L3?.targetRating || 4.2, current: rating, metric: 'rating' },
        { label: `Keep job completion rate above ${dynamicConfig?.L3?.targetCompletionRate || 85}%`, target: dynamicConfig?.L3?.targetCompletionRate || 85, current: Math.round(completionRate), metric: 'percent' }
      ],
      nextLevel: 'Level 2'
    },
    L2: {
      name: dynamicConfig?.L2?.name || 'Level 2 (Professional)',
      badge: dynamicConfig?.L2?.badge || 'Silver Partner',
      color: dynamicConfig?.L2?.color || '#0D9488', // Teal/Silver
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L2?.color || '#0D9488')}10 0%, ${(dynamicConfig?.L2?.color || '#0D9488')}20 100%)`,
      text: dynamicConfig?.L2?.color || '#0D9488',
      desc: dynamicConfig?.L2?.desc || 'Great job! You are a Level 2 partner. Keep providing excellent service to climb to the top Level 1.',
      steps: [
        { label: `Complete ${dynamicConfig?.L2?.targetJobs || 50} successful bookings in total`, target: dynamicConfig?.L2?.targetJobs || 50, current: totalJobs, metric: 'jobs' },
        { label: `Maintain a customer rating of ${dynamicConfig?.L2?.targetRating || 4.7} or above`, target: dynamicConfig?.L2?.targetRating || 4.7, current: rating, metric: 'rating' },
        { label: `Keep job completion rate above ${dynamicConfig?.L2?.targetCompletionRate || 92}%`, target: dynamicConfig?.L2?.targetCompletionRate || 92, current: Math.round(completionRate), metric: 'percent' }
      ],
      nextLevel: 'Level 1'
    },
    L1: {
      name: dynamicConfig?.L1?.name || 'Level 1 (Expert)',
      badge: dynamicConfig?.L1?.badge || 'Gold Elite Partner',
      color: dynamicConfig?.L1?.color || '#EAB308', // Gold
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L1?.color || '#EAB308')}10 0%, ${(dynamicConfig?.L1?.color || '#EAB308')}20 100%)`,
      text: dynamicConfig?.L1?.color || '#EAB308',
      desc: dynamicConfig?.L1?.desc || 'Congratulations! You are a Level 1 Elite partner. You receive the highest preference in matching and premium job bookings.',
      steps: [
        { label: dynamicConfig?.L1?.maintenanceDesc || 'Complete at least 10 bookings every month', target: dynamicConfig?.L1?.targetJobs || 10, current: 'Ongoing', metric: 'text' },
        { label: `Maintain a customer rating of ${dynamicConfig?.L1?.targetRating || 4.7} or above`, target: dynamicConfig?.L1?.targetRating || 4.7, current: rating, metric: 'rating' },
        { label: dynamicConfig?.L1?.violationDesc || 'Zero safety violations or major complaints', target: 0, current: 'Clean', metric: 'text' }
      ],
      nextLevel: null
    }
  };

  const currentLevelInfo = levelsInfo[currentLevel] || levelsInfo.L3;

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="My Partner Level" />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/vendor/profile')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-5 active:scale-95 transition-transform"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Profile
        </button>

        {/* Level Banner Card */}
        <div
          className="rounded-2xl p-6 mb-6 shadow-md border relative overflow-hidden"
          style={{
            background: currentLevelInfo.bg,
            borderColor: `${currentLevelInfo.color}30`
          }}
        >
          {/* Decorative Medal Background Icon */}
          <FiAward
            className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10"
            style={{ color: currentLevelInfo.color }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm border-2 border-white"
              style={{ backgroundColor: `${currentLevelInfo.color}15` }}
            >
              <FiAward className="w-9 h-9" style={{ color: currentLevelInfo.color }} />
            </div>

            <span
              className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-1"
              style={{
                backgroundColor: `${currentLevelInfo.color}20`,
                color: currentLevelInfo.color
              }}
            >
              {currentLevelInfo.badge}
            </span>

            <h2 className="text-xl font-black mb-2" style={{ color: currentLevelInfo.text }}>
              {currentLevelInfo.name}
            </h2>

            <p className="text-xs font-medium leading-relaxed max-w-xs" style={{ color: `${currentLevelInfo.text}CC` }}>
              {currentLevelInfo.desc}
            </p>
          </div>
        </div>

        {/* Current Metrics Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FiActivity className="w-4 h-4 text-teal-600" />
            Your Current Stats
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Rating</span>
              <span className="text-base font-black text-gray-800 flex items-center justify-center gap-1 mt-1">
                <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                {rating > 0 ? rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Jobs Done</span>
              <span className="text-base font-black text-gray-800 block mt-1">{totalJobs}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Completion</span>
              <span className="text-base font-black text-gray-800 block mt-1">{Math.round(completionRate)}%</span>
            </div>
          </div>
        </div>

        {/* Upgrade / Maintenance Roadmap */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FiShield className="w-4 h-4 text-orange-600" />
            {currentLevel === 'L1' ? 'Level 1 Maintenance Criteria' : `Steps to reach ${currentLevelInfo.nextLevel}`}
          </h3>

          <div className="space-y-4">
            {currentLevelInfo.steps.map((step, idx) => {
              // Check if requirement is met
              let isMet = false;
              if (step.metric === 'jobs') {
                isMet = totalJobs >= step.target;
              } else if (step.metric === 'rating') {
                isMet = rating >= step.target;
              } else if (step.metric === 'percent') {
                isMet = completionRate >= step.target;
              } else {
                isMet = true; // default met for text descriptions
              }

              return (
                <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                  <FiCheckCircle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isMet ? 'text-green-500 fill-green-50' : 'text-gray-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 leading-tight">
                      {step.label}
                    </p>
                    {step.metric !== 'text' && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
                        <span className="text-[10px] font-extrabold" style={{ color: isMet ? '#10B981' : '#F59E0B' }}>
                          {step.current} / {step.target}
                          {step.metric === 'percent' ? '%' : ''}
                        </span>
                      </div>
                    )}
                    {step.metric !== 'text' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: isMet ? '#10B981' : '#F59E0B',
                            width: `${Math.min(100, Math.max(0, (step.metric === 'rating' ? (rating / step.target) * 100 : (totalJobs / step.target) * 100)))}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Info Box */}
        <div className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100 flex gap-3">
          <FiInfo className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-teal-950">Why Level matters?</h4>
            <p className="text-[11px] text-teal-900/80 leading-relaxed font-semibold">
              Higher-level partners receive bookings on priority, pay lower platform commissions, and get special elite badges on their profiles visible to customers!
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyLevel;
