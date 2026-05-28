const calculateGST = (amount, percent) => {
  const gst = (amount * percent) / 100;

  return {
    baseAmount: parseFloat(amount.toFixed(2)),
    gstPercent: percent,
    cgst: parseFloat((gst / 2).toFixed(2)),
    sgst: parseFloat((gst / 2).toFixed(2)),
    igst: 0, // default to 0 for regional/domestic distribution
    totalGST: parseFloat(gst.toFixed(2)),
    totalAmount: parseFloat((amount + gst).toFixed(2))
  };
};

module.exports = {
  calculateGST
};
