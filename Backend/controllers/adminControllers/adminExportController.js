const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');
const PDFDocument = require('pdfkit');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');

// Helper to get booking filters by date range
const getReportFilter = (startDate, endDate) => {
  const filter = { status: BOOKING_STATUS.COMPLETED };
  if (startDate || endDate) {
    filter.completedAt = {};
    if (startDate) filter.completedAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.completedAt.$lte = end;
    }
  }
  return filter;
};

/**
 * Export report to CSV (Excel compatible)
 */
exports.exportExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const filter = getReportFilter(startDate, endDate);

    let csvContent = '';
    let filename = `${reportType || 'report'}_export_${Date.now()}.csv`;

    if (reportType === 'gst') {
      const bookings = await Booking.find(filter)
        .populate('userId', 'name')
        .sort({ completedAt: -1 });

      // CSV Headers
      csvContent += 'Booking Number,Completed Date,Customer Name,Category,Gross Amount (INR),Taxable Amount (INR),GST (18% in INR),Payment Status\n';
      
      bookings.forEach(b => {
        const gross = b.finalAmount || 0;
        const tax = b.tax || parseFloat((gross * 0.18 / 1.18).toFixed(2));
        const taxable = b.basePrice || parseFloat((gross - tax).toFixed(2));
        const dateStr = b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '';
        const customerName = b.userId?.name || 'N/A';

        csvContent += `"${b.bookingNumber}","${dateStr}","${customerName.replace(/"/g, '""')}","${b.serviceCategory || ''}",${gross},${taxable},${tax},"${b.paymentStatus}"\n`;
      });

    } else if (reportType === 'profit') {
      const bookings = await Booking.find(filter).sort({ completedAt: -1 });

      // CSV Headers
      csvContent += 'Booking Number,Completed Date,Category,Final Amount (INR),Platform Commission (INR),Vendor Share (INR),Net Admin Profit (INR)\n';

      bookings.forEach(b => {
        const gross = b.finalAmount || 0;
        const commission = b.adminCommission || parseFloat((gross * 0.2).toFixed(2)); // Default 20%
        const vendorShare = b.vendorShare || parseFloat((gross - commission).toFixed(2));
        const dateStr = b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '';

        csvContent += `"${b.bookingNumber}","${dateStr}","${b.serviceCategory || ''}",${gross},${commission},${vendorShare},${commission}\n`;
      });

    } else if (reportType === 'payout') {
      // Find all approved/active vendors and compute payouts based on their stats & wallets
      const vendors = await Vendor.find({ approvalStatus: 'approved' }).sort({ createdAt: -1 });
      
      // CSV Headers
      csvContent += 'Vendor Name,Business Name,Phone,Email,Completed Jobs,Total Cash Collected (INR),Admin Commission Dues (INR),Net Earnings (INR)\n';

      vendors.forEach(v => {
        const name = v.name || '';
        const business = v.businessName || '';
        const email = v.email || '';
        const phone = v.phone || '';
        const completed = v.completedJobs || 0;
        const cashCollected = v.wallet?.totalCashCollected || 0;
        const dues = v.wallet?.dues || 0;
        const earnings = v.wallet?.earnings || 0;

        csvContent += `"${name.replace(/"/g, '""')}","${business.replace(/"/g, '""')}","${phone}","${email}",${completed},${cashCollected},${dues},${earnings}\n`;
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Failed to export Excel report' });
  }
};

/**
 * Export report to PDF (using pdfkit)
 */
exports.exportPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const filter = getReportFilter(startDate, endDate);

    let doc = new PDFDocument({ margin: 30, size: 'A4' });
    let filename = `${reportType || 'report'}_export_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // Title & Header Block
    doc.fontSize(18).text(`Appzeto Service Marketplace — ${reportType.toUpperCase()} Report`, { align: 'center' });
    doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' });
    }
    doc.moveDown(2);

    if (reportType === 'gst') {
      const bookings = await Booking.find(filter)
        .populate('userId', 'name')
        .sort({ completedAt: -1 });

      doc.fontSize(12).text('GST Tax Collection Breakdown:', { underline: true });
      doc.moveDown(0.5);

      // Render Simple Text Table Rows
      let totalGST = 0;
      let idx = 1;

      bookings.forEach(b => {
        const gross = b.finalAmount || 0;
        const tax = b.tax || parseFloat((gross * 0.18 / 1.18).toFixed(2));
        totalGST += tax;
        const dateStr = b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '';

        doc.fontSize(9).text(
          `${idx++}. Booking: ${b.bookingNumber} | Date: ${dateStr} | Gross: ₹${gross} | GST (18%): ₹${tax}`,
          { lineGap: 3 }
        );
      });

      doc.moveDown(1.5);
      doc.fontSize(11).font('Helvetica-Bold').text(`Total GST Tax Collected: ₹${totalGST.toFixed(2)}`);

    } else if (reportType === 'profit') {
      const bookings = await Booking.find(filter).sort({ completedAt: -1 });

      doc.fontSize(12).text('Profit & Platform Commission Breakdown:', { underline: true });
      doc.moveDown(0.5);

      let totalGross = 0;
      let totalProfit = 0;
      let idx = 1;

      bookings.forEach(b => {
        const gross = b.finalAmount || 0;
        const commission = b.adminCommission || parseFloat((gross * 0.2).toFixed(2));
        totalGross += gross;
        totalProfit += commission;
        const dateStr = b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '';

        doc.fontSize(9).text(
          `${idx++}. Booking: ${b.bookingNumber} | Date: ${dateStr} | Gross: ₹${gross} | Commission (Profit): ₹${commission}`,
          { lineGap: 3 }
        );
      });

      doc.moveDown(1.5);
      doc.fontSize(11).font('Helvetica-Bold').text(`Total Gross Billing: ₹${totalGross.toFixed(2)}`);
      doc.fontSize(11).font('Helvetica-Bold').text(`Net Platform Profit: ₹${totalProfit.toFixed(2)}`);

    } else if (reportType === 'payout') {
      const vendors = await Vendor.find({ approvalStatus: 'approved' }).sort({ createdAt: -1 });

      doc.fontSize(12).text('Vendor Earnings & Payout Summaries:', { underline: true });
      doc.moveDown(0.5);

      let idx = 1;
      vendors.forEach(v => {
        const completed = v.completedJobs || 0;
        const dues = v.wallet?.dues || 0;
        const earnings = v.wallet?.earnings || 0;

        doc.fontSize(9).text(
          `${idx++}. Vendor: ${v.businessName || v.name} | Phone: ${v.phone} | Jobs: ${completed} | Dues: ₹${dues} | Net Earnings: ₹${earnings}`,
          { lineGap: 3 }
        );
      });
    }

    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    // Since we piped the doc already, we can end document
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
  }
};
