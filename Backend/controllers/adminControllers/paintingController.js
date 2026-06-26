const PaintBrand = require('../../models/PaintBrand');
const PaintProduct = require('../../models/PaintProduct');
const LabourRate = require('../../models/LabourRate');
const PaintingQuotation = require('../../models/PaintingQuotation');

// ==========================================
// PAINT BRANDS CONTROLLER
// ==========================================

exports.getBrands = async (req, res) => {
  try {
    const brands = await PaintBrand.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    console.error('Error fetching paint brands:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands', error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const brand = await PaintBrand.create(req.body);
    res.status(201).json({ success: true, message: 'Paint brand created successfully', data: brand });
  } catch (error) {
    console.error('Error creating paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to create brand', error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await PaintBrand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.status(200).json({ success: true, message: 'Paint brand updated successfully', data: brand });
  } catch (error) {
    console.error('Error updating paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to update brand', error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await PaintBrand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    // Also delete associated products
    await PaintProduct.deleteMany({ brandId: req.params.id });
    res.status(200).json({ success: true, message: 'Paint brand and its products deleted successfully' });
  } catch (error) {
    console.error('Error deleting paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to delete brand', error: error.message });
  }
};

// ==========================================
// PAINT PRODUCTS CONTROLLER
// ==========================================

exports.getProducts = async (req, res) => {
  try {
    const products = await PaintProduct.find().populate('brandId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error fetching paint products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await PaintProduct.create(req.body);
    const populated = await PaintProduct.findById(product._id).populate('brandId');
    res.status(201).json({ success: true, message: 'Paint product created successfully', data: populated });
  } catch (error) {
    console.error('Error creating paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await PaintProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('brandId');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Paint product updated successfully', data: product });
  } catch (error) {
    console.error('Error updating paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await PaintProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Paint product deleted successfully' });
  } catch (error) {
    console.error('Error deleting paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

// ==========================================
// LABOUR RATES CONTROLLER
// ==========================================

exports.getLabourRates = async (req, res) => {
  try {
    const rates = await LabourRate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rates.length, data: rates });
  } catch (error) {
    console.error('Error fetching labour rates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour rates', error: error.message });
  }
};

exports.createLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.create(req.body);
    res.status(201).json({ success: true, message: 'Labour rate created successfully', data: rate });
  } catch (error) {
    console.error('Error creating labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to create labour rate', error: error.message });
  }
};

exports.updateLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rate) return res.status(404).json({ success: false, message: 'Labour rate not found' });
    res.status(200).json({ success: true, message: 'Labour rate updated successfully', data: rate });
  } catch (error) {
    console.error('Error updating labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to update labour rate', error: error.message });
  }
};

exports.deleteLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.findByIdAndDelete(req.params.id);
    if (!rate) return res.status(404).json({ success: false, message: 'Labour rate not found' });
    res.status(200).json({ success: true, message: 'Labour rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to delete labour rate', error: error.message });
  }
};

// ==========================================
// PAINTING QUOTATIONS & CALCULATIONS CONTROLLER
// ==========================================

exports.getQuotations = async (req, res) => {
  try {
    const quotations = await PaintingQuotation.find()
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: error.message });
  }
};

