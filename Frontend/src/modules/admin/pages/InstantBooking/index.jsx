import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getSettings, updateSettings } from '../../services/settingsService';

const InstantBookingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    isInstantBookingEnabled: true,
    instantBookingMarkup: 99,
    instantBookingWaitTime: 45,
    showArrivalTime: true,
    instantBookingWindowHours: 4,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          const s = res.settings;
          setForm({
            isInstantBookingEnabled: s.isInstantBookingEnabled ?? true,
            instantBookingMarkup: s.instantBookingMarkup ?? 99,
            instantBookingWaitTime: s.instantBookingWaitTime ?? 45,
            showArrivalTime: s.showArrivalTime ?? true,
            instantBookingWindowHours: s.instantBookingWindowHours ?? 4,
          });
        }
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        isInstantBookingEnabled: form.isInstantBookingEnabled,
        instantBookingMarkup: Number(form.instantBookingMarkup),
        instantBookingWaitTime: Number(form.instantBookingWaitTime),
        showArrivalTime: form.showArrivalTime,
        instantBookingWindowHours: Number(form.instantBookingWindowHours),
      };
      const res = await updateSettings(payload);
      if (res.success) {
        toast.success('Instant Booking settings saved!');
      } else {
        toast.error(res.message || 'Failed to save');
      }
    } catch (e) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background, #f8fafc)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl">⚡</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>
              Instant Booking
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted, #6b7280)' }}>
              Configure pricing, availability window, and delivery timelines for instant bookings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 max-w-3xl">

        {/* Enable / Disable Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border p-6 shadow-sm"
          style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--border, #e5e7eb)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold mb-0.5" style={{ color: 'var(--text-primary, #111827)' }}>
                Enable Instant Booking
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted, #6b7280)' }}>
                When ON, users see an "⚡ Instant" toggle at checkout for priority service
              </p>
            </div>
            {/* Toggle */}
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                name="isInstantBookingEnabled"
                checked={form.isInstantBookingEnabled}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer
                peer-checked:after:translate-x-6 peer-checked:after:border-white
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:border-gray-300 after:border after:rounded-full
                after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500" />
            </label>
          </div>

          {!form.isInstantBookingEnabled && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              ⚠️ Instant Booking is currently <strong>disabled</strong>. Users will only see Slot Booking at checkout.
            </div>
          )}
          {form.isInstantBookingEnabled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-700">
              ✅ Instant Booking is <strong>active</strong>. Users can select it at checkout.
            </div>
          )}
        </motion.div>

        {/* Pricing & Timing Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-6 shadow-sm"
          style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--border, #e5e7eb)' }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary, #111827)' }}>
            Pricing & Timing
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted, #6b7280)' }}>
            Set the extra charge and expected arrival time shown to users
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Extra Charge */}
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
                Extra Charge (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-yellow-500">₹</span>
                <input
                  type="number"
                  name="instantBookingMarkup"
                  value={form.instantBookingMarkup}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl outline-none focus:border-yellow-400 transition-all font-bold"
                  style={{ backgroundColor: 'var(--light-bg, #f9fafb)', borderColor: 'var(--border, #e5e7eb)', color: 'var(--text-primary, #111827)' }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted, #6b7280)' }}>
                Flat surcharge added on top of booking total for instant requests
              </p>
            </div>

            {/* Max Arrival Wait Time */}
            <div>
              {/* Header row with label + show/hide toggle */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted, #6b7280)' }}>
                  Max Arrival Time (Minutes)
                </label>
                {/* Toggle: show arrival time to user */}
                <label className="relative inline-flex items-center cursor-pointer gap-2">
                  <span className="text-[10px] font-semibold" style={{ color: form.showArrivalTime ? '#d97706' : '#9ca3af' }}>
                    {form.showArrivalTime ? 'Shown to user' : 'Hidden from user'}
                  </span>
                  <input
                    type="checkbox"
                    name="showArrivalTime"
                    checked={form.showArrivalTime}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer
                    peer-checked:after:translate-x-full peer-checked:after:border-white
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                    after:bg-white after:border-gray-300 after:border after:rounded-full
                    after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500" />
                </label>
              </div>

              <div className={`relative transition-opacity ${!form.showArrivalTime ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">⏱</span>
                <input
                  type="number"
                  name="instantBookingWaitTime"
                  value={form.instantBookingWaitTime}
                  onChange={handleChange}
                  min="5"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl outline-none focus:border-yellow-400 transition-all font-bold"
                  style={{ backgroundColor: 'var(--light-bg, #f9fafb)', borderColor: 'var(--border, #e5e7eb)', color: 'var(--text-primary, #111827)' }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted, #6b7280)' }}>
                {form.showArrivalTime
                  ? `User will see: "⚡ Professional arrives in ~${form.instantBookingWaitTime} mins"`
                  : 'Arrival time info will NOT be shown to the user at checkout'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Instant Window Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border p-6 shadow-sm"
          style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--border, #e5e7eb)' }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary, #111827)' }}>
            ⚡ Instant Window — Time Rule
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted, #6b7280)' }}>
            Bookings made for a slot <strong>within the next N hours</strong> from current time are treated as Instant Bookings automatically.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
                Instant Window (Hours)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 font-bold">H</span>
                <input
                  type="number"
                  name="instantBookingWindowHours"
                  value={form.instantBookingWindowHours}
                  onChange={handleChange}
                  min="1"
                  max="48"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl outline-none focus:border-yellow-400 transition-all font-bold"
                  style={{ backgroundColor: 'var(--light-bg, #f9fafb)', borderColor: 'var(--border, #e5e7eb)', color: 'var(--text-primary, #111827)' }}
                />
              </div>
            </div>

            {/* Live preview */}
            <div className="flex-1 min-w-[220px] bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Live Preview</p>
              <p className="text-sm text-yellow-800">
                A booking placed <strong>right now</strong> for a slot within the next{' '}
                <strong className="text-yellow-600">{form.instantBookingWindowHours} hour{form.instantBookingWindowHours !== 1 ? 's' : ''}</strong>{' '}
                will be flagged as ⚡ <strong>Instant</strong>.
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                e.g. Current time: 2:00 PM → slots up to{' '}
                <strong>
                  {(() => {
                    const d = new Date();
                    d.setHours(d.getHours() + Number(form.instantBookingWindowHours));
                    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                  })()}
                </strong>{' '}
                count as instant.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            💡 <strong>Tip:</strong> Set this to <strong>4</strong> if bookings needed within 4 hours should be instant. Increasing this value makes more future slots count as "instant".
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm shadow-lg shadow-yellow-400/30 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>⚡ Save Instant Booking Settings</>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default InstantBookingManagement;
