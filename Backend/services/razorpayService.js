const Razorpay = require('razorpay');

// Initialize Razorpay with validation
let razorpay;
let isTestMode = true;

try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('⚠️  Razorpay credentials missing in .env file');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Check if we are in test or live mode
    isTestMode = process.env.RAZORPAY_KEY_ID.startsWith('rzp_test');
    console.log(`✅ Razorpay initialized in ${isTestMode ? 'TEST' : 'LIVE'} mode`);
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error.message);
}

/**
 * Create Razorpay order
 */
const createOrder = async (amount, currency = 'INR', receipt = null, notes = {}) => {
  try {
    if (!razorpay) {
      return {
        success: false,
        error: 'Razorpay not initialized. Please check credentials in .env file.'
      };
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes
    };

    console.log('Creating Razorpay order with options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created successfully:', order.id);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    };
  } catch (error) {
    console.error('❌ Razorpay create order error:', {
      message: error.message,
      description: error.description,
      code: error.code,
      statusCode: error.statusCode,
      error: error.error
    });

    return {
      success: false,
      error: error.description || error.message || 'Failed to create Razorpay order'
    };
  }
};

/**
 * Verify payment signature
 */
const verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generated_signature === razorpay_signature;
};

/**
 * Get payment details
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('Razorpay get payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Refund payment
 */
const refundPayment = async (paymentId, amount = null, notes = {}) => {
  try {
    const refundOptions = {
      payment_id: paymentId,
      notes
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return {
      success: true,
      refund
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create Razorpay QR Code
 * Tries the modern standalone QR API first, then falls back to Payment Link if needed.
 */
const createQRCode = async (amount, bookingNumber, notes = {}) => {
  try {
    if (!razorpay) {
      return { success: false, error: 'Razorpay not initialized' };
    }

    const axios = require('axios');
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const payload = {
      type: 'upi_qr',
      name: 'Service Payment',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: Math.round(amount * 100), // Convert to paise
      description: `Order Payment for ${bookingNumber}`,
      notes
    };

    console.log('[QR Service] Attempting QR creation for Booking:', bookingNumber);

    // Primary: Razorpay SDK QR API
    try {
      const qrCode = await razorpay.qrCode.create(payload);

      console.log('✅ QR Code created via Razorpay SDK API');
      return {
        success: true,
        qrCodeId: qrCode.id,
        imageUrl: qrCode.image_url,
        qrStatus: qrCode.status
      };
    } catch (e1) {
      console.warn('⚠️ SDK QR API failed, trying raw REST fallback...', e1.description || e1.message || e1);

      // Fallback 1: Manual API call to /v1/payments/qr_codes (as suggested by user)
      try {
        const response = await axios.post('https://api.razorpay.com/v1/payments/qr_codes', payload, {
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
        });

        const qrCode = response.data;
        console.log('✅ QR Code created via Manual Payments API');
        return {
          success: true,
          qrCodeId: qrCode.id,
          imageUrl: qrCode.image_url,
          qrStatus: qrCode.status
        };
      } catch (e2) {
        console.warn('⚠️ Manual Payments API failed, trying /v1/qr_codes...', e2.response?.data || e2.message);

        // Fallback 2: Manual API call to /v1/qr_codes
        try {
          const response = await axios.post('https://api.razorpay.com/v1/qr_codes', payload, {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
          });

          const qrCode = response.data;
          console.log('✅ QR Code created via Manual QR API');
          return {
            success: true,
            qrCodeId: qrCode.id,
            imageUrl: qrCode.image_url,
            qrStatus: qrCode.status
          };
        } catch (e3) {
          console.warn('⚠️ All Razorpay QR APIs failed, trying manual UPI Intent QR...', e3.response?.data || e3.message);

          // Fallback 3: Manual UPI Intent QR (Scan -> UPI App -> Auto-filled amount)
          try {
            const QRCode = require('qrcode');
            const upiId = process.env.MERCHANT_UPI_ID || "merchant@razorpay";
            const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Homster Service")}&am=${amount}&cu=INR&tn=${bookingNumber}`;
            const qrImage = await QRCode.toDataURL(upiLink);

            console.log('✅ Manual UPI QR generated successfully');
            return {
              success: true,
              qrImage, // Base64 data URL
              imageUrl: qrImage, // For backwards compatibility
              upiLink,
              isManualUpi: true,
              qrCodeId: `manual_${bookingNumber}_${Date.now()}`
            };
          } catch (e4) {
            console.warn('⚠️ Manual UPI QR generation failed, falling back to Payment Link...', e4.message);

            // Fallback 4: Create a Payment Link
            const linkPayload = {
              amount: Math.round(amount * 100),
              currency: 'INR',
              description: `Payment for Booking #${bookingNumber}`,
              notes,
              notify: { sms: false, email: false }
            };

            const linkResponse = await axios.post('https://api.razorpay.com/v1/payment_links', linkPayload, {
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
            });

            const link = linkResponse.data;
            console.log('✅ Payment Link created as fallback');

            return {
              success: true,
              qrCodeId: link.id,
              imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link.short_url)}`,
              paymentUrl: link.short_url,
              isFallback: true
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('Razorpay QR/Link Error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.description || error.message;
    return { success: false, error: errorMsg };
  }
};

/**
 * Get payments for a QR Code or Payment Link
 */
const getQRCodePayments = async (id) => {
  try {
    if (!razorpay) {
      return { success: false, error: 'Razorpay not initialized' };
    }

    // If it's a payment link (fallback case)
    if (id && id.startsWith('plink_')) {
      const axios = require('axios');
      const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

      try {
        const response = await axios.get(`https://api.razorpay.com/v1/payment_links/${id}`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });

        const link = response.data;
        console.log(`[QR Service] Checking Payment Link ${id} status: ${link.status}`);

        // If link is paid, we returned a captured payment object
        if (link.status === 'paid' || link.status === 'partially_paid') {
          return {
            success: true,
            payments: [{
              id: link.razorpay_payment_id || `pay_${Date.now()}`,
              status: 'captured',
              amount: link.amount_paid
            }]
          };
        }
        return { success: true, payments: [] };
      } catch (linkError) {
        console.error('Payment link fetch error:', linkError.response?.data || linkError.message);
        throw linkError;
      }
    }

    // Otherwise, standard QR Code check
    const payments = await razorpay.qrCode.fetchAllPayments(id);
    return {
      success: true,
      payments: payments.items || []
    };
  } catch (error) {
    console.error('Razorpay fetch payments error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
  createQRCode,
  getQRCodePayments,
  isTestMode: () => isTestMode
};

