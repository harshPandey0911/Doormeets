const Zone = require('../models/Zone');

/**
 * Calculates distance between two coordinates using the Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates the centroid of a GeoJSON Polygon (first ring)
 */
const calculatePolygonCentroid = (polygonCoordinates) => {
  if (!polygonCoordinates || !polygonCoordinates[0] || polygonCoordinates[0].length === 0) {
    return null;
  }
  // The first ring represents the exterior boundary of the polygon
  const exteriorRing = polygonCoordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  // Average the coordinates. In GeoJSON, a coordinate is [lng, lat]
  for (let i = 0; i < exteriorRing.length; i++) {
    // Standard GeoJSON polygons repeat the first point at the end, so we can ignore the last point if it repeats the first
    if (i === exteriorRing.length - 1 && exteriorRing[i][0] === exteriorRing[0][0] && exteriorRing[i][1] === exteriorRing[0][1]) {
      continue;
    }
    sumLng += exteriorRing[i][0];
    sumLat += exteriorRing[i][1];
    count++;
  }

  if (count === 0) return null;

  return {
    lng: sumLng / count,
    lat: sumLat / count
  };
};

/**
 * Finds if a point [lng, lat] falls within any active zone polygon
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object|null>} The matched zone or null
 */
const findZoneByLocation = async (lat, lng) => {
  try {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }

    const matchedZone = await Zone.findOne({
      isActive: true,
      coordinates: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON format [longitude, latitude]
          }
        }
      }
    });

    return matchedZone;
  } catch (error) {
    console.error('[ZoneService] findZoneByLocation error:', error);
    return null;
  }
};

/**
 * Finds the nearest active zone if a point is outside all zones
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object|null>} Nearest zone details and distance or null
 */
const findNearestZone = async (lat, lng) => {
  try {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }

    const activeZones = await Zone.find({ isActive: true });
    if (activeZones.length === 0) {
      return null;
    }

    let nearestZone = null;
    let minDistance = Infinity;

    for (const zone of activeZones) {
      const centroid = calculatePolygonCentroid(zone.coordinates.coordinates);
      if (!centroid) continue;

      const distance = calculateDistance(lat, lng, centroid.lat, centroid.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = {
          _id: zone._id,
          name: zone.name,
          distanceKm: parseFloat(distance.toFixed(2))
        };
      }
    }

    return nearestZone;
  } catch (error) {
    console.error('[ZoneService] findNearestZone error:', error);
    return null;
  }
};

module.exports = {
  findZoneByLocation,
  findNearestZone,
  calculatePolygonCentroid
};
