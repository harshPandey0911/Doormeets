import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiBriefcase, FiUsers, FiCheckCircle } from 'react-icons/fi';

import { vendorTheme as themeColors } from '../../../../../theme';

const StatsCards = memo(({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Earnings",
      value: `₹${stats.todayEarnings.toLocaleString()}`,
      icon: "https://cdn-icons-gif.flaticon.com/15575/15575639.gif",
      gradient: 'linear-gradient(135deg, #f3f0ff 0%, #e5dbff 100%)',
      accent: '#9634f7',
      onClick: () => navigate('/vendor/earnings')
    },
    {
      title: 'Pending Alerts',
      value: stats.pendingAlerts,
      icon: "https://cdn-icons-gif.flaticon.com/17702/17702121.gif",
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      accent: '#0284c7',
      onClick: () => navigate('/vendor/booking-alerts')
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: "https://cdn-icons-gif.flaticon.com/19018/19018451.gif",
      gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      accent: '#16a34a',
      onClick: () => navigate('/vendor/jobs')
    },
    {
      title: 'My Services',
      value: stats.totalCategories || 0,
      icon: "https://cdn-icons-gif.flaticon.com/15370/15370728.gif",
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      accent: '#ea580c',
      onClick: () => navigate('/vendor/my-services')
    }
  ];

  return (
    <div className="px-3.5 pt-2">
      <div className="grid grid-cols-2 gap-2 mb-2">
        {cards.map((card, index) => {
          const isAnimated = typeof card.icon === 'string' && card.icon.endsWith('.gif');
          const IconComponent = !isAnimated ? card.icon : null;

          return (
            <div
              key={index}
              onClick={card.onClick}
              className="rounded-md p-2.5 relative overflow-hidden cursor-pointer active:scale-95 transition-all duration-300 min-h-[72px] flex flex-col justify-between"
              style={{
                background: card.gradient,
                border: `1.5px solid ${card.accent}15`,
                boxShadow: `0 4px 12px ${card.accent}10`,
              }}
            >
              {/* Decorative Pattern */}
              <div
                className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10"
                style={{
                  background: `radial-gradient(circle, ${card.accent} 0%, transparent 70%)`,
                  transform: 'translate(10px, -10px)',
                }}
              />

              {/* Icon - Positioned Absolutely at Top-Right */}
              <div
                className="absolute right-2 top-2 p-1 rounded-md flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${card.accent}25`,
                  width: '32px',
                  height: '32px'
                }}
              >
                {isAnimated ? (
                  <img 
                    src={card.icon} 
                    alt={card.title} 
                    className="w-6 h-6 object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                ) : (
                  <IconComponent className="w-4 h-4" style={{ color: card.accent }} />
                )}
              </div>

              {/* Text Info */}
              <div className="relative z-10 pr-6 mt-1">
                <p className="text-[8px] text-gray-500 font-bold mb-0.5 uppercase tracking-normal truncate">
                  {card.title}
                </p>
                <p className={`font-bold text-gray-900 leading-tight truncate ${
                  String(card.value).length > 8 ? 'text-base' :
                  String(card.value).length > 5 ? 'text-lg' : 'text-xl'
                }`}>
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StatsCards.displayName = 'VendorStatsCards';

export default StatsCards;
