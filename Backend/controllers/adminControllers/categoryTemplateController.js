const CategoryTemplate = require('../../models/CategoryTemplate');

exports.getAllTemplates = async (req, res, next) => {
  try {
    const templates = await CategoryTemplate.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    next(error);
  }
};

exports.getTemplateByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const template = await CategoryTemplate.findOne({ code });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template with code '${code}' not found`
      });
    }
    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schema, blocks, name } = req.body;

    const template = await CategoryTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (name) template.name = name;
    if (schema) template.schema = schema;
    if (blocks) template.blocks = blocks;

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    next(error);
  }
};
