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

// ─── BANNERS ──────────────────────────────────────────────────────────────────
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
    if (!item) return res.status(404).json({ success: false, message: 'Banner not found' });
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

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const addAnnouncement = async (req, res) => {
  try {
    const doc = await getDoc();
    doc.announcements.push(req.body);
    await doc.save();
    res.json({ success: true, data: doc.announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    const item = doc.announcements.id(id);
    if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
    Object.assign(item, req.body);
    await doc.save();
    res.json({ success: true, data: doc.announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    doc.announcements = doc.announcements.filter(a => a._id.toString() !== id);
    await doc.save();
    res.json({ success: true, data: doc.announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VIDEOS ───────────────────────────────────────────────────────────────────
const addVideo = async (req, res) => {
  try {
    const doc = await getDoc();
    doc.videos.push(req.body);
    await doc.save();
    res.json({ success: true, data: doc.videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    const item = doc.videos.id(id);
    if (!item) return res.status(404).json({ success: false, message: 'Video not found' });
    Object.assign(item, req.body);
    await doc.save();
    res.json({ success: true, data: doc.videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    doc.videos = doc.videos.filter(v => v._id.toString() !== id);
    await doc.save();
    res.json({ success: true, data: doc.videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── QUICK LINKS ──────────────────────────────────────────────────────────────
const addQuickLink = async (req, res) => {
  try {
    const doc = await getDoc();
    doc.quickLinks.push(req.body);
    await doc.save();
    res.json({ success: true, data: doc.quickLinks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    const item = doc.quickLinks.id(id);
    if (!item) return res.status(404).json({ success: false, message: 'Quick link not found' });
    Object.assign(item, req.body);
    await doc.save();
    res.json({ success: true, data: doc.quickLinks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getDoc();
    doc.quickLinks = doc.quickLinks.filter(l => l._id.toString() !== id);
    await doc.save();
    res.json({ success: true, data: doc.quickLinks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVendorDashboard,
  addBanner, updateBanner, deleteBanner,
  addAnnouncement, updateAnnouncement, deleteAnnouncement,
  addVideo, updateVideo, deleteVideo,
  addQuickLink, updateQuickLink, deleteQuickLink,
};
