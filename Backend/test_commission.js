const checkCalculations = () => {
  console.log("=== SCENARIO 1: Standard Booking ===");
  // Customer pays 500, Vendor base is 400. No instant, no acceptance fee.
  let cp1 = 500;
  let basePayout1 = 400;
  let vCommPct = 25;
  let vSgstPct = 2.5;
  let vCgstPct = 2.5;

  let platformCommission1 = basePayout1 * (vCommPct / 100);
  let sgst1 = basePayout1 * (vSgstPct / 100);
  let cgst1 = basePayout1 * (vCgstPct / 100);
  let totalDeductions1 = platformCommission1 + sgst1 + cgst1;
  let vendorShare1 = Math.max(0, basePayout1 - totalDeductions1);
  let adminCommission1 = cp1 - vendorShare1;

  console.log(`Original Base: 400 | Vendor Share: ${vendorShare1} | Admin Comm: ${adminCommission1}`);

  // Reverse Calculation in Admin Controller
  const deductionMultiplier1 = 1 - ((vCommPct + vSgstPct + vCgstPct) / 100);
  let reverseVPayoutBase1 = vendorShare1 / deductionMultiplier1;
  let adminGrossShare1 = Math.max(0, cp1 - reverseVPayoutBase1);
  let platformGstAmount1 = adminGrossShare1 * 0.18;
  let adminTaxableEarning1 = adminGrossShare1 - platformGstAmount1;

  console.log(`Reverse VPayoutBase: ${reverseVPayoutBase1}`);
  console.log(`Admin Gross: ${adminGrossShare1} | Admin Net: ${adminTaxableEarning1}`);
  console.log("---------------------------------------");

  console.log("=== SCENARIO 2: Instant Booking with Acceptance Fee ===");
  // Customer pays 399 (300 base + 99 instant). Base payout is 113. 50 instant bonus. 35 acceptance fee.
  let cp2 = 399;
  let basePayout2 = 113;
  let instantShare2 = 50;
  let acceptanceFee2 = 35;

  let vPayoutBase2 = basePayout2 + instantShare2 - acceptanceFee2; // 128
  let platformCommission2 = vPayoutBase2 * (vCommPct / 100);
  let sgst2 = vPayoutBase2 * (vSgstPct / 100);
  let cgst2 = vPayoutBase2 * (vCgstPct / 100);
  let totalDeductions2 = platformCommission2 + sgst2 + cgst2;
  let vendorShare2 = Math.max(0, vPayoutBase2 - totalDeductions2);
  let adminCommission2 = cp2 - vendorShare2;

  console.log(`Original Base: 113 | VPayoutBase: ${vPayoutBase2} | Vendor Share: ${vendorShare2} | Admin Comm: ${adminCommission2}`);

  // Reverse Calculation in Admin Controller
  const deductionMultiplier2 = 1 - ((vCommPct + vSgstPct + vCgstPct) / 100);
  let reverseVPayoutBase2 = vendorShare2 / deductionMultiplier2;
  let adminGrossShare2 = Math.max(0, cp2 - reverseVPayoutBase2);
  let platformGstAmount2 = adminGrossShare2 * 0.18;
  let adminTaxableEarning2 = adminGrossShare2 - platformGstAmount2;

  console.log(`Reverse VPayoutBase: ${reverseVPayoutBase2}`);
  console.log(`Admin Gross: ${adminGrossShare2} | Admin Net: ${adminTaxableEarning2}`);
  console.log("---------------------------------------");
};

checkCalculations();
