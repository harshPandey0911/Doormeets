import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { themeColors } from '../../../../../theme';

const TimeSlotModal = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onSave,
  getDates,
  getTimeSlots,
  formatDate,
  isDateSelected,
  isTimeSelected,
  instantBookingWindowHours = 4
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      setIsClosing(false);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div
          className={`rounded-3xl w-full max-w-xl shadow-2xl transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
          style={{
            backgroundColor: 'var(--card-bg)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 border-b px-4 py-3 z-10 shrink-0" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Select Time Slot</h1>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div
            className="px-4 py-4 overflow-y-auto flex-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            <h2 className="text-xl font-normal mb-1" style={{ color: 'var(--text-primary)' }}>When should the professional arrive?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              For today, slots available {instantBookingWindowHours}+ hours from now
            </p>

            {/* Date Selection */}
            <div className="flex flex-wrap gap-2 pb-2 mb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {getDates().map((date, index) => {
                const { day, date: dateNum } = formatDate(date);
                const isSelected = isDateSelected(date);
                return (
                  <button
                    key={index}
                    onClick={() => onDateSelect(date)}
                    className="shrink-0 px-4 py-1.5 rounded-lg border-2 transition-all"
                    style={isSelected ? {
                      backgroundColor: `${themeColors.brand.teal}1A`,
                      borderColor: themeColors.button,
                      color: themeColors.button
                    } : {
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-normal mb-1">{day}</span>
                      <span className="text-base font-normal">{dateNum}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment Information */}
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-2 h-2 rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Online payment only for selected date</p>
            </div>

            {/* Time Selection */}
            <div className="mb-4">
              <h3 className="text-base font-normal mb-3" style={{ color: 'var(--text-primary)' }}>Select start time of service</h3>
              {getTimeSlots().length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                  <p className="font-normal mb-1" style={{ color: 'var(--text-secondary)' }}>No time slots available</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Please select a different date</p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-3 gap-2 pb-2"
                  style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                  }}
                >
                  {getTimeSlots().map((slot, index) => {
                    const isSelected = isTimeSelected(slot.value);
                    return (
                      <button
                        key={index}
                        onClick={() => onTimeSelect(slot.value)}
                        className="px-3 py-2.5 rounded-lg border-2 text-sm font-normal transition-all"
                        style={isSelected ? {
                          backgroundColor: `${themeColors.brand.teal}1A`,
                          borderColor: themeColors.button,
                          color: themeColors.button
                        } : {
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {slot.display}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proceed Button */}
            <button
              onClick={() => onSave(selectedDate, selectedTime)}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-3.5 rounded-lg text-base font-normal transition-colors mb-4"
              style={selectedDate && selectedTime ? {
                backgroundColor: themeColors.button,
                color: 'white'
              } : {
                backgroundColor: 'var(--border)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeSlotModal;

