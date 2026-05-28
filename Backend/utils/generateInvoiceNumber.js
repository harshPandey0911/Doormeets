/**
 * Unique Prefix-Based Invoice Number Generator
 * Example format: VEN-2026-104928
 */
const generateInvoiceNumber = (prefix) => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `${prefix}-${year}-${randomSuffix}`;
};

module.exports = generateInvoiceNumber;
