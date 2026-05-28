const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const Category = require('./models/Category');
  const Vendor = require('./models/Vendor');
  const City = require('./models/City');
  
  const cityId = '6a153cdfb02e3f00051d6156'; // Indore
  
  const dbActiveCategoriesForHome = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).select('_id title');
  const dbActiveCatIdsForHome = new Set(dbActiveCategoriesForHome.map(c => c._id.toString()));
  const dbActiveCatTitlesForHome = new Set(dbActiveCategoriesForHome.map(c => c.title.toLowerCase().trim()));

  console.log('dbActiveCatIdsForHome:', Array.from(dbActiveCatIdsForHome));
  console.log('dbActiveCatTitlesForHome:', Array.from(dbActiveCatTitlesForHome));

  let homeVendorFilter = { isOnline: true, workStatus: 'available' };
  if (cityId) {
    const homeCityDoc = await City.findById(cityId).select('name').lean();
    if (homeCityDoc && homeCityDoc.name) {
      homeVendorFilter['address.city'] = new RegExp(`^${homeCityDoc.name.trim()}$`, 'i');
    }
  }
  
  console.log('homeVendorFilter:', homeVendorFilter);
  
  const onlineVendors = await Vendor.find(homeVendorFilter)
    .select('categories location address geoLocation');
  
  console.log('Found online vendors count:', onlineVendors.length);
  for (const v of onlineVendors) {
    console.log(`Vendor: ${v.name}, ID: ${v._id}, Categories:`, v.categories);
  }

  const activeCategoryIds = new Set();
  const activeCategoryTitles = new Set();
  onlineVendors.forEach(vendor => {
    if (Array.isArray(vendor.categories)) {
      vendor.categories.forEach(cat => {
        if (cat) {
          if (mongoose.isValidObjectId(cat)) {
            if (dbActiveCatIdsForHome.has(cat.toString())) {
              activeCategoryIds.add(cat.toString());
            }
          } else {
            const titleLower = cat.toLowerCase().trim();
            if (dbActiveCatTitlesForHome.has(titleLower)) {
              activeCategoryTitles.add(titleLower);
            }
          }
        }
      });
    }
  });

  console.log('activeCategoryIds set:', Array.from(activeCategoryIds));
  console.log('activeCategoryTitles set:', Array.from(activeCategoryTitles));

  const categoriesRes = await Category.find({ 
    status: { $in: ['active', 'coming_soon'] }, 
    showOnHome: { $ne: false },
    $or: cityId ? [
      { cityIds: cityId },
      { cityIds: { $exists: false } },
      { cityIds: { $size: 0 } }
    ] : [{ status: { $in: ['active', 'coming_soon'] } }]
  })
    .select('title slug homeIconUrl homeBadge hasSaleBadge categoryType status interestedUsers')
    .sort({ homeOrder: 1 })
    .lean();

  console.log('categoriesRes found from Category.find:', categoriesRes.map(c => ({ id: c._id, title: c.title, status: c.status })));

  const formattedCategories = categoriesRes
    .filter(cat => cat.status === 'coming_soon' || activeCategoryIds.has(cat._id.toString()) || activeCategoryTitles.has(cat.title.toLowerCase().trim()))
    .map(cat => ({
      id: cat._id.toString(),
      title: cat.title,
      slug: cat.slug
    }));

  console.log('formattedCategories after filter:', formattedCategories);

  process.exit(0);
}

run();
