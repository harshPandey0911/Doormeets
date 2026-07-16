import html2pdf from 'html2pdf.js';

const getStateCode = (stateName) => {
  if (!stateName) return '00';
  const codes = {
    'chhattisgarh': '22',
    'madhya pradesh': '23',
    'haryana': '06',
    'delhi': '07',
    'maharashtra': '27',
    'uttar pradesh': '09',
    'karnataka': '29',
    'tamil nadu': '33',
    'west bengal': '19',
    'gujarat': '24',
    'rajasthan': '08'
  };
  return codes[stateName.toLowerCase().trim()] || '00';
};

const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertLessThanOneThousand = (n) => {
    if (n === 0) return '';
    let temp = '';
    if (n >= 100) {
      temp += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 20) {
      temp += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      temp += ones[n] + ' ';
    }
    return temp.trim();
  };

  const convert = (n) => {
    if (n === 0) return 'zero';
    let words = '';
    if (Math.floor(n / 10000000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 10000000)) + ' crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 100000)) + ' lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 1000)) + ' thousand ';
      n %= 1000;
    }
    words += convertLessThanOneThousand(n);
    return words.trim();
  };

  const rounded = parseFloat(num).toFixed(2);
  const parts = rounded.split('.');
  const integerPart = parseInt(parts[0]) || 0;
  const decimalPart = parseInt(parts[1]) || 0;

  let result = convert(integerPart);
  if (decimalPart > 0) {
    result += ' point ' + convert(decimalPart);
  }
  return result + ' only';
};

