import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiSettings, FiSave, FiLoader } from 'react-icons/fi';
import { getSettings, updateSettings } from '../../services/settingsService';

const ShopReferralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shopReferralRewardShopOwner: 100,
    shopReferralRewardVendor: 50,
    shopReferralQrCodeUrl: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const settingsData = await getSettings();
      if (settingsData && settingsData.settings) {
        setForm({
          shopReferralRewardShopOwner: settingsData.settings.shopReferralRewardShopOwner !== undefined ? settingsData.settings.shopReferralRewardShopOwner : 100,
          shopReferralRewardVendor: settingsData.settings.shopReferralRewardVendor !== undefined ? settingsData.settings.shopReferralRewardVendor : 50,
          shopReferralQrCodeUrl: settingsData.settings.shopReferralQrCodeUrl !== undefined ? settingsData.settings.shopReferralQrCodeUrl : ''
        });
      }
    } catch (error) {
      console.error('Failed to load shop referral configuration:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'shopReferralQrCodeUrl' ? value : (value === '' ? '' : Number(value))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.shopReferralRewardShopOwner < 0 || form.shopReferralRewardVendor < 0) {
      toast.error('Reward amounts must be positive numbers');
      return;
    }
    try {
      setSaving(true);
      const res = await updateSettings(form);
      if (res.success) {
        toast.success('Shop referral settings updated successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Update settings error:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm max-w-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <FiSettings className="w-4 h-4 text-gray-600" />
        <h2 className="text-sm font-bold text-gray-800">Configure Shop Referral Rewards</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Shop Owner Reward */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700">
              Shop Owner Reward (₹)
            </label>
            <div className="relative rounded-lg border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-500">
                <span className="font-semibold">₹</span>
              </div>
              <input
                name="shopReferralRewardShopOwner"
                type="number"
                min="0"
                required
                value={form.shopReferralRewardShopOwner}
                onChange={handleChange}
                className="block w-full pl-7 pr-3 py-2 bg-transparent border-0 text-xs text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                placeholder="100"
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Amount credited to referring Shop Owner's wallet after referred vendor gets approved.
            </p>
          </div>

          {/* Vendor Reward */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700">
              Onboarded Vendor Reward (₹)
            </label>
            <div className="relative rounded-lg border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-500">
                <span className="font-semibold">₹</span>
              </div>
              <input
                name="shopReferralRewardVendor"
                type="number"
                min="0"
                required
                value={form.shopReferralRewardVendor}
                onChange={handleChange}
                className="block w-full pl-7 pr-3 py-2 bg-transparent border-0 text-xs text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                placeholder="50"
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Welcome balance credited to vendor's wallet upon signup and approval.
            </p>
          </div>
        </div>

        {/* Global QR Link */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-gray-700">
            Global Referral QR Destination Link (e.g. Website or App Link)
          </label>
          <input
            name="shopReferralQrCodeUrl"
            type="text"
            value={form.shopReferralQrCodeUrl}
            onChange={handleChange}
            className="block w-full px-3 py-2 bg-transparent border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="e.g. https://doormeets.com/download"
          />
          <p className="text-[10px] text-gray-400">
            Enter the URL link to generate a QR Code. This QR code will be displayed on the Shop Owner dashboard.
          </p>

          {form.shopReferralQrCodeUrl && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center space-x-4 max-w-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(form.shopReferralQrCodeUrl)}`}
                alt="Generated QR Code"
                className="w-20 h-20 object-contain border border-gray-200 p-1 bg-white rounded-lg"
              />
              <div>
                <p className="font-bold text-gray-800 text-[10px]">Generated QR Code Preview</p>
                <p className="text-[9px] text-gray-400 mt-0.5 truncate max-w-[200px]">{form.shopReferralQrCodeUrl}</p>
                <span className="mt-1 inline-block bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">Ready & Active</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <>
                <FiLoader className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-3.5 h-3.5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopReferralSettings;
