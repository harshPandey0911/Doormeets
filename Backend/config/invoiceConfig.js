// Central Invoice Configuration
module.exports = {
  vendorGSTPercent: 5,
  platformGSTPercent: 18,
  subscriptionGSTPercent: 18,

  generatedByRole: "super_admin",

  invoiceStatuses: {
    GENERATED: "generated",
    PAID: "paid",
    CANCELLED: "cancelled"
  }
};
