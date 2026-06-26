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
      className="min-h-screen bg-white"
      style={{ background: themeColors.backgroundGradient }}
    >
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <FiGift className="w-5 h-5" style={{ color: '#00A6A6' }} />
            <h1 className="text-lg font-bold text-gray-900">Refer & Earn</h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/user/notifications')}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiBell className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <main>
        {/* Main Referral Section */}
        <div className="bg-gray-50 relative overflow-hidden" style={{ background: 'transparent' }}>
          {/* Dotted Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_black_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
          </div>

          <div className="relative px-4 py-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-black mb-2">
                  Refer and get FREE services
                </h2>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Invite your friends to try our services. They get instant ₹{referralData.refereeReward} wallet balance on signup. You get ₹{referralData.referrerReward} once they complete their first booking.
                </p>
              </div>
              {/* Gift Box Illustration */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center transform rotate-12 shadow-lg">
                  <span className="text-3xl">🎁</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-orange-300 rounded-full"></div>
              </div>
            </div>

            {/* Referral Code Display Box */}
            <div className="bg-white/90 backdrop-blur-sm border border-teal-100 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Your Referral Code</p>
                <p className="text-xl font-bold text-gray-900 tracking-wide font-mono">{referralData.referralCode || 'DM-XXXXXX'}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-[#00A6A6] text-xs font-semibold rounded-xl transition-all duration-200"
              >
                <FiCopy className="w-4 h-4" />
                Copy
              </button>
            </div>

            {/* Stats Box */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-3.5 shadow-sm text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Total Referrals</p>
                <p className="text-2xl font-extrabold text-[#00A6A6]">{referralData.successfulReferrals}</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-3.5 shadow-sm text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Total Earnings</p>
                <p className="text-2xl font-extrabold text-teal-600">₹{referralData.totalEarnings}</p>
              </div>
            </div>

            {/* Refer Via Section */}
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Refer via</p>
              <div className="flex gap-3">
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                    <FaWhatsapp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-700">Whatsapp</span>
                </button>

                {/* Messenger */}
                <button
                  onClick={handleShareMessenger}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 bg-[#0084FF] rounded-full flex items-center justify-center">
                    <FaFacebookMessenger className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-700">Messenger</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00A6A6' }}>
                    <FiCopy className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-700">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How it works Section */}
        <div className="px-4 py-4 bg-white rounded-t-3xl shadow-sm border-t border-gray-100">
          <h3 className="text-base font-bold text-black mb-3">How it works?</h3>

          <div className="relative pl-7">
            {/* Vertical Line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Step 1 */}
            <div className="relative mb-4">
              <div className="absolute -left-7 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                1
              </div>
              <p className="text-xs text-gray-700">Invite your friends & get rewarded</p>
            </div>

            {/* Step 2 */}
            <div className="relative mb-4">
              <div className="absolute -left-7 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                2
              </div>
              <p className="text-xs text-gray-700">They get ₹{referralData.refereeReward} wallet bonus instantly upon signup</p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-7 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                3
              </div>
              <p className="text-xs text-gray-700">You get ₹{referralData.referrerReward} once their first booking is completed</p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2 text-[#00A6A6] text-xs">
            <span className="text-[#00A6A6]">•</span>
            <button className="hover:underline">Terms and conditions</button>
            <span className="text-[#00A6A6]">•</span>
            <button className="hover:underline">FAQs</button>
          </div>
        </div>

        {/* Scratch Cards Section - New Addition */}
        <div className="px-4 py-4 bg-white border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-1.5">
            You are yet to earn any scratch cards
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Start referring to get surprises
          </p>

          {/* Dotted Line Separator */}
          <div className="border-t border-dotted border-gray-300 my-3"></div>

          {/* Referral Offer */}
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎁</span>
            </div>
            <p className="text-sm text-gray-800 font-medium">
              Earn ₹{referralData.referrerReward} on every successful referral
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rewards;
