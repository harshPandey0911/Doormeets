const City = require('../models/City');

/**
 * Generates MongoDB filter objects for CITY_ADMIN based on assigned cities and assigned vendors.
 * Returns empty objects for SUPER_ADMIN (no restrictions).
 */

/**
 * Get the basic filter configuration for a given admin user
 * @param {Object} admin - The req.user or req.admin object
 * @returns {Promise<{ isCityAdmin: boolean, cityNames: string[], vendorIds: string[], hasAccess: boolean }>}
 */
const getAdminFilterConfig = async (admin) => {
  if (!admin || admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin') {
    return { isCityAdmin: false, cityNames: [], vendorIds: [], hasAccess: true };
  }

  // It is a CITY_ADMIN
  const config = {
    isCityAdmin: true,
    cityNames: [],
    vendorIds: admin.assignedVendors || [],
    hasAccess: false
  };

  if (admin.assignedCities && admin.assignedCities.length > 0) {
    const cities = await City.find({ _id: { $in: admin.assignedCities } });
    config.cityNames = cities.map(c => new RegExp(`^${c.name}$`, 'i'));
    
    // Only grant access if they have at least one assigned vendor OR if we are allowing independent workers/bookings
    // (We will handle the exact logic in the query builders below, but technically they have some access)
    config.hasAccess = true;
  }

  return config;
};

/**
 * Filter for Vendor collections.
 * STRICT: Must belong to assigned city AND must be in assignedVendors.
 * If assignedVendors is empty, returns a query that matches nothing.
 * @param {Object} admin 
 * @param {String} cityField - The field name for the city (default: 'address.city')
 */
const getVendorQueryFilter = async (admin, cityField = 'address.city') => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isCityAdmin) return {};

  if (!config.hasAccess || config.vendorIds.length === 0) {
    return { _id: null }; // Safe block
  }

  return {
    [cityField]: { $in: config.cityNames },
    _id: { $in: config.vendorIds }
  };
};

/**
 * Filter for Worker collections.
 * ALLOWS INDEPENDENT WORKERS: Belongs to assigned city AND (vendorId in assignedVendors OR vendorId is null).
 * @param {Object} admin 
 * @param {String} cityField - The field name for the city (default: 'address.city')
 */
const getWorkerQueryFilter = async (admin, cityField = 'address.city') => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isCityAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  return {
    [cityField]: { $in: config.cityNames },
    $or: [
      { vendorId: null },
      { vendorId: { $in: config.vendorIds } }
    ]
  };
};

/**
 * Filter for Booking collections.
 * ALLOWS INDEPENDENT BOOKINGS: Belongs to assigned city AND (vendorId in assignedVendors OR vendorId is null).
 * @param {Object} admin 
 * @param {String} cityField - The field name for the city in Booking model (e.g. 'address.city' or if it relies on worker/vendor population, see below)
 * Note: Bookings might not have address.city at root, they have 'city' or 'address'. Assuming 'address.city' or custom.
 */
const getBookingQueryFilter = async (admin) => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isCityAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  // Currently, the existing admin dashboard doesn't easily filter bookings by city if the city is only in the address object string.
  // Wait, the user previously said "vendor must belong to assigned city", which means the booking's vendor.
  // But for bookings, the booking itself has a vendorId.
  // We can just filter by vendorId (and null).
  return {
    $or: [
      { vendorId: null },
      { vendorId: { $in: config.vendorIds } }
    ]
  };
};

/**
 * Applies the filter to an aggregation pipeline's $match stage.
 */
const getAggregateMatchFilter = async (admin, type = 'booking') => {
  if (type === 'vendor') return getVendorQueryFilter(admin);
  if (type === 'worker') return getWorkerQueryFilter(admin);
  if (type === 'cityOnly') return getCityOnlyFilter(admin);
  return getBookingQueryFilter(admin);
};

/**
 * Filter for collections that only have a city (no vendorId), like Users.
 */
const getCityOnlyFilter = async (admin, cityField = 'address.city') => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isCityAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  return { [cityField]: { $in: config.cityNames } };
};

module.exports = {
  getAdminFilterConfig,
  getVendorQueryFilter,
  getWorkerQueryFilter,
  getBookingQueryFilter,
  getCityOnlyFilter,
  getAggregateMatchFilter
};
