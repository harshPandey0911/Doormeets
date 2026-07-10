const VendorDashboardContent = require('../../models/VendorDashboardContent');

// Helper to get or create the singleton doc
const getDoc = async () => {
  let doc = await VendorDashboardContent.findOne();
  if (!doc) doc = await VendorDashboardContent.create({});
  return doc;
};

/** GET /admin/vendor-dashboard — get full content */
const getVendorDashboard = async (req, res) => {
  try {
    const doc = await getDoc();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BANNERS & MEDIA ──────────────────────────────────────────────────────────
const addBanner = async (req, res) => {
  try {
    const doc = await getDoc();
    doc.banners.push(req.body);
    await doc.save();
    res.json({ success: true, data: doc.banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const doc = await getDoc();
    const item = doc.banners.id(bannerId);
    if (!item) return res.status(404).json({ success: false, message: 'Banner/Media not found' });
    Object.assign(item, req.body);
    await doc.save();
    res.json({ success: true, data: doc.banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const doc = await getDoc();
    doc.banners = doc.banners.filter(b => b._id.toString() !== bannerId);
    await doc.save();
    res.json({ success: true, data: doc.banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVendorDashboard,
  addBanner,
  updateBanner,
  deleteBanner,
};
