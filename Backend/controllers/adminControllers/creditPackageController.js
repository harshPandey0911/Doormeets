const CreditPackage = require('../../models/CreditPackage');

// Get all packages (Admin)
exports.getAllPackagesAdmin = async (req, res) => {
  try {
    const packages = await CreditPackage.find().sort({ price: 1 }).populate('createdBy', 'name email');
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const Settings = require('../../models/Settings');

// Get all active packages (Vendor)
exports.getActivePackages = async (req, res) => {
  try {
    const packages = await CreditPackage.find({ isActive: true }).sort({ price: 1 });
    const settings = await Settings.findOne();
    const gst = settings && settings.platformGST !== undefined ? settings.platformGST : 18;
    
    res.status(200).json({ success: true, count: packages.length, data: packages, gst });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new package (Admin)
exports.createPackage = async (req, res) => {
  try {
    const { name, creditsAmount, price, isActive } = req.body;
    
    if (!name || !creditsAmount || !price) {
      return res.status(400).json({ success: false, message: 'Please provide name, creditsAmount, and price' });
    }

    const newPackage = await CreditPackage.create({
      name,
      creditsAmount,
      price,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a package (Admin)
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    let pkg = await CreditPackage.findById(id);

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    pkg = await CreditPackage.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a package (Admin)
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await CreditPackage.findById(id);

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    await pkg.deleteOne();
    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
