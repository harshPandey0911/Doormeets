import React, { useState, useEffect } from 'react';
import { FiAward, FiStar, FiCheckCircle, FiInfo, FiShield } from 'react-icons/fi';
import { vendorAuthService } from '../../../../services/authService';
import { configService } from '../../../../services/configService';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';

const MyLevel = () => {
  const [profile, setProfile] = useState(null);
  const [dynamicConfig, setDynamicConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('L3'); // 'L3', 'L2', 'L1'




  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [res, configRes] = await Promise.all([
          vendorAuthService.getProfile(),
          configService.getSettings().catch(() => null)
        ]);
        if (res && res.success) {
          setProfile(res.vendor);
          if (res.vendor?.currentLevel) {
            setSelectedTab(res.vendor.currentLevel);
          }
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
  const userCurrentLevel = profile?.currentLevel || 'L3'; // 'L1', 'L2', 'L3'
  const rating = profile?.rating || 0;
  const totalJobs = profile?.totalJobs || 0;
  const completionRate = profile?.completionRate || 0;

  // Level Details Configuration
  const levelsInfo = {
    L3: {
      key: 'L3',
      name: dynamicConfig?.L3?.badge || dynamicConfig?.L3?.name || 'Level 3',
      badge: dynamicConfig?.L3?.badge || 'Bronze Partner',
      color: dynamicConfig?.L3?.color || '#D97706',
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L3?.color || '#D97706')}15 0%, ${(dynamicConfig?.L3?.color || '#D97706')}30 100%)`,
      text: dynamicConfig?.L3?.color || '#D97706',
      desc: dynamicConfig?.L3?.desc || 'You are currently on Level 3. Complete more jobs and maintain high ratings to upgrade your level.',
      customSteps: dynamicConfig?.L3?.customSteps || [
        'Complete at least 15 customer bookings',
        'Maintain minimum 4.2 customer rating',
        'Achieve 85%+ booking completion rate'
      ],
      steps: [
        { label: `Target Completed Bookings`, target: dynamicConfig?.L3?.targetJobs || 15, current: totalJobs, metric: 'jobs' },
        { label: `Min Customer Rating`, target: dynamicConfig?.L3?.targetRating || 4.2, current: rating, metric: 'rating' },
        { label: `Min Completion Rate`, target: dynamicConfig?.L3?.targetCompletionRate || 85, current: Math.round(completionRate), metric: 'percent' }
      ],
      nextLevel: dynamicConfig?.L2?.badge || dynamicConfig?.L2?.name || 'Level 2'
    },
    L2: {
      key: 'L2',
      name: dynamicConfig?.L2?.badge || dynamicConfig?.L2?.name || 'Level 2',
      badge: dynamicConfig?.L2?.badge || 'Silver Partner',
      color: dynamicConfig?.L2?.color || '#0D9488',
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L2?.color || '#0D9488')}15 0%, ${(dynamicConfig?.L2?.color || '#0D9488')}30 100%)`,
      text: dynamicConfig?.L2?.color || '#0D9488',
      desc: dynamicConfig?.L2?.desc || 'Great job! You are a Level 2 partner. Keep providing excellent service to climb to the top Level 1.',
      customSteps: dynamicConfig?.L2?.customSteps || [
        'Complete at least 50 customer bookings',
        'Maintain minimum 4.7 customer rating',
        'Achieve 92%+ booking completion rate'
      ],
      steps: [
        { label: `Target Completed Bookings`, target: dynamicConfig?.L2?.targetJobs || 50, current: totalJobs, metric: 'jobs' },
        { label: `Min Customer Rating`, target: dynamicConfig?.L2?.targetRating || 4.7, current: rating, metric: 'rating' },
        { label: `Min Completion Rate`, target: dynamicConfig?.L2?.targetCompletionRate || 92, current: Math.round(completionRate), metric: 'percent' }
      ],
      nextLevel: dynamicConfig?.L1?.badge || dynamicConfig?.L1?.name || 'Level 1'
    },
    L1: {
      key: 'L1',
      name: dynamicConfig?.L1?.badge || dynamicConfig?.L1?.name || 'Level 1',
      badge: dynamicConfig?.L1?.badge || 'Gold Elite Partner',
      color: dynamicConfig?.L1?.color || '#EAB308',
      bg: `linear-gradient(135deg, ${(dynamicConfig?.L1?.color || '#EAB308')}15 0%, ${(dynamicConfig?.L1?.color || '#EAB308')}30 100%)`,
      text: dynamicConfig?.L1?.color || '#EAB308',
      desc: dynamicConfig?.L1?.desc || 'Congratulations! You are a Level 1 Elite partner. You receive the highest preference in matching and premium job bookings.',
      customSteps: dynamicConfig?.L1?.customSteps || [
        'Complete at least 10 bookings every month',
        'Maintain 4.7+ customer rating',
        'Zero safety violations or major complaints'
      ],
      steps: [
        { label: `Target Completed Bookings`, target: dynamicConfig?.L1?.targetJobs || 100, current: totalJobs, metric: 'jobs' },
        { label: `Min Customer Rating`, target: dynamicConfig?.L1?.targetRating || 4.7, current: rating, metric: 'rating' },
        { label: `Min Completion Rate`, target: dynamicConfig?.L1?.targetCompletionRate || 95, current: Math.round(completionRate), metric: 'percent' }
      ],
      nextLevel: null
    }
  };

  const activeLevelInfo = levelsInfo[selectedTab] || levelsInfo.L3;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* ─── Full-width Red Theme Top Section with Subtle Curved Bottom ─── */}
      <div
        className="relative pt-4 pb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #E5534C 0%, #F06E67 50%, #D3433C 100%)',
          borderBottomLeftRadius: '50% 24px',
          borderBottomRightRadius: '50% 24px',
        }}
      >
        {/* Decorative white blobs in bg */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="px-4 max-w-lg mx-auto flex justify-center py-1 min-h-[235px] relative items-center">
          {/* ─── Stacked Cards Deck (Taas ke Patte Style with Swap) ─── */}
          {['L3', 'L2', 'L1'].map((lvlKey) => {
            const lvl = levelsInfo[lvlKey];
            const isSelected = selectedTab === lvlKey;
            const isUserCurrent = userCurrentLevel === lvlKey;

            // Stack Positions based on relative index to selectedTab
            const levelOrder = ['L3', 'L2', 'L1'];
            const selIdx = levelOrder.indexOf(selectedTab);
            const thisIdx = levelOrder.indexOf(lvlKey);
            const diff = (thisIdx - selIdx + 3) % 3; // 0 = front (selected), 1 = middle/back, 2 = deep back

            // Calculate rotation & translation so cards are tilted left while peeking to the right
            let rotate = '-5deg';
            let translateX = '0px';
            let translateY = '0px';
            let zIndex = 30;
            let opacity = 1;

            if (diff === 0) {
              // Front Active Selected Card (Tilted Left)
              rotate = '-5deg';
              translateX = '0px';
              translateY = '0px';
              zIndex = 30;
              opacity = 1;
            } else if (diff === 1) {
              // 1st Card behind (Slightly less tilted left, peeking Right)
              rotate = '-1deg';
              translateX = '16px';
              translateY = '4px';
              zIndex = 20;
              opacity = 0.9;
            } else {
              // 2nd Card deep behind (Peeking Further Right)
              rotate = '3deg';
              translateX = '30px';
              translateY = '8px';
              zIndex = 10;
              opacity = 0.8;
            }

            // Click handler: if clicking top selected card, swap to next level card in cycle
            const handleCardClick = () => {
              if (isSelected) {
                const nextTab = levelOrder[(selIdx + 1) % 3];
                setSelectedTab(nextTab);
              } else {
                setSelectedTab(lvlKey);
              }
            };

            return (
              <div
                key={lvlKey}
                onClick={handleCardClick}
                className={`absolute bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-[245px] cursor-pointer border ${
                  isSelected
                    ? 'shadow-amber-950/40 ring-2 ring-white/90'
                    : 'hover:opacity-100'
                }`}
                style={{
                  transform: `translate(${translateX}, ${translateY}) rotate(${rotate}) scale(${diff === 0 ? 1.04 : 0.95})`,
                  zIndex: zIndex,
                  opacity: opacity,
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  borderColor: isSelected ? lvl.color : '#E5E7EB',
                  WebkitMaskImage: 'radial-gradient(circle 14px at 0px 50%, transparent 100%, black 100%), radial-gradient(circle 14px at 100% 50%, transparent 100%, black 100%)',
                  maskImage: 'radial-gradient(circle 14px at 0px 50%, transparent 100%, black 100%), radial-gradient(circle 14px at 100% 50%, transparent 100%, black 100%)',
                  WebkitMaskComposite: 'destination-in',
                  maskComposite: 'intersect'
                }}
              >
                {/* Ticket TOP: Icon + Name + Desc */}
                <div className="flex flex-col items-center text-center px-3 pt-3 pb-1.5 relative">
                  {isUserCurrent && (
                    <span className="absolute top-2 right-2 bg-emerald-500 text-white px-1.5 py-0.2 rounded-full text-[7.5px] font-black tracking-wider shadow-xs">
                      CURRENT
                    </span>
                  )}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center mb-1 shadow-md border-2 border-white"
                    style={{ backgroundColor: lvl.color }}
                  >
                    <FiAward className="w-5 h-5 text-white" />
                  </div>

                  <h2
                    className="text-base font-black tracking-tight mb-0.5 capitalize flex items-center gap-1"
                    style={{ color: lvl.color }}
                  >
                    {lvl.name}
                  </h2>

                  <p className="text-[9px] font-medium leading-normal text-gray-500 px-1">
                    {lvl.desc}
                  </p>
                </div>

                {/* Dashed Line Divider */}
                <div className="px-5 my-0.5">
                  <div
                    className="w-full border-t border-dashed"
                    style={{ borderColor: `${lvl.color}33` }}
                  />
                </div>

                {/* Ticket BOTTOM: Stats */}
                <div className="grid grid-cols-3 px-2 py-1.5 bg-gray-50/60">
                  <div className="flex flex-col items-center gap-0">
                    <div className="flex items-center gap-0.5">
                      <FiStar className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span className="text-xs font-black text-gray-800">
                        {rating > 0 ? rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider">Rating</span>
                  </div>

                  <div
                    className="flex flex-col items-center gap-0 border-x"
                    style={{ borderColor: `${lvl.color}22` }}
                  >
                    <span className="text-xs font-black text-gray-800">{totalJobs}</span>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider text-center leading-tight">
                      Jobs Done
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-0">
                    <span className="text-xs font-black text-gray-800">{Math.round(completionRate)}%</span>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider">Completion</span>
                  </div>
                </div>

              </div>
            );
          })}
          {/* ─── End Stacked Cards Deck ─── */}

        </div>
      </div>
      {/* ─── End Red Section ─── */}

      {/* ─── Below section: Steps + Requirements + Benefits ─── */}
      <main className="px-4 pt-4 pb-6 max-w-lg mx-auto">

        {/* Dynamic Level Upgrade Steps Roadmap (Horizontal Taped Sticky Cards Layout) */}
        {(activeLevelInfo.customSteps && activeLevelInfo.customSteps.length > 0) && (
          <div className="mb-6 relative">
            <div className="text-center mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                ROADMAP TO SUCCESS
              </span>
              <h3 className="text-sm font-black text-gray-800 tracking-tight">
                {selectedTab === 'L1'
                  ? `How to Maintain Your Current Level?`
                  : `How to Upgrade Your Level?`}
              </h3>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pt-5 pb-4 px-2 no-scrollbar scroll-smooth snap-x snap-mandatory">
              {activeLevelInfo.customSteps.map((stepItem, idx) => {
                const tapeColors = [
                  'bg-rose-400/80',
                  'bg-emerald-400/80',
                  'bg-amber-400/80',
                  'bg-teal-400/80',
                  'bg-indigo-400/80'
                ];
                const cardBgGradients = [
                  'from-rose-50/70 to-white text-rose-900',
                  'from-emerald-50/70 to-white text-emerald-900',
                  'from-amber-50/70 to-white text-amber-900',
                  'from-teal-50/70 to-white text-teal-900',
                  'from-indigo-50/70 to-white text-indigo-900'
                ];

                const tapeBg = tapeColors[idx % tapeColors.length];
                const cardBg = cardBgGradients[idx % cardBgGradients.length];

                // Alternate rotation angles for realistic tape post-it feel
                const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3'];
                const rot = rotations[idx % rotations.length];

                return (
                  <div
                    key={idx}
                    className={`snap-center shrink-0 w-[165px] relative bg-white rounded-2xl p-3 pt-5 shadow-lg border border-gray-100/90 transition-transform duration-300 hover:scale-102 ${rot}`}
                    style={{
                      boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    {/* Washi Tape Strip at Top Center */}
                    <div
                      className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-4 ${tapeBg} rounded-xs shadow-xs transform -rotate-2 opacity-85 border-t border-white/40`}
                      style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 96% 100%, 4% 100%)'
                      }}
                    />

                    {/* Step Inner Colored Box */}
                    <div className={`rounded-xl p-2.5 bg-gradient-to-b ${cardBg} mb-2 border border-white/60`}>
                      <span className="text-lg font-bold tracking-tight block mb-0.5 opacity-85">
                        0{idx + 1}
                      </span>
                      <p className="text-[10px] font-medium leading-snug tracking-normal text-gray-700 line-clamp-3">
                        {stepItem}
                      </p>
                    </div>

                    {/* Step Label Footer */}
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase text-gray-400 px-0.5">
                      <span>Step {idx + 1}</span>
                      <span className="text-emerald-600 font-bold">✓ Action</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requirements & Target Metrics */}
        <div className="mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
            <FiShield className="w-4 h-4 text-[#B33A35]" />
            Requirements &amp; Targets ({activeLevelInfo.name})
          </h3>

          <div className="space-y-3">
            {activeLevelInfo.steps.map((step, idx) => {
              let isMet = false;
              let currentVal = 0;
              let targetVal = step.target;
              let percent = 0;

              if (step.metric === 'jobs') {
                currentVal = totalJobs;
                isMet = totalJobs >= step.target;
                percent = Math.min(100, Math.max(0, (totalJobs / step.target) * 100));
              } else if (step.metric === 'rating') {
                currentVal = rating;
                isMet = rating >= step.target;
                percent = Math.min(100, Math.max(0, (rating / step.target) * 100));
              } else if (step.metric === 'percent') {
                currentVal = Math.round(completionRate);
                isMet = completionRate >= step.target;
                percent = Math.min(100, Math.max(0, (completionRate / step.target) * 100));
              }

              return (
                <div key={idx} className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle
                        className={`w-4 h-4 shrink-0 ${
                          isMet ? 'text-emerald-500 fill-emerald-50' : 'text-gray-300'
                        }`}
                      />
                      <span className="text-xs font-bold text-gray-800">
                        {step.label}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isMet ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isMet ? 'TARGET MET ✓' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-semibold text-gray-400">Current Progress</span>
                    <span className="font-extrabold text-gray-800">
                      {step.metric === 'rating' ? (currentVal > 0 ? currentVal.toFixed(1) : '0.0') : currentVal}
                      {step.metric === 'percent' ? '%' : ''} / {targetVal}{step.metric === 'percent' ? '%' : ''}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: isMet ? '#10B981' : activeLevelInfo.color,
                        width: `${percent}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Info Box */}
        <div className="bg-red-50/70 rounded-2xl p-4 border border-red-100 flex gap-3">
          <FiInfo className="w-5 h-5 text-[#B33A35] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[#9E2E2A]">Why Level Target Matters?</h4>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              Achieving your level targets grants high matching priority for new customer bookings, lower commission rates, and an exclusive verified badge!
            </p>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default MyLevel;
