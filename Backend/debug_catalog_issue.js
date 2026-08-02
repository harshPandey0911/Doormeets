const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function debugDatabase() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB successfully.');

    const Service = require('./models/Service');
    const Category = require('./models/Category');
    const SubCategory = require('./models/SubCategory');
    const ServiceBrandPricing = require('./models/ServiceBrandPricing');
    const Vendor = require('./models/Vendor');
    const City = require('./models/City');

    console.log('\n--- 1. CATEGORIES ---');
    const categories = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).lean();
    console.log(`Found ${categories.length} active/coming_soon categories.`);
    const electricianCat = categories.find(c => c.slug === 'electrician' || c.title.toLowerCase().includes('electric'));
    if (electricianCat) {
      console.log('Electrician Category Found:', { id: electricianCat._id, title: electricianCat.title, status: electricianCat.status, slug: electricianCat.slug });
    } else {
      console.log('Electrician category not found by slug/title. Listing all categories:');
      categories.forEach(c => console.log({ id: c._id, title: c.title, slug: c.slug, status: c.status }));
    }

    console.log('\n--- 2. SUBCATEGORIES ---');
    const subCategories = await SubCategory.find({ status: 'active' }).lean();
    console.log(`Found ${subCategories.length} active subcategories.`);
    if (electricianCat) {
      const elecSubCats = subCategories.filter(s => s.categoryId && s.categoryId.toString() === electricianCat._id.toString());
      console.log(`Subcategories for Electrician (${elecSubCats.length}):`);
      elecSubCats.forEach(s => console.log({ id: s._id, title: s.title, status: s.status }));
    }

    console.log('\n--- 3. SERVICES ---');
    const services = await Service.find().lean();
    console.log(`Total Services in DB: ${services.length}`);
    services.forEach(s => {
      console.log({
        id: s._id,
        title: s.title,
        status: s.status,
        categoryId: s.categoryId,
        subCategoryId: s.subCategoryId,
        serviceType: s.serviceType,
        basePrice: s.basePrice
      });
    });

    console.log('\n--- 4. SERVICE PRICINGS (Pricing Matrix) ---');
    const pricings = await ServiceBrandPricing.find().lean();
    console.log(`Total ServiceBrandPricing records: ${pricings.length}`);
    pricings.forEach(p => {
      console.log({
        id: p._id,
        serviceId: p.serviceId,
        brandId: p.brandId,
        basePrice: p.basePrice,
        finalCustomerPrice: p.finalCustomerPrice,
        isActive: p.isActive,
        status: p.status
      });
    });

    console.log('\n--- 5. ONLINE VENDORS ---');
    const vendors = await Vendor.find().lean();
    console.log(`Total Vendors in DB: ${vendors.length}`);
    vendors.forEach(v => {
      console.log({
        id: v._id,
        name: v.name,
        isOnline: v.isOnline,
        workStatus: v.workStatus,
        categories: v.categories,
        addressCity: v.address?.city
      });
    });

    console.log('\n--- 6. CITIES ---');
    const cities = await City.find().lean();
    console.log(`Cities in DB (${cities.length}):`);
    cities.forEach(c => console.log({ id: c._id, name: c.name, status: c.status }));

  } catch (err) {
    console.error('Debug script error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugDatabase();
