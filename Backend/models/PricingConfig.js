const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    default: null,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
    index: true
  },
  customerPrice: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercentage: {
    type: Number,
    required: true,
    default: 18,
    min: 0
  },
  gstIncluded: {
    type: Boolean,
    required: true,
    default: true
  },
  platformCommission: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  l1Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  l2Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  l3Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    default: null,
    index: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  // For MINUTE_BASED template pricing
  pricePerMinute: {
    type: Number,
    default: null,
    min: 0
  },
  minimumMinutes: {
    type: Number,
    default: null,
    min: 1
  },
  // For SUBSCRIPTION_BASED template pricing
  validityDays: {
    type: Number,
    default: null
  },
  visitsCredits: {
    type: Number,
    default: null
  },
  pricingType: {
    type: String,
    enum: ['fixed', 'per_minute', 'package', 'subscription'],
    default: 'fixed'
  },
  originalPrice: {
    type: Number,
    default: null,
    min: 0
  },
  packageTitle: {
    type: String,
    default: null,
    index: true
  },
  vendorPayoutBase: {
    type: Number,
    default: 0,
    min: 0
  },
  vendorPayoutExtra: {
    type: Number,
    default: 0,
    min: 0
  },
  vendorSgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0
  },
  vendorCgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0
  },
  vendorTdsPercentage: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionPercentage: {
    type: Number,
    default: 10,
    min: 0
  },
  // COD (Cash on Delivery) per-service config
  codEnabled: {
    type: Boolean,
    default: true // Admin can disable COD for specific services
  },
  codAdvanceAmount: {
    type: Number,
    default: 0, // Fixed ₹ advance for COD (0 = no advance required)
    min: 0
  }
}, {
  timestamps: true
});

// Unique combination index
pricingConfigSchema.index(
  { categoryId: 1, subCategoryId: 1, serviceId: 1, brandId: 1, cityId: 1, packageTitle: 1, variantId: 1 },
  { unique: true }
);

// Post-save hook to synchronize with legacy ServiceBrandPricing
pricingConfigSchema.post('save', async function(doc) {
  try {
    const ServiceBrandPricing = mongoose.model('ServiceBrandPricing');
    const gstPct = doc.gstPercentage || 18;
    const price = doc.customerPrice || 0;
    
    let taxableAmount = 0;
    let gstAmount = 0;
    let finalCustomerPrice = 0;
    
    if (doc.gstIncluded) {
      finalCustomerPrice = price;
      gstAmount = price * (gstPct / 100);
      taxableAmount = price - gstAmount;
    } else {
      taxableAmount = price;
      gstAmount = price * (gstPct / 100);
      finalCustomerPrice = price + gstAmount;
    }

    // New Price Matrix model calculations for vendorProfit sync
    const vPayoutBase = doc.vendorPayoutBase || 0;
    const vSgstPct = doc.vendorSgstPercentage || 2.5;
    const vCgstPct = doc.vendorCgstPercentage || 2.5;
    const vTdsPct = doc.vendorTdsPercentage || 0;
    const vCommPct = doc.commissionPercentage || 10;

    const sgstAmount = vPayoutBase * (vSgstPct / 100);
    const cgstAmount = vPayoutBase * (vCgstPct / 100);
    const tdsAmount = vPayoutBase * (vTdsPct / 100);
    const remainingBase = Math.max(0, vPayoutBase - sgstAmount - cgstAmount - tdsAmount);
    const platformCommAmt = remainingBase * (vCommPct / 100);
    const netVendorPayout = Math.max(0, remainingBase - platformCommAmt);

    const vendorProfit = vPayoutBase > 0 ? netVendorPayout : (taxableAmount - (taxableAmount * (doc.platformCommission / 100)));

    await ServiceBrandPricing.findOneAndUpdate(
      {
        categoryId: doc.categoryId,
        subCategoryId: doc.subCategoryId,
        serviceId: doc.serviceId,
        brandId: doc.brandId,
        cityId: doc.cityId,
        variantId: doc.variantId || null
      },
      {
        categoryId: doc.categoryId,
        subCategoryId: doc.subCategoryId,
        serviceId: doc.serviceId,
        brandId: doc.brandId,
        cityId: doc.cityId,
        variantId: doc.variantId || null,
        basePrice: Number(taxableAmount.toFixed(2)),
        gstPercentage: gstPct,
        gstAmount: Number(gstAmount.toFixed(2)),
        vendorProfit: Number(vendorProfit.toFixed(2)),
        finalCustomerPrice: Number(finalCustomerPrice.toFixed(2)),
        isActive: true
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error synchronizing legacy ServiceBrandPricing:', error);
  }
});

// Post-delete hook to delete from legacy ServiceBrandPricing
pricingConfigSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      const ServiceBrandPricing = mongoose.model('ServiceBrandPricing');
      await ServiceBrandPricing.deleteOne({
        categoryId: doc.categoryId,
        subCategoryId: doc.subCategoryId,
        serviceId: doc.serviceId,
        brandId: doc.brandId,
        cityId: doc.cityId,
        variantId: doc.variantId || null
      });
    }
  } catch (error) {
    console.error('Error deleting synchronized legacy ServiceBrandPricing:', error);
  }
});

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
