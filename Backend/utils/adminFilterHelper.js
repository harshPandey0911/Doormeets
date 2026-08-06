const City = require('../models/City');

/**
 * Generates MongoDB filter objects for CITY_ADMIN based on assigned cities and assigned vendors.
 * Returns empty objects for SUPER_ADMIN (no restrictions).
 */

const Zone = require('../models/Zone');

/**
 * Get the basic filter configuration for a given admin user
 * @param {Object} admin - The req.user or req.admin object
 * @returns {Promise<{ isScopedAdmin: boolean, isCityAdmin: boolean, isZoneAdmin: boolean, cityNames: string[], zoneIds: string[], vendorIds: string[], hasAccess: boolean }>}
 */
const getAdminFilterConfig = async (admin) => {
  if (!admin || admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin') {
    return { isScopedAdmin: false, isCityAdmin: false, isZoneAdmin: false, cityNames: [], zoneIds: [], vendorIds: [], hasAccess: true };
  }

  const isZoneAdmin = admin.role === 'ZONE_ADMIN' || (admin.assignedZones && admin.assignedZones.length > 0) || !!admin.zoneId;
  const isCityAdmin = admin.role === 'CITY_ADMIN';

  const config = {
    isScopedAdmin: true,
    isCityAdmin,
    isZoneAdmin,
    cityNames: [],
    zoneIds: [],
    vendorIds: admin.assignedVendors || [],
    hasAccess: false
  };

  if (isZoneAdmin) {
    const rawZoneIds = [];
    if (admin.zoneId) rawZoneIds.push(admin.zoneId);
    if (admin.assignedZones && admin.assignedZones.length > 0) {
      admin.assignedZones.forEach(z => rawZoneIds.push(z._id || z));
    }
    config.zoneIds = rawZoneIds.map(id => id.toString());
    config.hasAccess = config.zoneIds.length > 0 || config.vendorIds.length > 0;
  }

  if (isCityAdmin && admin.assignedCities && admin.assignedCities.length > 0) {
    const cities = await City.find({ _id: { $in: admin.assignedCities } });
    config.cityNames = cities.map(c => new RegExp(`^${c.name}$`, 'i'));
    config.hasAccess = true;
  }

  return config;
};

/**
 * Filter for Vendor collections.
 */
const getVendorQueryFilter = async (admin, cityField = 'address.city') => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isScopedAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  if (config.isZoneAdmin && config.zoneIds.length > 0) {
    // 1. Match vendors explicitly mapped to the zoneId or zoneIds array
    const query = {
      $or: [
        { zoneId: { $in: config.zoneIds } },
        { zoneIds: { $in: config.zoneIds } }
      ]
    };

    // 2. Also query zones by name to match vendor city/address string
    const assignedZonesDocs = await Zone.find({ _id: { $in: config.zoneIds } }).select('name coordinates');
    const zoneCityNames = assignedZonesDocs.map(z => new RegExp(z.name, 'i'));

    if (zoneCityNames.length > 0) {
      query.$or.push({ [cityField]: { $in: zoneCityNames } });
      query.$or.push({ 'address.fullAddress': { $in: zoneCityNames } });
    }

    if (config.vendorIds.length > 0) {
      query.$or.push({ _id: { $in: config.vendorIds } });
    }

    return query;
  }

  if (config.vendorIds.length === 0 && config.cityNames.length === 0) {
    return { _id: null };
  }

  const filters = [];
  if (config.cityNames.length > 0) filters.push({ [cityField]: { $in: config.cityNames } });
  if (config.vendorIds.length > 0) filters.push({ _id: { $in: config.vendorIds } });

  return filters.length > 0 ? { $or: filters } : {};
};

/**
 * Filter for Worker collections.
 */
const getWorkerQueryFilter = async (admin, cityField = 'address.city') => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isScopedAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  if (config.isZoneAdmin && config.zoneIds.length > 0) {
    const assignedZonesDocs = await Zone.find({ _id: { $in: config.zoneIds } }).select('name');
    const zoneNames = assignedZonesDocs.map(z => new RegExp(z.name, 'i'));
    return {
      $or: [
        { [cityField]: { $in: zoneNames } },
        { 'address.fullAddress': { $in: zoneNames } },
        { zoneId: { $in: config.zoneIds } }
      ]
    };
  }

  return {
    [cityField]: { $in: config.cityNames }
  };
};

/**
 * Filter for Booking collections.
 */
const getBookingQueryFilter = async (admin) => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isScopedAdmin) return {};

  if (!config.hasAccess) {
    return { _id: null };
  }

  if (config.isZoneAdmin && config.zoneIds.length > 0) {
    const assignedZonesDocs = await Zone.find({ _id: { $in: config.zoneIds } }).select('name');
    const zoneNames = assignedZonesDocs.map(z => new RegExp(z.name, 'i'));
    return {
      $or: [
        { zoneId: { $in: config.zoneIds } },
        { 'address.city': { $in: zoneNames } },
        { 'address.fullAddress': { $in: zoneNames } }
      ]
    };
  }

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

/**
 * Lightweight zone-scope summary for the zone middleware and any controller that just needs
 * "am I restricted, and to which zones" without the full city/vendor filter-building logic
 * above. Super Admin → isSuperAdmin:true, zoneIds:[] (no restriction).
 */
const getAdminZoneScope = async (admin) => {
  const config = await getAdminFilterConfig(admin);
  return {
    isSuperAdmin: !config.isScopedAdmin,
    isZoneAdmin: config.isZoneAdmin,
    zoneIds: config.zoneIds
  };
};

/**
 * Generic zone filter for any collection that carries a direct zoneId (or zoneIds array)
 * field and has no bespoke helper above (Transaction, Withdrawal, Settlement, Worker, Review,
 * Ticket, PromoCode, OfferBanner, ...). Pass includeGlobal:true for array fields that use the
 * "empty = global/all zones" convention (e.g. Category.zoneIds, PromoCode.zoneIds).
 */
const getZoneMatchFilter = async (admin, zoneField = 'zoneId', { includeGlobal = false } = {}) => {
  const config = await getAdminFilterConfig(admin);
  if (!config.isScopedAdmin) return {}; // Super Admin — no restriction
  if (!config.isZoneAdmin || config.zoneIds.length === 0) return { _id: null }; // scoped but no zone assigned — sees nothing

  if (includeGlobal) {
    return {
      $or: [
        { [zoneField]: { $in: config.zoneIds } },
        { [zoneField]: { $exists: false } },
        { [zoneField]: { $size: 0 } }
      ]
    };
  }

  return { [zoneField]: { $in: config.zoneIds } };
};

module.exports = {
  getAdminFilterConfig,
  getVendorQueryFilter,
  getWorkerQueryFilter,
  getBookingQueryFilter,
  getCityOnlyFilter,
  getAggregateMatchFilter,
  getAdminZoneScope,
  getZoneMatchFilter
};
