import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiCalendar, FiCheck, FiClock } from 'react-icons/fi';
import { userAuthService } from '../../../../services/authService';
import { generateDynamicSlots } from '../../../../utils/timeSlotUtils';

// Generate next 7 days excluding today
const getAvailableDates = () => {
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatDateValue = (date) => {
  return date.toISOString().split('T')[0]; // "2026-07-10"
};

const BookingTypeSelector = ({ wizardData, updateWizardData, onNext }) => {
  const [bookingType, setBookingType] = useState(wizardData.bookingType || 'INSTANT');
  const [selectedDate, setSelectedDate] = useState(wizardData.scheduledSlot?.date || null);
  const [selectedSlot, setSelectedSlot] = useState(wizardData.scheduledSlot?.timeSlot || '');
  const [slotsStartTime, setSlotsStartTime] = useState('09:00 AM');
  const [slotsEndTime, setSlotsEndTime] = useState('09:00 PM');
  const [slotIntervalGap, setSlotIntervalGap] = useState(120);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await userAuthService.getCheckoutData();
        if (res.success && res.settings) {
          setSlotsStartTime(res.settings.slotsStartTime || '09:00 AM');
          setSlotsEndTime(res.settings.slotsEndTime || '09:00 PM');
          setSlotIntervalGap(res.settings.slotIntervalGap || 120);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    fetchSettings();
  }, []);

  const dynamicSlots = generateDynamicSlots(slotsStartTime, slotsEndTime, slotIntervalGap);
  const availableDates = getAvailableDates();

  const handleContinue = () => {
    if (bookingType === 'SCHEDULED' && (!selectedDate || !selectedSlot)) {
      return; // button disabled handles this
    }
    updateWizardData({
      bookingType,
      scheduledSlot: bookingType === 'SCHEDULED'
        ? { date: selectedDate, timeSlot: selectedSlot }
        : { date: null, timeSlot: '' }
    });
    onNext();
  };

  const isScheduledValid = bookingType !== 'SCHEDULED' || (selectedDate && selectedSlot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 pb-32">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          How would you like to<br />
          <span className="text-orange-500">book your inspection?</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          A vendor will visit your property to assess and provide a detailed quote.
        </p>
      </div>

      <div className="px-5 space-y-4">
        {/* INSTANT Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setBookingType('INSTANT')}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
            bookingType === 'INSTANT'
              ? 'border-orange-500 bg-white shadow-xl shadow-orange-100'
              : 'border-gray-200 bg-white hover:border-orange-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              bookingType === 'INSTANT' ? 'bg-orange-500' : 'bg-orange-100'
            }`}>
              <FiZap className={`text-xl ${bookingType === 'INSTANT' ? 'text-white' : 'text-orange-500'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Instant Booking</h3>
                {bookingType === 'INSTANT' && (
                  <span className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                    <FiCheck className="text-base" /> Selected
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                A nearby vendor will be assigned within <strong>2–4 hours</strong>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Best for urgent needs', 'Fastest response', 'Available today'].map(tag => (
                  <span key={tag} className="text-xs bg-orange-50 text-orange-600 font-semibold px-2.5 py-1 rounded-full">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* SCHEDULED Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setBookingType('SCHEDULED')}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
            bookingType === 'SCHEDULED'
              ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-100'
              : 'border-gray-200 bg-white hover:border-indigo-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              bookingType === 'SCHEDULED' ? 'bg-indigo-600' : 'bg-indigo-50'
            }`}>
              <FiCalendar className={`text-xl ${bookingType === 'SCHEDULED' ? 'text-white' : 'text-indigo-500'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Schedule for Later</h3>
                {bookingType === 'SCHEDULED' && (
                  <span className="flex items-center gap-1 text-indigo-600 font-bold text-sm">
                    <FiCheck className="text-base" /> Selected
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Pick a date and time that works best for you
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Plan ahead', 'Next 7 days', 'Preferred time'].map(tag => (
                  <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Date + Time Slot Picker (shown when SCHEDULED selected) */}
        <AnimatePresence>
          {bookingType === 'SCHEDULED' && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border-2 border-indigo-200 p-5 space-y-5"
            >
              {/* Date Picker */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiCalendar className="text-indigo-500" /> Select Date
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((date, idx) => {
                    const dateVal = formatDateValue(date);
                    const isSelected = selectedDate === dateVal;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(dateVal)}
                        className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all text-xs font-semibold ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider opacity-70">
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-black mt-0.5">{date.getDate()}</span>
                        <span className="text-[10px] opacity-70">
                          {date.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Picker */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiClock className="text-indigo-500" /> Select Time Slot
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {dynamicSlots.map((slotObj) => {
                    const slotText = slotObj.displayRange;
                    const isSelected = selectedSlot === slotText;
                    return (
                      <button
                        key={slotText}
                        onClick={() => setSelectedSlot(slotText)}
                        className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                      >
                        {slotText}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected summary */}
              {selectedDate && selectedSlot && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiCheck className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Inspection Scheduled</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedSlot}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={!isScheduledValid}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
            isScheduledValid
              ? bookingType === 'INSTANT'
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {bookingType === 'INSTANT' ? (
            <><FiZap /> Continue with Instant Booking</>
          ) : (
            <><FiCalendar /> Confirm Schedule &amp; Continue</>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default BookingTypeSelector;
