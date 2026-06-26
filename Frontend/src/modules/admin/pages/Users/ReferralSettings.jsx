import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiCheckCircle, 
  FiClock, 
  FiAward, 
  FiSave,
  FiLoader
} from 'react-icons/fi';
import { getSettings, updateSettings } from '../../services/settingsService';
import api from '../../../../services/api';

const ReferralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralsList, setReferralsList] = useState([]);
  const [stats, setStats] = useState({
    totalReferredUsers: 0,
    rewardedReferrals: 0,
    pendingReferrals: 0,
    totalReferrerPayoutsAmount: 0,
    totalRefereePayoutsAmount: 0,
    totalPayoutsAmount: 0
  });

  const [form, setForm] = useState({
    referralRewardReferrer: 100,
    referralRewardReferee: 100,
    maxWalletUsagePercentage: 30
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch settings
      const settingsData = await getSettings();
      if (settingsData && settingsData.settings) {
        setForm({
          referralRewardReferrer: settingsData.settings.referralRewardReferrer !== undefined ? settingsData.settings.referralRewardReferrer : 100,
          referralRewardReferee: settingsData.settings.referralRewardReferee !== undefined ? settingsData.settings.referralRewardReferee : 100,
          maxWalletUsagePercentage: settingsData.settings.maxWalletUsagePercentage !== undefined ? settingsData.settings.maxWalletUsagePercentage : 30
        });
      }

      // Fetch stats
      const statsRes = await api.get('/admin/users/referral/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch detailed referral list
      const listRes = await api.get('/admin/users/referrals/list');
      if (listRes.data.success) {
        setReferralsList(listRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load referral configuration:', error);
      toast.error('Failed to load referral configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.referralRewardReferrer < 0 || form.referralRewardReferee < 0) {
      toast.error('Reward amounts must be positive numbers');
      return;
    }
    if (form.maxWalletUsagePercentage < 0 || form.maxWalletUsagePercentage > 100) {
      toast.error('Wallet usage percentage must be between 0 and 100');
      return;
    }
    try {
      setSaving(true);
      const res = await updateSettings(form);
      if (res.success) {
        toast.success('Referral settings updated successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Update referral settings error:', error);
      toast.error('Failed to update referral settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Referred */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Referred Users</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{stats.totalReferredUsers}</h3>
          </div>
        </motion.div>

        {/* Rewarded Referrals */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Rewarded Referrals</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{stats.rewardedReferrals}</h3>
          </div>
        </motion.div>

        {/* Pending Referrals */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pending Completion</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{stats.pendingReferrals}</h3>
          </div>
        </motion.div>

        {/* Total Payouts */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <FiDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Payouts Amount</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">₹{stats.totalPayoutsAmount}</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiSettings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">Configure Referral Rewards</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Referrer Reward Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Referrer Reward (Amount in ₹)
                </label>
                <div className="relative rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <span className="text-sm font-semibold text-gray-500">₹</span>
                  </div>
                  <input
                    name="referralRewardReferrer"
                    type="number"
                    min="0"
                    required
                    value={form.referralRewardReferrer}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                    placeholder="100"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Amount credited to the referrer's wallet after referee completes their first booking.
                </p>
              </div>

              {/* Referee Reward Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Referee Reward (Amount in ₹)
                </label>
                <div className="relative rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <span className="text-sm font-semibold text-gray-500">₹</span>
                  </div>
                  <input
                    name="referralRewardReferee"
                    type="number"
                    min="0"
                    required
                    value={form.referralRewardReferee}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                    placeholder="100"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Amount credited instantly to the referee's wallet upon registration using a valid referral code.
                </p>
              </div>

              {/* Max Wallet Usage Percentage */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Max Wallet Usage limit (%)
                </label>
                <div className="relative rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <span className="text-sm font-bold">%</span>
                  </div>
                  <input
                    name="maxWalletUsagePercentage"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={form.maxWalletUsagePercentage}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                    placeholder="30"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Maximum percentage of booking final amount that can be paid using the user's wallet.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informative Stats Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiAward className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">Payout Breakdown</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-medium">Referrer Payouts</span>
              <span className="text-sm font-bold text-gray-800">₹{stats.totalReferrerPayoutsAmount}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-medium">Referee Payouts</span>
              <span className="text-sm font-bold text-gray-800">₹{stats.totalRefereePayoutsAmount}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-xl px-4 mt-4">
              <span className="text-sm text-gray-600 font-semibold">Total Distributed</span>
              <span className="text-base font-extrabold text-blue-600">₹{stats.totalPayoutsAmount}</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-700 leading-relaxed">
            <p className="font-semibold mb-1">Referral Flow Info:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Referee enters the code during signup and instantly receives the Referee Reward.</li>
              <li>When the referee completes their first booking, the Referrer gets the Referrer Reward.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Detailed Referral History Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <FiUsers className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Referrals History</h2>
        </div>

        {referralsList.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No referral records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Referred User (Friend)</th>
                  <th className="py-3 px-4">Referred By (Referrer)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {referralsList.map((ref) => (
                  <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{ref.name}</div>
                      <div className="text-xs text-gray-500">{ref.phone} {ref.email ? `• ${ref.email}` : ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {ref.referredBy ? (
                        <>
                          <div className="font-semibold text-gray-900">{ref.referredBy.name}</div>
                          <div className="text-xs text-gray-500">{ref.referredBy.phone}</div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ref.referralStatus === 'rewarded' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {ref.referralStatus === 'rewarded' ? 'Rewarded' : 'Pending First Booking'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralSettings;
