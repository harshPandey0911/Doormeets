const SubCategory = require('../../models/SubCategory');
const { validationResult } = require('express-validator');

exports.createSubCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const subCategory = await SubCategory.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: subCategory });
  } catch (error) {
    console.error('Create subcategory error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Subcategory with this title already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getAllSubCategories = async (req, res) => {
  try {
    const query = {};
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }

    const subCategories = await SubCategory.find(query)
      .populate('categoryId', 'title slug status')
      .sort({ createdAt: -1 });

    // Filter out subcategories where parent category is deleted/soft-deleted or not found
    const filteredSubCategories = subCategories.filter(sc => sc.categoryId && sc.categoryId.status !== 'deleted');

    res.status(200).json({ success: true, data: filteredSubCategories });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('categoryId', 'title slug');
    
    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'SubCategory not found' });
    }
    
    res.status(200).json({ success: true, data: subCategory });
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'SubCategory not found' });
    }

    res.status(200).json({ success: true, data: subCategory });
  } catch (error) {
    console.error('Update subcategory error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Subcategory with this title already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'SubCategory not found' });
    }
    res.status(200).json({ success: true, message: 'SubCategory deleted' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
