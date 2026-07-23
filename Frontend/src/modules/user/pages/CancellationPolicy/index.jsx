import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle, FiClock, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { themeColors } from '../../../../theme';
import { configService } from '../../../../services/configService';

const CancellationPolicy = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState({
    penalty: 49,
    visitingCharges: 49
  });
  const [config, setConfig] = useState({
    freeCancellationTitle: 'Free Cancellation',
    freeCancellationDesc: 'Until professional is assigned',
    lateFeeTitle: 'Late Fee',
    lateFeeDesc: 'If cancelled after assignment',
    stage1Title: 'Before Journey Start',
    stage1Desc: 'Any time before professional starts travel',
    stage1RefundText: 'Full Refund • No Fee',
    stage2Title: 'Journey Started',
    stage2Desc: 'When professional is on the way',
    stage2RefundText: '₹{penalty} Cancellation Penalty Applies',
    stage3Title: 'Professional Arrived',
    stage3Desc: 'When professional reaches your location',
    stage3RefundText: '₹{visitingCharges} Visiting Charges Apply',
    whyChargeTitle: 'Why do we charge a fee?',
    whyChargeSubtitle: 'To support our professionals time & effort',
    whyChargeDetails: 'Our service partners reserve their time exclusively for your booking and may travel significant distances. The cancellation fee compensates them for their lost time and travel expenses if a confirmed booking is cancelled last minute.',
    rescheduleTitle: 'Need to change plans?',
    rescheduleDesc: 'Instead of cancelling, you can reschedule your booking for free up to 2 hours before the service time.',
    rescheduleButtonLabel: 'Go Back to Booking'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await configService.getSettings();
        if (res.success && res.settings) {
          setFees({
            penalty: res.settings.cancellationPenalty || 49,
            visitingCharges: res.settings.visitedCharges || 49
          });
          if (res.settings.cancellationPageConfig) {
            setConfig(prev => ({
              ...prev,
              ...res.settings.cancellationPageConfig
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatText = (text) => {
    if (!text) return '';
    return text
      .replace('{penalty}', fees.penalty)
      .replace('{visitingCharges}', fees.visitingCharges);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b shadow-sm" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Cancellation Policy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Key Policy Highlights with Icons */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl shadow-sm border flex flex-col items-center text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{config.freeCancellationTitle}</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{config.freeCancellationDesc}</p>
          </div>
          <div className="p-4 rounded-2xl shadow-sm border flex flex-col items-center text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
              <FiClock className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{config.lateFeeTitle}</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{config.lateFeeDesc}</p>
          </div>
        </div>

        {/* Detailed Timeline Visualization */}
        <div className="rounded-3xl p-6 shadow-sm border overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-normal mb-6" style={{ color: 'var(--text-primary)' }}>Cancellation Timeline</h2>

          <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">

            {/* Stage 1 */}
            <div className="relative">
              <span className="absolute -left-8 w-8 h-8 rounded-full bg-green-500 border-4 shadow-sm flex items-center justify-center z-10" style={{ borderColor: 'var(--card-bg)' }}>
                <FiCheckCircle className="w-4 h-4 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{config.stage1Title}</h3>
                <p className="text-xs mt-1 mb-2" style={{ color: 'var(--text-secondary)' }}>{config.stage1Desc}</p>
                <div className="inline-block px-3 py-1 text-xs font-normal rounded-lg border" style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>
                  {formatText(config.stage1RefundText)}
                </div>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="relative">
              <span className="absolute -left-8 w-8 h-8 rounded-full bg-orange-400 border-4 shadow-sm flex items-center justify-center z-10" style={{ borderColor: 'var(--card-bg)' }}>
                <FiClock className="w-4 h-4 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{config.stage2Title}</h3>
                <p className="text-xs mt-1 mb-2" style={{ color: 'var(--text-secondary)' }}>{config.stage2Desc}</p>
                <div className="inline-block px-3 py-1 text-xs font-normal rounded-lg border" style={{ backgroundColor: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
                  {formatText(config.stage2RefundText)}
                </div>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="relative">
              <span className="absolute -left-8 w-8 h-8 rounded-full bg-red-500 border-4 shadow-sm flex items-center justify-center z-10" style={{ borderColor: 'var(--card-bg)' }}>
                <FiAlertCircle className="w-4 h-4 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{config.stage3Title}</h3>
                <p className="text-xs mt-1 mb-2" style={{ color: 'var(--text-secondary)' }}>{config.stage3Desc}</p>
                <div className="inline-block px-3 py-1 text-xs font-normal rounded-lg border" style={{ backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}>
                  {formatText(config.stage3RefundText)}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <FiInfo className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-normal" style={{ color: 'var(--text-primary)' }}>{config.whyChargeTitle}</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{config.whyChargeSubtitle}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl text-sm leading-relaxed border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {config.whyChargeDetails}
          </div>
        </div>

        {/* Reschedule Option */}
        <div className="rounded-3xl p-6 border" style={{ backgroundColor: 'rgba(20,184,166,0.05)', borderColor: 'rgba(20,184,166,0.2)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--primary)' }}>{config.rescheduleTitle}</h3>
          <p className="text-sm mb-4 opacity-90" style={{ color: 'var(--text-secondary)' }}>
            {config.rescheduleDesc}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-white text-teal-700 font-normal rounded-xl shadow-sm border border-teal-200 active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--primary)', borderColor: 'var(--border)' }}
          >
            {config.rescheduleButtonLabel}
          </button>
        </div>

      </main>
    </div>
  );
};

export default CancellationPolicy;
