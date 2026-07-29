const axios = require('axios');

function parseScheduledStartTime(scheduledDate, timeStr) {
  const date = new Date(scheduledDate);
  if (isNaN(date.getTime())) return new Date();
  
  let hours = 0;
  let minutes = 0;
  if (typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    let numericTime = cleanTime.replace(/[AP]M/, '').trim();
    const parts = numericTime.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10) || 0;
    }
    if (parts.length >= 2) {
      minutes = parseInt(parts[1], 10) || 0;
    }
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const filterReservedVendors = (vendors, newBookingEndTime) => {
  if (!newBookingEndTime || !vendors || !vendors.length) return vendors;
  return vendors.filter(v => {
    if (v.reservedFrom && newBookingEndTime > new Date(v.reservedFrom)) {
      console.log(`[LocationService] Filtering out vendor ${v.name || v._id} due to overlap. New job ends: ${newBookingEndTime.toISOString()}, reservedFrom: ${new Date(v.reservedFrom).toISOString()}`);
      return false;
    }
    return true;
  });
};

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

const _buildVendorQuery = (filters = {}) => {
  const { VENDOR_STATUS } = require('../utils/constants');
  
  const checkCashLimit = filters.checkCashLimit;
  const serviceCategory = filters.service;
  const minWalletBalance = Number(filters.minWalletBalance) || 0;
  
  const queryFilters = { ...filters };
  delete queryFilters.checkCashLimit;
  delete queryFilters.service;
  delete queryFilters.city;
  delete queryFilters.scheduledDate;
  delete queryFilters.timeSlot;
  delete queryFilters.scheduledTime;
  delete queryFilters.minWalletBalance;

  const baseQuery = {
    approvalStatus: VENDOR_STATUS.APPROVED,
    isActive: true,
    isOnline: true, // Only fetch online vendors for bookings
    currentSocketId: { $ne: null }, // MUST be actively connected
    availability: { $in: ['AVAILABLE', 'BUSY'] },
    ...queryFilters
  };

  if (minWalletBalance > 0) {
    const requiredCredits = minWalletBalance / 10;
    baseQuery['wallet.credits'] = { $gte: requiredCredits };
  }

  if (filters.city) {
    baseQuery['address.city'] = { $regex: new RegExp(filters.city, 'i') };
  }

  if (serviceCategory) {
    const categoryRegex = new RegExp(`^${serviceCategory}$`, 'i');
    baseQuery.$or = [
      { categories: { $in: [categoryRegex] } },
      { service: { $in: [categoryRegex] } }
    ];
  }

  if (checkCashLimit) {
    baseQuery.$expr = { $lte: ["$wallet.dues", "$wallet.cashLimit"] };
  }

  return baseQuery;
};

/**
 * Find vendors within specified radius of a location
 */
const findNearbyVendors = async (centerLocation, radiusKm = 10, filters = {}) => {
  const Vendor = require('../models/Vendor');
  const Settings = require('../models/Settings');
  const { getNearbyVendorsFromCache, isRedisConnected } = require('./redisService');

  let newBookingEndTime = null;
  if (filters.scheduledDate && filters.timeSlot?.end) {
    newBookingEndTime = parseScheduledStartTime(filters.scheduledDate, filters.timeSlot.end);
  }

  if (!centerLocation || typeof centerLocation.lat !== 'number' || typeof centerLocation.lng !== 'number') {
    console.warn('[LocationService] Invalid coordinates. City fallback for:', filters.city);
    if (filters.city) {
      return findVendorsByCity(filters.city, filters, newBookingEndTime);
    }
    return [];
  }

  try {
    const { findZoneByLocation } = require('./zoneService');
    const matchedZone = await findZoneByLocation(centerLocation.lat, centerLocation.lng);

    if (!matchedZone) {
      console.log(`[LocationService] Booking location (${centerLocation.lat}, ${centerLocation.lng}) is outside all active Polygon Zones. Empty array returned for manual assignment.`);
      return [];
    }

    console.log(`[LocationService] Booking location matches Zone: ${matchedZone.name} (${matchedZone._id})`);

    const baseQuery = _buildVendorQuery(filters);
    const zoneQuery = {
      ...baseQuery,
      zoneId: matchedZone._id
    };

    let zoneVendors = await Vendor.find(zoneQuery)
      .select('name businessName phone address profilePhoto service rating isOnline availability geoLocation level currentLevel reservedFrom')
      .lean();

    console.log(`[LocationService] Found ${zoneVendors.length} vendors in Zone ${matchedZone.name}`);

    // Calculate distance for sorting and tracking reference
    zoneVendors = zoneVendors.map(vendor => {
      let distance = null;
      const vLat = vendor.location?.lat || vendor.address?.lat || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[1] : null);
      const vLng = vendor.location?.lng || vendor.address?.lng || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[0] : null);
      if (vLat && vLng) {
        distance = calculateDistance(centerLocation, { lat: vLat, lng: vLng });
      }
      return {
        ...vendor,
        distance: distance
      };
    });

    // Filter out conflicting and reserved vendors
    const reservedFiltered = filterReservedVendors(zoneVendors, newBookingEndTime);
    const conflictFiltered = await filterConflictVendors(reservedFiltered, filters.scheduledDate, filters.timeSlot, filters.scheduledTime);

    console.log(`[LocationService] Matched ${conflictFiltered.length} available vendors in zone: ${matchedZone.name}`);
    return conflictFiltered;
  } catch (error) {
    console.error('Find nearby vendors strict polygon error:', error);
    return [];
  }
};

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

