const Profession = require('../../models/Profession');
const Vendor = require('../../models/Vendor');

exports.getAllProfessions = async (req, res) => {
  try {
    const professions = await Profession.find({ status: { $ne: 'deleted' } })
      .populate('categories', 'title _id')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: professions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professions',
      error: error.message
    });
  }
};

exports.getProfessionById = async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id).populate('categories', 'title _id');
    if (!profession || profession.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Profession not found' });
    }
    res.status(200).json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profession' });
  }
};

exports.createProfession = async (req, res) => {
  try {
    const { name, description, status, categories } = req.body;
    
    // Check if name already exists
    const existing = await Profession.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (existing) {
      if (existing.status !== 'deleted') {
        return res.status(400).json({ success: false, message: 'Profession with this name already exists' });
      } else {
        // Revive deleted profession
        existing.status = status || 'active';
        existing.description = description;
        existing.categories = categories || [];
        await existing.save();
        return res.status(200).json({ success: true, data: existing, message: 'Profession revived successfully' });
      }
    }

    const profession = await Profession.create({
      name,
      description,
      status: status || 'active',
      categories: categories || []
    });

    res.status(201).json({ success: true, data: profession });
  } catch (error) {
    console.error('CREATE PROFESSION ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to create profession', error: error.message, stack: error.stack });
  }
};

exports.updateProfession = async (req, res) => {
  try {
    const { name, description, status, categories } = req.body;
    
    let profession = await Profession.findById(req.params.id);
    if (!profession || profession.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Profession not found' });
    }

    // Track if categories changed
    const categoriesChanged = categories !== undefined &&
      JSON.stringify([...(profession.categories || [])].map(String).sort()) !==
      JSON.stringify([...(categories || [])].map(String).sort());

    // Update fields
    if (name) profession.name = name;
    if (description !== undefined) profession.description = description;
    if (status) profession.status = status;
    if (categories !== undefined) profession.categories = categories;

    await profession.save();

    // Sync updated categories to all vendors who have this profession
    if (categoriesChanged) {
      const professionId = profession._id;
      const newCategoryIds = (categories || []).map(c => c.toString());

      // Find all vendors who have this profession
      const vendors = await Vendor.find({ professions: professionId }).select('_id professions categories service');
      
      let updatedCount = 0;
      for (const vendor of vendors) {
        // Collect categories from ALL of vendor's professions (not just this one)
        const allProfessionIds = (vendor.professions || []).map(p => p.toString());
        
        // Fetch all professions of this vendor to build complete category list
        const allProfessions = await Profession.find({ 
          _id: { $in: allProfessionIds }, 
          status: { $ne: 'deleted' } 
        }).select('categories');

        // Merge categories from all professions
        const mergedCategories = new Set();
        for (const prof of allProfessions) {
          (prof.categories || []).forEach(catId => mergedCategories.add(catId.toString()));
        }

        // Also keep any manually added categories (not from any profession)
        // by preserving categories that aren't from any of the vendor's professions
        // For simplicity, replace with the full profession-derived list
        const finalCategories = Array.from(mergedCategories);

        await Vendor.findByIdAndUpdate(vendor._id, {
          $set: {
            categories: finalCategories,
            service: finalCategories
          }
        });
        updatedCount++;
      }

      console.log(`[updateProfession] Synced categories to ${updatedCount} vendors for profession "${profession.name}"`);
    }

    res.status(200).json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profession', error: error.message });
  }
};

exports.deleteProfession = async (req, res) => {
  try {
    const profession = await Profession.findByIdAndDelete(req.params.id);
    if (!profession) {
      return res.status(404).json({ success: false, message: 'Profession not found' });
    }

    res.status(200).json({ success: true, message: 'Profession deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete profession' });
  }
};
