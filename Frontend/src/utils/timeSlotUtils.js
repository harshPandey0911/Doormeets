/**
 * Parses a time string like "09:00 AM" into minutes from midnight.
 */
export const parseTimeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;

  let [, hours, minutes, modifier] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  return hours * 60 + minutes;
};

/**
 * Formats minutes from midnight into a 24-hour string (HH:MM).
 */
export const formatMinutesTo24Hour = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Formats minutes from midnight into a 12-hour AM/PM string.
 */
export const formatMinutesTo12Hour = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Generates an array of time slots based on start time, end time, and interval.
 * @param {string} startTimeStr - e.g., "09:00 AM"
 * @param {string} endTimeStr - e.g., "09:00 PM"
 * @param {number} intervalMinutes - e.g., 30 or 60
 * @returns {Array} Array of slot objects { value: 'HH:MM', end: 'HH:MM', display: 'H:MM AM' }
 */
export const generateDynamicSlots = (startTimeStr = '09:00 AM', endTimeStr = '09:00 PM', intervalMinutes = 60) => {
  const startMinutes = parseTimeStringToMinutes(startTimeStr);
  const endMinutes = parseTimeStringToMinutes(endTimeStr);
  const gap = parseInt(intervalMinutes, 10) || 60;

  const slots = [];
  
  for (let current = startMinutes; current <= endMinutes; current += gap) {
    const next = current + gap;

    slots.push({
      value: formatMinutesTo24Hour(current),
      end: formatMinutesTo24Hour(next),
      display: formatMinutesTo12Hour(current),
      // Optionally provide a full range display
      displayRange: `${formatMinutesTo12Hour(current)} - ${formatMinutesTo12Hour(next)}`
    });
  }

  // Fallback to defaults if something goes wrong
  if (slots.length === 0) {
    return [
      { value: '09:00', end: '10:00', display: '9:00 AM', displayRange: '9:00 AM - 10:00 AM' }
    ];
  }

  return slots;
};
