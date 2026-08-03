/**
 * Helper to pick a single clean phone number from a potentially comma-separated string of support numbers.
 * If multiple numbers exist (e.g. "7879363299,6232968241"), picks one randomly (or sequentially)
 * so dialing links like href="tel:..." open only one valid phone number.
 */
export const getCleanSupportPhone = (rawPhoneStr, fallback = '+919999999999') => {
  if (!rawPhoneStr || typeof rawPhoneStr !== 'string') {
    return fallback;
  }

  // Split comma-separated phone numbers
  const phones = rawPhoneStr
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  if (phones.length === 0) {
    return fallback;
  }

  // Pick a random phone number from the list
  const chosen = phones[Math.floor(Math.random() * phones.length)];
  // Clean all non-digit and non-plus characters
  const clean = chosen.replace(/[^\d+]/g, '');

  return clean || fallback;
};

/**
 * Clean any single phone string to contain only digits & '+'
 */
export const cleanPhone = (phoneStr, fallback = '') => {
  if (!phoneStr) return fallback;
  return getCleanSupportPhone(String(phoneStr), fallback);
};