exports.createQuotation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      interiorArea = 0,
      exteriorArea = 0,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      discount = 0,
      gstPercentage = 18
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Phone are required.' });
    }

    let paintCost = 0;
    let puttyCost = 0;
    let primerCost = 0;
    let labourCost = 0;

    let interiorPaint = null;
    let exteriorPaint = null;
    let labourRate = null;

    // 1. Fetch Labour rate
    if (labourId) {
      labourRate = await LabourRate.findById(labourId);
      if (labourRate) {
        labourCost = (Number(interiorArea) + Number(exteriorArea)) * labourRate.pricePerSqft;
      }
    }

    // 2. Fetch Interior Paint product and calculate its cost + consumables (Putty/Primer)
    if (interiorPaintId && Number(interiorArea) > 0) {
      interiorPaint = await PaintProduct.findById(interiorPaintId);
      if (interiorPaint) {
        paintCost += (Number(interiorArea) / interiorPaint.coverage) * interiorPaint.price;

        // Consumables: If putty or primer is included, calculate them dynamically from the same brand
        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PUTTY',
            application: 'INTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(interiorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PRIMER',
            application: 'INTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(interiorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // 3. Fetch Exterior Paint and calculate cost + consumables
    if (exteriorPaintId && Number(exteriorArea) > 0) {
      exteriorPaint = await PaintProduct.findById(exteriorPaintId);
      if (exteriorPaint) {
        paintCost += (Number(exteriorArea) / exteriorPaint.coverage) * exteriorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PUTTY',
            application: 'EXTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(exteriorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PRIMER',
            application: 'EXTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(exteriorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // Round calculations to 2 decimal places
    paintCost = parseFloat(paintCost.toFixed(2));
    puttyCost = parseFloat(puttyCost.toFixed(2));
    primerCost = parseFloat(primerCost.toFixed(2));
    labourCost = parseFloat(labourCost.toFixed(2));

    const baseSum = paintCost + puttyCost + primerCost + labourCost;
    const netSum = Math.max(0, baseSum - Number(discount));
    const gstVal = parseFloat((netSum * (Number(gstPercentage) / 100)).toFixed(2));
    const grandTotal = parseFloat((netSum + gstVal).toFixed(2));

    const quotation = await PaintingQuotation.create({
      customerId: customerId || null,
      customerName,
      customerPhone,
      interiorArea,
      exteriorArea,
      interiorPaintId: interiorPaintId || null,
      exteriorPaintId: exteriorPaintId || null,
      labourId: labourId || null,
      calculation: {
        paintCost,
        puttyCost,
        primerCost,
        labourCost,
        discount: Number(discount),
        gst: gstVal,
        grandTotal
      }
    });

    const populated = await PaintingQuotation.findById(quotation._id)
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId');

    res.status(201).json({ success: true, message: 'Painting quotation created successfully', data: populated });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: error.message });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      interiorArea = 0,
      exteriorArea = 0,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      discount = 0,
      gstPercentage = 18
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Phone are required.' });
    }

    let paintCost = 0;
    let puttyCost = 0;
    let primerCost = 0;
    let labourCost = 0;

    let interiorPaint = null;
    let exteriorPaint = null;
    let labourRate = null;

    // 1. Fetch Labour rate
    if (labourId) {
      labourRate = await LabourRate.findById(labourId);
      if (labourRate) {
        labourCost = (Number(interiorArea) + Number(exteriorArea)) * labourRate.pricePerSqft;
      }
    }

    // 2. Fetch Interior Paint product and calculate its cost + consumables (Putty/Primer)
    if (interiorPaintId && Number(interiorArea) > 0) {
      interiorPaint = await PaintProduct.findById(interiorPaintId);
      if (interiorPaint) {
        paintCost += (Number(interiorArea) / interiorPaint.coverage) * interiorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PUTTY',
            application: 'INTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(interiorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PRIMER',
            application: 'INTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(interiorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // 3. Fetch Exterior Paint and calculate cost + consumables
    if (exteriorPaintId && Number(exteriorArea) > 0) {
      exteriorPaint = await PaintProduct.findById(exteriorPaintId);
      if (exteriorPaint) {
        paintCost += (Number(exteriorArea) / exteriorPaint.coverage) * exteriorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PUTTY',
            application: 'EXTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(exteriorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PRIMER',
            application: 'EXTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(exteriorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // Round calculations to 2 decimal places
    paintCost = parseFloat(paintCost.toFixed(2));
    puttyCost = parseFloat(puttyCost.toFixed(2));
    primerCost = parseFloat(primerCost.toFixed(2));
    labourCost = parseFloat(labourCost.toFixed(2));

    const baseSum = paintCost + puttyCost + primerCost + labourCost;
    const netSum = Math.max(0, baseSum - Number(discount));
    const gstVal = parseFloat((netSum * (Number(gstPercentage) / 100)).toFixed(2));
    const grandTotal = parseFloat((netSum + gstVal).toFixed(2));

    const quotation = await PaintingQuotation.findByIdAndUpdate(
      req.params.id,
      {
        customerId: customerId || null,
        customerName,
        customerPhone,
        interiorArea,
        exteriorArea,
        interiorPaintId: interiorPaintId || null,
        exteriorPaintId: exteriorPaintId || null,
        labourId: labourId || null,
        calculation: {
          paintCost,
          puttyCost,
          primerCost,
          labourCost,
          discount: Number(discount),
          gst: gstVal,
          grandTotal
        }
      },
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const populated = await PaintingQuotation.findById(quotation._id)
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId');

    res.status(200).json({ success: true, message: 'Painting quotation updated successfully', data: populated });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation', error: error.message });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await PaintingQuotation.findByIdAndDelete(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quotation', error: error.message });
  }
};
