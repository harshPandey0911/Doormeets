import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiSettings, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { getSettings, updateSettings } from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const InstantBookingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [config, setConfig] = useState({
    isInstantBookingEnabled: true,
    instantBookingMarkup: 99,
    instantBookingWaitTime: 45,
    instantBookingWindowHours: 4,
    showArrivalTime: true
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          setConfig({
            isInstantBookingEnabled: res.settings.isInstantBookingEnabled !== undefined ? res.settings.isInstantBookingEnabled : true,
            instantBookingMarkup: res.settings.instantBookingMarkup !== undefined ? res.settings.instantBookingMarkup : 99,
            instantBookingWaitTime: res.settings.instantBookingWaitTime !== undefined ? res.settings.instantBookingWaitTime : 45,
            instantBookingWindowHours: res.settings.instantBookingWindowHours !== undefined ? res.settings.instantBookingWindowHours : 4,
            showArrivalTime: res.settings.showArrivalTime !== undefined ? res.settings.showArrivalTime : true
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (field, value) => {
    setSaving(prev => ({ ...prev, [field]: true }));
    try {
      const payload = { [field]: value };
      const res = await updateSettings(payload);
      if (res.success) {
        toast.success('Setting updated successfully');
      } else {
        toast.error('Failed to update setting');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error updating setting');
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleToggle = async (field) => {
    const newVal = !config[field];
    setConfig(prev => ({ ...prev, [field]: newVal }));
    await handleSave(field, newVal);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <FiSettings className="w-6 h-6 text-yellow-600 animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Instant Booking Settings</h2>
          <p className="text-sm text-gray-500">Configure priority booking options and customer ETA visibility</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Toggle Mode */}
        <div className="flex items-center justify-between p-4 bg-yellow-50/30 rounded-xl border border-yellow-100">
          <div>
            <p className="font-semibold text-gray-800 flex items-center gap-1">⚡ Instant Booking Mode</p>
            <p className="text-xs text-gray-500 mt-1">Enable customers to book priority service instantly from checkout</p>
          </div>
          <button
            onClick={() => handleToggle('isInstantBookingEnabled')}
            disabled={saving['isInstantBookingEnabled']}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 ${config.isInstantBookingEnabled ? 'bg-yellow-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.isInstantBookingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {config.isInstantBookingEnabled && (
          <div className="space-y-5 pt-2">
            
            {/* Markup Fee */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50 space-y-3">
              <div>
                <p className="font-semibold text-gray-800">Instant Booking Markup Fee (₹)</p>
                <p className="text-xs text-gray-500 mt-1">Extra priority fee added to the customer's total at checkout</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.instantBookingMarkup}
                  onChange={(e) => setConfig(prev => ({ ...prev, instantBookingMarkup: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-yellow-500 bg-white"
                  min="0"
                />
                <button
                  onClick={() => handleSave('instantBookingMarkup', config.instantBookingMarkup)}
                  disabled={saving['instantBookingMarkup']}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  {saving['instantBookingMarkup'] ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Wait Time with User Visibility Toggle */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50 space-y-4">
              <div>
                <p className="font-semibold text-gray-800">Estimated Arrival Wait Time (Minutes)</p>
                <p className="text-xs text-gray-500 mt-1">Average wait time displayed to the user (e.g. 45 mins)</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.instantBookingWaitTime}
                  onChange={(e) => setConfig(prev => ({ ...prev, instantBookingWaitTime: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-yellow-500 bg-white"
                  min="5"
                />
                <button
                  onClick={() => handleSave('instantBookingWaitTime', config.instantBookingWaitTime)}
                  disabled={saving['instantBookingWaitTime']}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {saving['instantBookingWaitTime'] ? 'Saving...' : 'Save'}
                </button>
              </div>

              {/* Show/Hide Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Show Arrival Time to Customer</p>
                  <p className="text-[10px] text-gray-400">Display wait time estimation on user checkout screen</p>
                </div>
                <button
                  onClick={() => handleToggle('showArrivalTime')}
                  disabled={saving['showArrivalTime']}
                  className={`relative w-10 h-6 rounded-full transition-all duration-300 ${config.showArrivalTime ? 'bg-yellow-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.showArrivalTime ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Instant Window hours */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50 space-y-3">
              <div>
                <p className="font-semibold text-gray-800">Instant Window Buffer (Hours)</p>
                <p className="text-xs text-gray-500 mt-1">Slots within this hour buffer from current time count as instant</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.instantBookingWindowHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, instantBookingWindowHours: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-yellow-500 bg-white"
                  min="1"
                />
                <button
                  onClick={() => handleSave('instantBookingWindowHours', config.instantBookingWindowHours)}
                  disabled={saving['instantBookingWindowHours']}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {saving['instantBookingWindowHours'] ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InstantBookingSettings;
