const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const Service = require('../models/Service');
    const Category = require('../models/Category');
    const ServiceBrandPricing = require('../models/ServiceBrandPricing');

    const category = await Category.findOne({ slug: 'carpenter' }).lean();
    console.log("Category ID:", category._id);

    const query = { status: 'active', categoryId: category._id };
    let activeServices = await Service.find(query).sort({ createdAt: 1 }).lean();
    console.log("Stage 1 - fetched count:", activeServices.length);
    console.log("Stage 1 - variants length:", activeServices[0].variants?.length);

    // Grouping
    const groupedServices = new Map();
    activeServices.forEach(svc => {
      const titleKey = svc.title.toLowerCase().trim();
      groupedServices.set(titleKey, svc);
    });
    activeServices = Array.from(groupedServices.values());
    console.log("Stage 2 - after group variants length:", activeServices[0].variants?.length);

    // Pricings
    const serviceIds = activeServices.map(s => s._id);
    const pricings = await ServiceBrandPricing.find({
      serviceId: { $in: serviceIds },
      isActive: true
    }).lean();

    // Map pricing
    activeServices = activeServices.map(svc => {
      let resolvedVariants = [];
      if (Array.isArray(svc.variants)) {
        resolvedVariants = svc.variants.map(v => {
          const variantPricing = pricings.find(p => 
            p.serviceId.toString() === svc._id.toString() &&
            p.variantId && p.variantId.toString() === v._id.toString()
          );
          return {
            ...v,
            extraPrice: variantPricing ? (variantPricing.finalCustomerPrice || variantPricing.basePrice) : v.extraPrice
          };
        });
      }

      console.log("Resolved variants count inside map:", resolvedVariants.length);
      console.log("Mapped service keys:", Object.keys({ ...svc }));

      return {
        ...svc,
        basePrice: 100, // dummy
        variants: resolvedVariants
      };
    });

    console.log("Stage 3 - final variants length:", activeServices[0].variants?.length);
    console.log("Stage 3 - final variants keys:", Object.keys(activeServices[0]));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

run();
