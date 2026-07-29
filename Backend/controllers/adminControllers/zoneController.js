const Zone = require('../../models/Zone');

/**
 * Create a new service zone
 */
const createZone = async (req, res) => {
  try {
    const { name, coordinates, isActive, displayOrder } = req.body;

    if (!name || !coordinates || !coordinates.length) {
      return res.status(400).json({ success: false, message: 'Name and coordinates polygon are required' });
    }

    // Verify coordinates is a valid polygon array structure
    // Expected: [[[lng, lat], [lng, lat], [lng, lat], ...]]
    if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0]) || coordinates[0].length < 3) {
      return res.status(400).json({ success: false, message: 'Coordinates must be a valid polygon with at least 3 points' });
    }

    // Ensure the polygon is closed (first point matches last point)
    const points = coordinates[0];
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      points.push([firstPoint[0], firstPoint[1]]); // close it
    }

    const zone = await Zone.create({
      name,
      coordinates: {
        type: 'Polygon',
        coordinates: [points]
      },
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
      createdBy: req.user?.id
    });

    res.status(201).json({ success: true, message: 'Zone created successfully', zone });
  } catch (error) {
    console.error('Create Zone Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Zone name must be unique' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all zones (optionally filter by active status)
 */
const getZones = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const zones = await Zone.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: zones.length, zones });
  } catch (error) {
    console.error('Get Zones Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get single zone by ID
 */
const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.status(200).json({ success: true, zone });
  } catch (error) {
    console.error('Get Zone by ID Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a zone
 */
const updateZone = async (req, res) => {
  try {
    const { name, coordinates, isActive, displayOrder } = req.body;
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    if (name) zone.name = name;
    if (isActive !== undefined) zone.isActive = isActive;
    if (displayOrder !== undefined) zone.displayOrder = displayOrder;

    if (coordinates) {
      if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0]) || coordinates[0].length < 3) {
        return res.status(400).json({ success: false, message: 'Coordinates must be a valid polygon' });
      }

      const points = coordinates[0];
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        points.push([firstPoint[0], firstPoint[1]]);
      }

      zone.coordinates = {
        type: 'Polygon',
        coordinates: [points]
      };
    }

    await zone.save();

    res.status(200).json({ success: true, message: 'Zone updated successfully', zone });
  } catch (error) {
    console.error('Update Zone Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a zone
 */
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Delete Zone Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createZone,
  getZones,
  getZoneById,
  updateZone,
  deleteZone
};
