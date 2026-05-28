const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { calculateGST } = require('../utils/gstCalculator');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');
const invoiceConfig = require('../config/invoiceConfig');

/**
 * Generate Vendor Invoice ("vendor_service")
 * GST: 5% (split equally between CGST and SGST)
 */
const generateVendorInvoice = async (bookingId, vendorId, customerId, baseAmount, transactionGroupId) => {
  try {
    // 1. Idempotency Check / Duplicate Protection
    const existingInvoice = await Invoice.findOne({ bookingId, type: 'vendor_service' });
    if (existingInvoice) {
      console.log(`[INVOICE SKIP] Vendor service invoice already exists for booking ${bookingId}`);
      return existingInvoice;
    }

    const invoiceNumber = generateInvoiceNumber('VEN');
    const gstData = calculateGST(baseAmount, invoiceConfig.vendorGSTPercent);

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'vendor_service',
      bookingId,
      vendorId,
      customerId,
      issuedBy: vendorId, // Issued by Vendor to Customer
      issuedTo: customerId,
      baseAmount: gstData.baseAmount,
      gstPercent: gstData.gstPercent,
      cgst: gstData.cgst,
      sgst: gstData.sgst,
      igst: gstData.igst,
      totalGST: gstData.totalGST,
      totalAmount: gstData.totalAmount,
      paymentStatus: 'paid',
      invoiceStatus: invoiceConfig.invoiceStatuses.PAID,
      generatedByRole: invoiceConfig.generatedByRole,
      transactionGroupId,
      isArchived: false
    });

    console.log(`[INVOICE GENERATED]
   Booking: ${bookingId}
   Vendor: ${vendorId}
   Invoice Number: ${invoiceNumber}
   Type: vendor_service
   Amount: ₹${gstData.totalAmount}`);

    // TODO:
    // PDF invoice generation will be integrated here.

    return invoice;
  } catch (error) {
    console.error(`[INVOICE ERROR] Failed to generate vendor invoice for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Generate Platform Invoice ("platform_fee")
 * GST: 18% (split equally between CGST and SGST)
 */
const generatePlatformInvoice = async (bookingId, vendorId, customerId, baseAmount, transactionGroupId) => {
  try {
    // 1. Idempotency Check / Duplicate Protection
    const existingInvoice = await Invoice.findOne({ bookingId, type: 'platform_fee' });
    if (existingInvoice) {
      console.log(`[INVOICE SKIP] Platform fee invoice already exists for booking ${bookingId}`);
      return existingInvoice;
    }

    const invoiceNumber = generateInvoiceNumber('PLT');
    const gstData = calculateGST(baseAmount, invoiceConfig.platformGSTPercent);

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'platform_fee',
      bookingId,
      vendorId,
      customerId,
      issuedBy: null, // Issued by Platform (Company) to Vendor
      issuedTo: vendorId,
      baseAmount: gstData.baseAmount,
      gstPercent: gstData.gstPercent,
      cgst: gstData.cgst,
      sgst: gstData.sgst,
      igst: gstData.igst,
      totalGST: gstData.totalGST,
      totalAmount: gstData.totalAmount,
      paymentStatus: 'paid',
      invoiceStatus: invoiceConfig.invoiceStatuses.PAID,
      generatedByRole: invoiceConfig.generatedByRole,
      transactionGroupId,
      isArchived: false
    });

    console.log(`[INVOICE GENERATED]
   Booking: ${bookingId}
   Vendor: ${vendorId}
   Invoice Number: ${invoiceNumber}
   Type: platform_fee
   Amount: ₹${gstData.totalAmount}`);

    // TODO:
    // PDF invoice generation will be integrated here.

    return invoice;
  } catch (error) {
    console.error(`[INVOICE ERROR] Failed to generate platform invoice for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Generate Subscription Invoice ("subscription")
 * GST: 18%
 */
const generateSubscriptionInvoice = async (vendorId, baseAmount) => {
  try {
    const invoiceNumber = generateInvoiceNumber('SUB');
    const gstData = calculateGST(baseAmount, invoiceConfig.subscriptionGSTPercent);

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'subscription',
      vendorId,
      issuedBy: null, // Issued by Company to Vendor
      issuedTo: vendorId,
      baseAmount: gstData.baseAmount,
      gstPercent: gstData.gstPercent,
      cgst: gstData.cgst,
      sgst: gstData.sgst,
      igst: gstData.igst,
      totalGST: gstData.totalGST,
      totalAmount: gstData.totalAmount,
      paymentStatus: 'paid',
      invoiceStatus: invoiceConfig.invoiceStatuses.PAID,
      generatedByRole: invoiceConfig.generatedByRole,
      isArchived: false
    });

    console.log(`[INVOICE GENERATED]
   Vendor: ${vendorId}
   Invoice Number: ${invoiceNumber}
   Type: subscription
   Amount: ₹${gstData.totalAmount}`);

    // TODO:
    // PDF invoice generation will be integrated here.

    return invoice;
  } catch (error) {
    console.error(`[INVOICE ERROR] Failed to generate subscription invoice for vendor ${vendorId}:`, error);
    throw error;
  }
};

/**
 * Generate Credit Recharge Receipt ("credit_recharge")
 * GST: 0% (No GST)
 */
const generateCreditRechargeReceipt = async (vendorId, baseAmount) => {
  try {
    const invoiceNumber = generateInvoiceNumber('CRD');
    const gstData = calculateGST(baseAmount, 0); // No GST

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'credit_recharge',
      vendorId,
      issuedBy: null,
      issuedTo: vendorId,
      baseAmount: gstData.baseAmount,
      gstPercent: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGST: 0,
      totalAmount: gstData.totalAmount,
      paymentStatus: 'paid',
      invoiceStatus: invoiceConfig.invoiceStatuses.PAID,
      generatedByRole: invoiceConfig.generatedByRole,
      isArchived: false
    });

    console.log(`[RECEIPT GENERATED]
   Vendor: ${vendorId}
   Receipt Number: ${invoiceNumber}
   Type: credit_recharge
   Amount: ₹${gstData.totalAmount}`);

    // TODO:
    // PDF invoice generation will be integrated here.

    return invoice;
  } catch (error) {
    console.error(`[INVOICE ERROR] Failed to generate credit recharge receipt for vendor ${vendorId}:`, error);
    throw error;
  }
};

// TODO:
// Recovery job for bookings where
// payment succeeded but invoices failed.

module.exports = {
  generateVendorInvoice,
  generatePlatformInvoice,
  generateSubscriptionInvoice,
  generateCreditRechargeReceipt
};
