const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../../controllers/adminControllers/settingsController');

router.get('/config', getPublicSettings);

router.get('/check-zone', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const { findZoneByLocation, findNearestZone } = require('../../services/zoneService');
    const matchedZone = await findZoneByLocation(parseFloat(lat), parseFloat(lng));

    let zoneStatus = { inZone: true };
    if (matchedZone) {
      zoneStatus.inZone = true;
      zoneStatus.zoneName = matchedZone.name;
    } else {
      zoneStatus.inZone = false;
      const nearestZone = await findNearestZone(parseFloat(lat), parseFloat(lng));
      if (nearestZone) {
        zoneStatus.nearestZone = {
          name: nearestZone.name,
          distanceKm: nearestZone.distanceKm
        };
      }
    }

    res.status(200).json({ success: true, zoneStatus });
  } catch (error) {
    console.error('Check zone status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