/**
 * Find vendors in a specific city (fallback when coordinates are missing)
 * @param {string} city - City name
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of vendors
 */
const findVendorsByCity = async (city, filters = {}, newBookingEndTime = null) => {
  try {
    const Vendor = require('../models/Vendor');
    const baseQuery = _buildVendorQuery({ ...filters, city });

    // Dynamic Service-Wise Minimum Wallet Balance Check (REMOVED)
    // Requests now broadcast to everyone; balance check moved to accept phase.

    console.log(`[LocationService] City search query: ${JSON.stringify(baseQuery)}`);
    const vendors = await Vendor.find(baseQuery)
      .select('name businessName phone address location profilePhoto service rating isOnline availability settings level currentLevel reservedFrom')
      .limit(50);

    console.log(`[LocationService] Found ${vendors.length} vendors in city: ${city}`);
    const results = vendors.map(v => ({ ...v.toObject(), distance: null }));
    return filterReservedVendors(results, newBookingEndTime);
  } catch (error) {
    console.error('Find vendors by city error:', error);
    return [];
  }
};

const filterConflictVendors = async (vendors, scheduledDate, timeSlot, scheduledTime) => {
  if (!scheduledDate || (!timeSlot?.start && !scheduledTime) || !vendors || !vendors.length) {
    return vendors;
  }

  const mongoose = require('mongoose');
  const Booking = mongoose.model('Booking');
  const Worker = mongoose.model('Worker');

  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);

  const slotStart = timeSlot?.start;

  // Evaluate all vendors in parallel to speed up booking creation
  const evaluations = await Promise.all(
    vendors.map(async (vendor) => {
      try {
        const query = {
          vendorId: vendor._id,
          status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement', 'confirmed'] },
          scheduledDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };

        if (slotStart && scheduledTime) {
          query.$or = [
            { 'timeSlot.start': slotStart },
            { scheduledTime: scheduledTime }
          ];
        } else if (slotStart) {
          query['timeSlot.start'] = slotStart;
        } else {
          query.scheduledTime = scheduledTime;
        }

        const [onlineWorkersCount, activeBookingsCount] = await Promise.all([
          Worker.countDocuments({
            vendorId: vendor._id,
            status: 'ONLINE',
            isDeleted: { $ne: true }
          }),
          Booking.countDocuments(query)
        ]);

        const capacity = 1 + onlineWorkersCount;

        if (activeBookingsCount >= capacity) {
          console.log(`[LocationService] Filtering out vendor ${vendor.name || vendor._id} due to capacity limit. Active: ${activeBookingsCount}, Capacity: ${capacity}`);
          return null;
        }

        return vendor;
      } catch (err) {
        console.error(`[LocationService] Error evaluating conflict for vendor ${vendor._id}:`, err);
        return vendor; // fallback: keep vendor in case of error
      }
    })
  );

  return evaluations.filter(Boolean);
};

module.exports = {
  geocodeAddress,
  findNearbyVendors,
  findVendorsByCity,
  calculateDistance,
  getDistanceMatrix
};
