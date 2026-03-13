const axios = require('axios');

/**
 * Location Service
 * Handles location-based operations using Google Maps API
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Geocode address to coordinates using Google Maps API
 * @param {string} address - Full address string
 * @returns {Promise<Object>} {lat, lng} coordinates
 */
const geocodeAddress = async (address) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, geocoding skipped');
      return null;
    }

    const response = await axios.get(`${GOOGLE_MAPS_API_URL}/geocode/json`, {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    throw new Error(`Geocoding failed: ${response.data.status}`);
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Find vendors within specified radius of a location
 * Priority: 1. Redis geo cache (fastest) → 2. MongoDB 2dsphere → 3. Haversine (fallback)
 * @param {Object} centerLocation - {lat, lng} of center point
 * @param {number} radiusKm - Search radius in kilometers (default: 10)
 * @param {Object} filters - Additional filters for vendors
 * @returns {Promise<Array>} Array of nearby vendors with distance
 */
const findNearbyVendors = async (centerLocation, radiusKm = 10, filters = {}) => {
  if (!centerLocation || typeof centerLocation.lat !== 'number' || typeof centerLocation.lng !== 'number') {
    console.warn('[LocationService] Invalid centerLocation provided to findNearbyVendors');
    return [];
  }
  try {
    const Vendor = require('../models/Vendor');
    const Settings = require('../models/Settings');
    const { VENDOR_STATUS } = require('../utils/constants');
    const { getNearbyVendorsFromCache, isRedisConnected } = require('./redisService');

    // Fetch default radius from settings if not provided or 10 is passed
    if (radiusKm === 10) {
      try {
        const globalSettings = await Settings.findOne({ type: 'global' }).select('searchRadius');
        if (globalSettings && globalSettings.searchRadius) {
          radiusKm = globalSettings.searchRadius;
        }
      } catch (err) {
        console.error('Error fetching search radius from settings:', err);
      }
    }

    // Extract custom options from filters
    const checkCashLimit = filters.checkCashLimit;
    const serviceCategory = filters.service; // Category title to match against vendor's categories array
    // Clone filters to avoid modifying original or polluting query
    const queryFilters = { ...filters };
    delete queryFilters.checkCashLimit;
    delete queryFilters.service; // Remove raw service filter — we handle it manually below

    // Build base query
    const baseQuery = {
      approvalStatus: VENDOR_STATUS.APPROVED,
      isActive: true,
      ...queryFilters
    };

    // Filter by vendor's selected categories (what they set in their profile)
    if (serviceCategory) {
      baseQuery.$or = [
        { categories: { $in: [serviceCategory] } },
        { service: { $in: [serviceCategory] } }
      ];
      console.log(`[LocationService] Filtering vendors by category: "${serviceCategory}" (OR search across categories/service)`);
    }

    // Apply Cash Limit Check if requested
    if (checkCashLimit) {
      baseQuery.$expr = { $lte: ["$wallet.dues", "$wallet.cashLimit"] };
    }

    // OPTION 1: Try Redis geo cache first (fastest - <5ms)
    if (isRedisConnected()) {
      const cachedVendors = await getNearbyVendorsFromCache(centerLocation.lat, centerLocation.lng, radiusKm);

      if (cachedVendors && cachedVendors.length > 0) {
        console.log(`[LocationService] Found ${cachedVendors.length} vendors from Redis cache`);

        // Fetch full vendor details from MongoDB
        const vendorIds = cachedVendors.map(v => v.vendorId);
        const vendors = await Vendor.find({
          _id: { $in: vendorIds },
          ...baseQuery
        }).select('name businessName phone address profilePhoto service rating isOnline availability geoLocation');

        // Merge distance from cache
        const vendorMap = new Map(vendors.map(v => [v._id.toString(), v.toObject()]));
        const result = cachedVendors
          .filter(cv => vendorMap.has(cv.vendorId))
          .map(cv => ({
            ...vendorMap.get(cv.vendorId),
            distance: cv.distance
          }));

        return result;
      }
    }

    // OPTION 2: Try MongoDB 2dsphere geo query (fast)
    let nearbyVendors = [];

    try {
      // Check if any vendors have geoLocation set
      const hasGeoVendors = await Vendor.countDocuments({
        ...baseQuery,
        'geoLocation.coordinates': { $ne: [0, 0] }
      });

      if (hasGeoVendors > 0) {
        // Use fast 2dsphere query
        nearbyVendors = await Vendor.find({
          ...baseQuery,
          geoLocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [centerLocation.lng, centerLocation.lat] // GeoJSON is [lng, lat]
              },
              $maxDistance: radiusKm * 1000 // Convert km to meters
            }
          }
        })
          .select('name businessName phone address profilePhoto service rating isOnline availability geoLocation settings')
          .limit(50); // Increased limit as we filter below

        // Calculate distance for each vendor
        nearbyVendors = nearbyVendors.map(vendor => {
          const vendorObj = vendor.toObject();
          if (vendor.geoLocation && vendor.geoLocation.coordinates) {
            vendorObj.distance = calculateDistance(centerLocation, {
              lat: vendor.geoLocation.coordinates[1],
              lng: vendor.geoLocation.coordinates[0]
            });
          } else {
            vendorObj.distance = null;
          }
          return vendorObj;
        });

        // Filter by individual vendor range
        nearbyVendors = nearbyVendors.filter(v => {
          const vRange = v.settings?.serviceRange || radiusKm;
          return v.distance <= vRange;
        });

        console.log(`[LocationService] Found ${nearbyVendors.length} vendors using 2dsphere query`);
        return nearbyVendors;
      }
    } catch (geoError) {
      console.warn('[LocationService] 2dsphere query failed, falling back to Haversine:', geoError.message);
    }

    // Fallback: Use Haversine formula (slower but works without geo index)
    const vendors = await Vendor.find(baseQuery)
      .select('name businessName phone address profilePhoto service rating isOnline availability settings');

    // Calculate distances and filter by radius
    nearbyVendors = vendors.map(vendor => {
      let distance = null;

      // If vendor has coordinates in address or real-time location
      const vLat = vendor.location?.lat || vendor.address?.lat;
      const vLng = vendor.location?.lng || vendor.address?.lng;

      if (vLat && vLng) {
        distance = calculateDistance(centerLocation, {
          lat: vLat,
          lng: vLng
        });
      }

      const vRange = vendor.settings?.serviceRange || radiusKm;
      return {
        ...vendor.toObject(),
        distance: distance,
        withinRange: distance !== null && distance <= vRange
      };
    }).filter(vendor => vendor.withinRange);

    console.log(`[LocationService] Found ${nearbyVendors.length} vendors using Haversine (fallback)`);
    return nearbyVendors;
  } catch (error) {
    console.error('Find nearby vendors error:', error);
    return [];
  }
};

/**
 * Get distance matrix between multiple points
 * @param {Array} origins - Array of {lat, lng} objects
 * @param {Array} destinations - Array of {lat, lng} objects
 * @returns {Promise<Array>} Distance matrix
 */
const getDistanceMatrix = async (origins, destinations) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, using mock distances');
      // Return mock distances
      return origins.map(() => destinations.map(() => ({ distance: { value: 5000 } })));
    }

    const originsStr = origins.map(coord => `${coord.lat},${coord.lng}`).join('|');
    const destinationsStr = destinations.map(coord => `${coord.lat},${coord.lng}`).join('|');

    const response = await axios.get(`${GOOGLE_MAPS_API_URL}/distancematrix/json`, {
      params: {
        origins: originsStr,
        destinations: destinationsStr,
        key: GOOGLE_MAPS_API_KEY,
        units: 'metric'
      }
    });

    return response.data.rows;
  } catch (error) {
    console.error('Distance matrix error:', error);
    return [];
  }
};

module.exports = {
  geocodeAddress,
  findNearbyVendors,
  calculateDistance,
  getDistanceMatrix
};