export const downloadInvoice = (booking, companyDetails) => {
  if (!booking) return;

  const grandTotalVal = parseFloat(booking.bill?.grandTotal || booking.finalAmount || booking.totalAmount || 0);
  const taxRate = companyDetails.serviceGstPercentage || 18;
  const isGstIncluded = true;

  let discountVal = parseFloat(booking.discount || 0);
  let taxableValue = 0;
  let igstAmount = 0;

  if (isGstIncluded) {
    taxableValue = parseFloat((grandTotalVal / (1 + (taxRate / 100))).toFixed(2));
    igstAmount = parseFloat((grandTotalVal - taxableValue).toFixed(2));
  } else {
    taxableValue = grandTotalVal - discountVal;
    igstAmount = parseFloat((taxableValue * (taxRate / 100)).toFixed(2));
  }

  const formattedDate = new Date(booking.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const custName = booking.userId?.name || 'Customer';
  const invoiceNum = `${companyDetails.companyGSTIN ? 'UCIC' : 'INV'}${booking.bookingNumber}`;
  
  const addr1 = booking.address?.addressLine1 || '';
  const addr2 = booking.address?.addressLine2 || '';
  const cityVal = booking.address?.city || '';
  const stateVal = booking.address?.state || '';
  const pinVal = booking.address?.pincode || '';
  const landVal = booking.address?.landmark || '';

  const custStateCode = getStateCode(stateVal);
  const compStateCode = getStateCode(companyDetails.companyState);

  // Fetch SAC Code from booking's category
  const sacCodeVal = (booking.categoryId?.sacCode || companyDetails.sacCode || '').trim();

  // Render HTML for Invoice
  const invoiceHtml = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; max-width: 800px; margin: 0 auto; background: #fff; box-sizing: border-box;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <td style="vertical-align: top;">
            <!-- Typographic Logo -->
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="background: #000; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 16px; font-weight: 800; text-transform: uppercase; font-family: sans-serif; letter-spacing: 0.5px;">dm</span>
              <span style="font-weight: 800; font-size: 24px; color: #000; letter-spacing: -0.8px; font-family: sans-serif; text-transform: lowercase;">doormeets</span>
            </div>
            <div style="font-size: 11px; color: #555; margin-top: 12px; line-height: 1.6;">
              <strong style="color: #000; font-size: 12px;">Doormeets Platform</strong><br/>
              ${companyDetails.companyAddress || ''}<br/>
              ${companyDetails.companyCity || ''}, ${companyDetails.companyState || ''} - ${companyDetails.companyPincode || ''}<br/>
              Email: ${companyDetails.companyEmail || ''}<br/>
              Telephone: ${companyDetails.companyPhone || ''}<br/>
              ${companyDetails.companyCIN ? `CIN: ${companyDetails.companyCIN}<br/>` : ''}
              ${companyDetails.companyWebsite || 'www.doormeets.com'}
            </div>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <h1 style="font-size: 26px; font-weight: 900; color: #000; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">TAX INVOICE</h1>
            <div style="font-size: 12px; color: #666; line-height: 1.5;">
              <div><strong>Invoice No:</strong> <span style="color: #000; font-weight: 700;">${invoiceNum}</span></div>
              <div><strong>Date:</strong> ${formattedDate}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Customer & Service Provider Details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 12px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding: 20px 20px 20px 0; border-right: 1px solid #e5e7eb;">
            <div style="color: #000; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px;">Customer Details</div>
            
            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Customer Name</span>
              <span style="font-size: 13px; font-weight: bold; color: #111;">${custName}</span>
            </div>

            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Delivery Address</span>
              <span style="font-size: 12px; color: #444; line-height: 1.4; display: block;">
                ${addr1}<br/>
                ${addr2 && addr2.trim().toLowerCase() !== `${cityVal}, ${stateVal}`.trim().toLowerCase() && addr2.trim().toLowerCase() !== `${cityVal}`.trim().toLowerCase() ? addr2 + '<br/>' : ''}
                ${cityVal}, ${stateVal} - ${pinVal}<br/>
                ${landVal ? 'Landmark: ' + landVal : ''}
              </span>
            </div>

            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">State Name & Code</span>
              <span style="font-size: 12px; color: #111;">${stateVal} (${custStateCode})</span>
            </div>

            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Place of Supply</span>
              <span style="font-size: 12px; color: #111;">${stateVal} (${custStateCode})</span>
            </div>

            ${booking.userGstNumber ? `
            <div style="margin-top: 12px; border-top: 1px dashed #eee; pt: 8px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Customer GSTIN</span>
              <span style="font-size: 12px; font-weight: bold; color: #111;">${booking.userGstNumber}</span>
            </div>
            ` : ''}
          </td>
          <td style="width: 50%; vertical-align: top; padding: 20px 0 20px 20px;">
            <div style="color: #000; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px;">Delivery Service Provider</div>

            ${companyDetails.companyGSTIN ? `
            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Business GSTIN</span>
              <span style="font-size: 13px; font-weight: bold; color: #111;">${companyDetails.companyGSTIN}</span>
            </div>
            ` : ''}

            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Business Name</span>
              <span style="font-size: 12px; color: #111;">Doormeets Platform</span>
            </div>

            <div style="margin-bottom: 12px;">
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Address</span>
              <span style="font-size: 12px; color: #444; line-height: 1.4; display: block;">
                ${companyDetails.companyAddress || ''}<br/>
                ${companyDetails.companyCity || ''}, ${companyDetails.companyState || ''} - ${companyDetails.companyPincode || ''}
              </span>
            </div>

            <div>
              <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">State Name & Code</span>
              <span style="font-size: 12px; color: #111;">${companyDetails.companyState || ''} ${compStateCode}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #111; border-top: 2px solid #111;">
            <th style="text-align: left; padding: 12px 8px; font-weight: 800; text-transform: uppercase; font-family: sans-serif;">Items Description</th>
            <th style="text-align: right; padding: 12px 8px; font-weight: 800; text-transform: uppercase; width: 300px; font-family: sans-serif;">Taxable Value</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 24px 8px; vertical-align: top;">
              <span style="font-size: 14px; font-weight: bold; color: #111; display: block; margin-bottom: 6px;">
                ${companyDetails.invoiceTitle || 'Convenience and Platform Fee'} - ${booking.serviceName}
              </span>
              ${sacCodeVal && sacCodeVal !== '' ? `<span style="color: #555; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">SAC: ${sacCodeVal}</span>` : ''}
            </td>
            <td style="text-align: right; padding: 24px 8px; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                  <td style="text-align: left; color: #666; padding: 4px 0;">Gross Amount</td>
                  <td style="text-align: right; font-weight: bold; color: #111;">Rs. ${grandTotalVal.toFixed(2)}</td>
                </tr>
                ${discountVal > 0 ? `
                <tr>
                  <td style="text-align: left; color: #666; padding: 4px 0;">Discount</td>
                  <td style="text-align: right; color: #e53e3e; font-weight: bold;">- Rs. ${discountVal.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="text-align: left; color: #666; padding: 10px 0 4px 0; font-weight: bold; border-top: 1px dashed #e5e7eb;">Taxable Value</td>
                  <td style="text-align: right; font-weight: bold; color: #111; padding: 10px 0 4px 0; border-top: 1px dashed #e5e7eb;">Rs. ${taxableValue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="text-align: right; font-size: 10px; color: #777; font-style: italic; padding-bottom: 12px;">
                    (${numberToWords(taxableValue)})
                  </td>
                </tr>
                <tr>
                  <td style="text-align: left; color: #666; padding: 4px 0; border-top: 1px dashed #e5e7eb; padding-top: 10px;">IGST @${taxRate}%</td>
                  <td style="text-align: right; font-weight: bold; color: #111; padding: 4px 0; border-top: 1px dashed #e5e7eb; padding-top: 10px;">Rs. ${igstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="text-align: right; font-size: 10px; color: #777; font-style: italic; padding-bottom: 8px;">
                    (${numberToWords(igstAmount)})
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr style="border-top: 2px solid #111; border-bottom: 2px solid #111; font-size: 14px; font-weight: 800;">
            <td style="padding: 15px 8px; text-transform: uppercase; font-family: sans-serif;">TOTAL AMOUNT</td>
            <td style="text-align: right; padding: 15px 8px; color: #000; font-size: 16px; font-weight: 900; font-family: sans-serif;">Rs. ${grandTotalVal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Signature Section -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 60px; font-size: 11px; color: #666;">
        <tr>
          <td style="vertical-align: bottom; font-style: italic;">
            Reverse Charge mechanism not applicable
          </td>
          <td style="text-align: right; vertical-align: top; width: 250px;">
            <div style="border-bottom: 1px solid #ccc; height: 45px; margin-bottom: 8px;"></div>
            <span style="font-weight: 700; color: #333;">Doormeets Platform</span><br/>
            Signature of supplier/authorized representative
          </td>
        </tr>
      </table>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `TaxInvoice-${booking.bookingNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(invoiceHtml).set(opt).save();
};
