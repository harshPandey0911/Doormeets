import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiClock, FiCheck, FiChevronRight } from 'react-icons/fi';
import { bookingService } from '../../../../services/bookingService';
import { themeColors } from '../../../../theme';
import LogoLoader from '../../../../components/common/LogoLoader';

const RescheduleBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Load booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getById(id);
        if (res.success) {
          setBooking(res.data);
        } else {
          toast.error(res.message || 'Failed to find booking');
          navigate(-1);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching booking details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id, navigate]);

  // Date generators
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const allSlots = [
    { value: '09:00', end: '10:00', display: '9:00 AM' },
    { value: '10:00', end: '11:00', display: '10:00 AM' },
    { value: '11:00', end: '12:00', display: '11:00 AM' },
    { value: '12:00', end: '13:00', display: '12:00 PM' },
    { value: '13:00', end: '14:00', display: '1:00 PM' },
    { value: '14:00', end: '15:00', display: '2:00 PM' },
    { value: '15:00', end: '16:00', display: '3:00 PM' },
    { value: '16:00', end: '17:00', display: '4:00 PM' },
    { value: '17:00', end: '18:00', display: '5:00 PM' },
    { value: '18:00', end: '19:00', display: '6:00 PM' },
    { value: '19:00', end: '20:00', display: '7:00 PM' },
    { value: '20:00', end: '21:00', display: '8:00 PM' },
  ];

  const getTimeSlots = () => {
    const now = new Date();
    const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();

    let slots = allSlots;

    if (isToday) {
      // Default 4-hour buffer for today's slots
      const currentHour = now.getHours();
      const minHour = currentHour + 4;
      slots = slots.filter(slot => {
        const slotHour = parseInt(slot.value.split(':')[0], 10);
        return slotHour >= minHour;
      });
    }

    // Filter out the currently booked slot if selectedDate matches booking.scheduledDate
    if (booking && selectedDate && new Date(booking.scheduledDate).toDateString() === selectedDate.toDateString()) {
      const currentStart = booking.timeSlot?.start || booking.scheduledTime;
      slots = slots.filter(slot => {
        return slot.value !== currentStart && slot.display !== currentStart;
      });
    }

    return slots;
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayName: days[date.getDay()],
      dayNum: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time slot');
      return;
    }

    const slotInfo = allSlots.find(s => s.value === selectedTime);
    if (!slotInfo) return;

    try {
      setSaving(true);
      const payload = {
        scheduledDate: selectedDate.toISOString(),
        scheduledTime: slotInfo.display,
        timeSlot: {
          start: slotInfo.value,
          end: slotInfo.end
        }
      };

      const res = await bookingService.reschedule(id, payload);
      if (res.success) {
        toast.success(res.message || 'Reschedule request submitted!');
        navigate(`/user/booking/${id}`);
      } else {
        toast.error(res.message || 'Failed to reschedule booking');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting reschedule request');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg">
        <LogoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg text-dark-text pb-12 font-['Inter']">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-card-bg/40 border-b border-border-color">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-card-bg rounded-xl flex items-center justify-center shadow-sm border border-border-color"
          >
            <FiArrowLeft className="w-5 h-5 text-dark-text" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-dark-text tracking-tight">Reschedule Booking</h1>
            <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-widest mt-0.5">
              ID: <span className="font-mono">{booking?.bookingNumber}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Current Slot Info Card */}
        {booking && (
          <div className="bg-card-bg rounded-2xl p-5 border border-border-color shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <FiClock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">Current Scheduled Time</p>
              <h3 className="text-sm font-bold text-dark-text mt-1">
                {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <p className="text-xs text-secondary-text mt-0.5">{booking.scheduledTime || booking.timeSlot?.start}</p>
            </div>
          </div>
        )}

        {/* Date Selection Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary-text flex items-center gap-2">
            <FiCalendar className="w-4 h-4" /> 1. Select Date
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {getDates().map((date, idx) => {
              const { dayName, dayNum, month } = formatDate(date);
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null); // Reset time when date changes
                  }}
                  className={`shrink-0 w-20 py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'border-[#B33A35] bg-[#B33A35]/5 text-[#B33A35] font-bold shadow-md shadow-[#B33A35]/5'
                      : 'border-border-color bg-card-bg text-dark-text hover:bg-light-bg'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">{dayName}</span>
                  <span className="text-xl font-black">{dayNum}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold">{month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary-text flex items-center gap-2">
            <FiClock className="w-4 h-4" /> 2. Select Time Slot
          </h3>
          {selectedDate ? (
            getTimeSlots().length === 0 ? (
              <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border-color bg-card-bg">
                <p className="text-sm font-bold text-secondary-text">No slots available for today</p>
                <p className="text-xs text-secondary-text/75 mt-1">Please select another date above</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {getTimeSlots().map((slot, idx) => {
                  const isSelected = selectedTime === slot.value;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(slot.value)}
                      className={`py-3.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'border-[#00A6A6] bg-[#00A6A6]/5 text-[#00A6A6] shadow-sm shadow-[#00A6A6]/5'
                          : 'border-border-color bg-card-bg text-dark-text hover:bg-light-bg'
                      }`}
                    >
                      {isSelected && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                      {slot.display}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border-color bg-card-bg">
              <p className="text-sm font-bold text-secondary-text">Please select a date first</p>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="pt-4">
          <button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || saving}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md transition-all active:scale-[0.98] ${
              selectedDate && selectedTime && !saving
                ? 'bg-[#B33A35] text-white hover:opacity-95'
                : 'bg-divider text-secondary-text cursor-not-allowed border border-border-color'
            }`}
          >
            {saving ? 'Requesting...' : 'Request Reschedule'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default RescheduleBooking;
