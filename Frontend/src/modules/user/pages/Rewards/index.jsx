import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { FiCopy, FiArrowLeft, FiGift, FiBell } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';
import { themeColors } from '../../../../theme';
import { userAuthService } from '../../../../services/authService';

const Rewards = () => {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState({
    referralCode: '',
    referrerReward: 100,
    refereeReward: 100,
    successfulReferrals: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      try {
        const response = await userAuthService.getReferralDetails();
        if (response.success) {
          setReferralData({
            referralCode: response.referralCode,
            referrerReward: response.referrerReward,
            refereeReward: response.refereeReward,
            successfulReferrals: response.successfulReferrals,
            totalEarnings: response.totalEarnings
          });
        }
      } catch (error) {
        console.error('Error fetching referral details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReferralDetails();
  }, []);

  const handleCopyLink = () => {
    const referralLink = `https://Doormeets.in/user/signup?referral=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };

  const handleShareWhatsApp = () => {
    const text = `Join Door Meets using my referral code ${referralData.referralCode} and get ₹${referralData.refereeReward} welcome reward in your wallet!`;
    const url = `https://Doormeets.in/user/signup?referral=${referralData.referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const handleShareMessenger = () => {
    const url = `https://Doormeets.in/user/signup?referral=${referralData.referralCode}`;
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=your-app-id`, '_blank');
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-50 border-b px-4 py-3.5 shadow-xs transition-colors w-full"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-[1360px] mx-auto px-0 md:px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <div className="flex items-center gap-2">
              <FiGift className="w-5 h-5 text-emerald-500" />
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Refer & Earn</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/notifications')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
          >
            <FiBell className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      <main className="max-w-[1360px] mx-auto w-full px-4 md:px-8 lg:px-12 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Main Referral Card */}
          <div className="md:col-span-7 lg:col-span-7">
            <div 
              className="relative overflow-hidden border rounded-3xl p-5 md:p-7 shadow-xs transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              {/* Dotted Pattern Background */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--text-primary)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
              </div>

              <div className="relative space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Refer and get FREE services
                    </h2>
                    <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Invite your friends to try our services. They get instant ₹{referralData.refereeReward} wallet balance on signup. You get ₹{referralData.referrerReward} once they complete their first booking.
                    </p>
                  </div>
                  {/* Gift Box Illustration */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400 rounded-2xl flex items-center justify-center transform rotate-12 shadow-md">
                      <span className="text-3xl md:text-4xl">🎁</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-orange-400 rounded-full"></div>
                  </div>
                </div>

                {/* Referral Code Display Box */}
                <div 
                  className="border rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-xs transition-colors"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Your Referral Code</p>
                    <p className="text-xl md:text-2xl font-bold tracking-wide font-mono" style={{ color: 'var(--text-primary)' }}>{referralData.referralCode || 'DM-XXXXXX'}</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy
                  </button>
                </div>

                {/* Stats Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="border rounded-2xl p-4 md:p-5 shadow-xs text-center transition-colors"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-[10px] md:text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Total Referrals</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{referralData.successfulReferrals}</p>
                  </div>
                  <div 
                    className="border rounded-2xl p-4 md:p-5 shadow-xs text-center transition-colors"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-[10px] md:text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Total Earnings</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-teal-600 dark:text-teal-400">₹{referralData.totalEarnings}</p>
                  </div>
                </div>

                {/* Refer Via Section */}
                <div className="pt-2">
                  <p className="text-xs md:text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Refer via</p>
                  <div className="flex gap-4">
                    {/* WhatsApp */}
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 active:scale-95">
                        <FaWhatsapp className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Whatsapp</span>
                    </button>

                    {/* Messenger */}
                    <button
                      onClick={handleShareMessenger}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0084FF] rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 active:scale-95">
                        <FaFacebookMessenger className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Messenger</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 active:scale-95">
                        <FiCopy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: How It Works & Scratch Cards */}
          <div className="md:col-span-5 lg:col-span-5 space-y-6">
            {/* How it works Section */}
            <div 
              className="p-5 md:p-6 border rounded-3xl shadow-xs transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-base md:text-lg font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>How it works?</h3>

              <div className="relative pl-7 space-y-5">
                {/* Vertical Line */}
                <div 
                  className="absolute left-3.5 top-2 bottom-2 w-0.5"
                  style={{ backgroundColor: 'var(--border)' }}
                ></div>

                {/* Step 1 */}
                <div className="relative">
                  <div 
                    className="absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                  >
                    1
                  </div>
                  <p className="text-xs md:text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>Invite your friends & get rewarded</p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div 
                    className="absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                  >
                    2
                  </div>
                  <p className="text-xs md:text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>They get ₹{referralData.refereeReward} wallet bonus instantly upon signup</p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div 
                    className="absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                  >
                    3
                  </div>
                  <p className="text-xs md:text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>You get ₹{referralData.referrerReward} once their first booking is completed</p>
                </div>
              </div>
            </div>

            {/* Scratch Cards Section */}
            <div 
              className="p-5 md:p-6 border rounded-3xl shadow-xs transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-base md:text-lg font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
                You are yet to earn any scratch cards
              </h3>
              <p className="text-xs md:text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Start referring to get surprises
              </p>

              <div 
                className="border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  No scratch cards available
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="flex items-center gap-3 text-xs md:text-sm pl-2">
              <button className="hover:underline text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">Terms and conditions</button>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <button className="hover:underline text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">FAQs</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rewards;
