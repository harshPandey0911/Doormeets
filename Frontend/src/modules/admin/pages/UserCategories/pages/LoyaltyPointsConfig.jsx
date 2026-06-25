import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiSave, FiInfo, FiTrendingUp, FiDollarSign, FiSlash, FiAward } from 'react-icons/fi';
import { getSettings, updateSettings } from '../../../services/settingsService';
import { toast } from 'react-hot-toast';

const LoyaltyPointsConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    loyaltyPointsEarningRate: 1,
    loyaltyPointsRedemptionRate: 1,
    loyaltyPointsCancellationPenalty: 0,
    loyaltyPointsFixedCompletionAward: 0,
  });

  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        setLoading(true);
        const res = await getSettings();
        if (res.success && res.settings) {
          setSettings({
            loyaltyPointsEarningRate: res.settings.loyaltyPointsEarningRate ?? 1,
            loyaltyPointsRedemptionRate: res.settings.loyaltyPointsRedemptionRate ?? 1,
            loyaltyPointsCancellationPenalty: res.settings.loyaltyPointsCancellationPenalty ?? 0,
            loyaltyPointsFixedCompletionAward: res.settings.loyaltyPointsFixedCompletionAward ?? 0,
          });
        }
      } catch (err) {
        console.error('Error fetching loyalty settings:', err);
        toast.error('Failed to load loyalty settings');
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltySettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Math.max(0, Number(value)),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Loyalty Points rules updated successfully!');
    } catch (err) {
      console.error('Error updating loyalty settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4">
          <FiGift className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              System Configuration
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Loyalty Points Management</h1>
            <p className="text-white/80 max-w-2xl text-sm leading-relaxed">
              Define how customers earn, redeem, and lose loyalty points when interacting with bookings on the platform.
            </p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
            <FiGift className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Rule 1: Earning Rate */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Earning Points</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Points awarded to the customer per ₹100 spent on completed online bookings.
                </p>
              </div>
              
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                  Points per ₹100 online spent
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="loyaltyPointsEarningRate"
                    value={settings.loyaltyPointsEarningRate}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-extrabold text-gray-800 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-sm">pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                e.g., If set to <strong>2</strong>, a user will earn <strong>10 points</strong> on a ₹500 booking.
              </p>
            </div>
          </div>

          {/* Rule 2: Fixed Completion Award */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                <FiAward className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Flat Reward Points</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Fixed point amount awarded to the customer on every completed online booking.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                  Flat points per booking
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="loyaltyPointsFixedCompletionAward"
                    value={settings.loyaltyPointsFixedCompletionAward}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-extrabold text-gray-800 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-sm">pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                e.g., If set to <strong>5</strong>, the user gets <strong>5 points flat</strong> on completing any booking.
              </p>
            </div>
          </div>

          {/* Rule 3: Redemption Rate */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <FiDollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Redemption Value</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Rupees discount value associated with redeeming one loyalty point.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                  Discount Value (₹ per point)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="loyaltyPointsRedemptionRate"
                    value={settings.loyaltyPointsRedemptionRate}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-extrabold text-gray-800 transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-sm">₹</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                e.g., If set to <strong>1.50</strong>, redeeming <strong>10 points</strong> gives a <strong>₹15 discount</strong>.
              </p>
            </div>
          </div>

          {/* Rule 4: Cancellation Penalty */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <FiSlash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Cancellation Penalty</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Points deducted from the user's balance when they cancel an active booking.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                  Points penalty on cancel
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="loyaltyPointsCancellationPenalty"
                    value={settings.loyaltyPointsCancellationPenalty}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-extrabold text-gray-800 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-sm">pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                Set to <strong>0</strong> to disable cancellation point penalties entirely.
              </p>
            </div>
          </div>

        </div>

        {/* Form Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl flex items-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSave className="w-5 h-5" />
            )}
            Save Configuration
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default LoyaltyPointsConfig;
