const Profession = require('../../models/Profession');

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

    // Update fields
    if (name) profession.name = name;
    if (description !== undefined) profession.description = description;
    if (status) profession.status = status;
    if (categories !== undefined) profession.categories = categories;

    await profession.save();

    res.status(200).json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profession', error: error.message });
  }
};

exports.deleteProfession = async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    if (!profession) {
      return res.status(404).json({ success: false, message: 'Profession not found' });
    }

    profession.status = 'deleted';
    await profession.save();

    res.status(200).json({ success: true, message: 'Profession deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete profession' });
  }
};
