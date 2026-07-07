const PaintingSettings = require('../../models/PaintingSettings');
const PaintingSettingsVersion = require('../../models/PaintingSettingsVersion');
const User = require('../../models/User');

// Initial defaults to populate new settings profiles
const DEFAULT_SETTINGS_SNAPSHOT = {
  gstPercentage: 18,
  defaultWarrantyYears: 2,
  quotationValidityDays: 30,
  companyMarginPercent: 15,
  currency: 'INR',
  areaUnit: 'sqft',
  primerBuffer: 10,
  puttyBuffer: 10,
  paintBuffer: 10,
  textureBuffer: 10,
  waterproofingBuffer: 10,
  materialBufferPercent: 10,
  wastagePercent: 5,
  coverageBufferPercent: 10,
  roundingMethod: 'ROUND_UP',
  customBufferPercent: 0,
  activeLabourMethod: 'PER_SQFT',
  minArea: 50,
  maxArea: 50000,
  minLabourCharge: 1000,
  minMaterialCharge: 1000,
  emergencyBookingPremiumPercent: 20,
  expressBookingPremiumPercent: 15,
  mandatoryPhotos: false,
  mandatoryMeasurements: false,
  mandatoryBeforeImages: false,
  mandatoryAfterImages: false,
  mandatorySelfie: false,
  mandatoryUniform: false,
  mandatoryOtp: false,
  mandatoryMaterialUsage: false,
  coverageRules: [
    { surfaceType: 'Concrete', paintCategory: 'Economy', application: 'Interior', condition: 'Good', coverageSqftPerLiter: 80 },
    { surfaceType: 'POP', paintCategory: 'Premium', application: 'Interior', condition: 'Excellent', coverageSqftPerLiter: 90 },
    { surfaceType: 'Gypsum', paintCategory: 'Luxury', application: 'Interior', condition: 'Good', coverageSqftPerLiter: 95 }
  ],
  coatRules: [
    { category: 'Economy', defaultPrimerCoats: 1, defaultPaintCoats: 2, defaultFinishCoats: 2 },
    { category: 'Premium', defaultPrimerCoats: 1, defaultPaintCoats: 2, defaultFinishCoats: 2 },
    { category: 'Luxury', defaultPrimerCoats: 2, defaultPaintCoats: 2, defaultFinishCoats: 2 }
  ],
  futureRules: {}
};

// GET /api/admin/painting/settings/profiles
exports.getSettingsProfiles = async (req, res) => {
  try {
    const profiles = await PaintingSettings.find().populate('activeVersionId');
    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching settings profiles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings profiles', error: error.message });
  }
};

// GET /api/admin/painting/settings/profiles/:id
exports.getSettingsProfileById = async (req, res) => {
  try {
    const profile = await PaintingSettings.findById(req.params.id).populate('activeVersionId');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Settings profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile details', error: error.message });
  }
};

// POST /api/admin/painting/settings/profiles
exports.createSettingsProfile = async (req, res) => {
  try {
    const { profileName, profileCode, isDefault, snapshot } = req.body;

    const existing = await PaintingSettings.findOne({ profileCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A settings profile with this code already exists' });
    }

    if (isDefault) {
      await PaintingSettings.updateMany({}, { isDefault: false });
    }

    // 1. Create Profile Shell
    const profile = await PaintingSettings.create({
      profileName,
      profileCode,
      isDefault: isDefault || false,
      status: 'DRAFT',
      currentVersion: 1,
      publishedVersion: 0
    });

    // 2. Create Initial Settings Version Draft
    const initialSnapshot = { ...DEFAULT_SETTINGS_SNAPSHOT, ...snapshot };
    const versionDraft = await PaintingSettingsVersion.create({
      settingsId: profile._id,
      version: 1,
      snapshot: initialSnapshot,
      status: 'DRAFT',
      changeSummary: 'Initial profile setup draft',
      createdBy: req.user?.id
    });

    profile.activeVersionId = versionDraft._id;
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Settings profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error creating settings profile:', error);
    res.status(500).json({ success: false, message: 'Failed to create settings profile', error: error.message });
  }
};

// PUT /api/admin/painting/settings/profiles/:id/snapshot
exports.updateDraftSnapshot = async (req, res) => {
  try {
    const { id } = req.params;
    const { snapshot, changeSummary } = req.body;

    const profile = await PaintingSettings.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Find the current active version (draft)
    let version = await PaintingSettingsVersion.findOne({
      settingsId: id,
      version: profile.currentVersion
    });

    if (!version) {
      // If version snapshot doesn't exist, create it
      version = await PaintingSettingsVersion.create({
        settingsId: id,
        version: profile.currentVersion,
        snapshot: snapshot || DEFAULT_SETTINGS_SNAPSHOT,
        status: 'DRAFT',
        changeSummary: changeSummary || 'Initialized version snapshot',
        createdBy: req.user?.id
      });
    } else {
      if (version.status === 'PUBLISHED' || version.status === 'ARCHIVED') {
        // If current version is already locked, increment version to edit
        const nextVer = profile.currentVersion + 1;
        version = await PaintingSettingsVersion.create({
          settingsId: id,
          version: nextVer,
          snapshot: { ...version.snapshot, ...snapshot },
          status: 'DRAFT',
          changeSummary: changeSummary || `Draft changes for version ${nextVer}`,
          createdBy: req.user?.id
        });
        profile.currentVersion = nextVer;
      } else {
        // Update the current draft snapshot
        version.snapshot = { ...version.snapshot, ...snapshot };
        version.changeSummary = changeSummary || version.changeSummary;
        version.createdBy = req.user?.id;
        await version.save();
      }
    }

    profile.activeVersionId = version._id;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Draft settings updated successfully',
      data: version
    });
  } catch (error) {
    console.error('Error updating settings draft:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings draft', error: error.message });
  }
};

// POST /api/admin/painting/settings/profiles/:id/workflow
exports.transitionWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'SUBMIT', 'REVIEW', 'APPROVE', 'PUBLISH'
    const userId = req.user?.id;

    const profile = await PaintingSettings.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Settings profile not found' });
    }

    const version = await PaintingSettingsVersion.findOne({
      settingsId: id,
      version: profile.currentVersion
    });

    if (!version) {
      return res.status(404).json({ success: false, message: 'Active version snapshot not found' });
    }

    if (action === 'SUBMIT') {
      version.status = 'SUBMIT_FOR_REVIEW';
      profile.status = 'SUBMIT_FOR_REVIEW';
    } else if (action === 'REVIEW') {
      version.status = 'REVIEWED';
      version.reviewedBy = userId;
      version.reviewedAt = new Date();
      version.reviewNotes = notes || '';
      profile.status = 'REVIEWED';
    } else if (action === 'APPROVE') {
      version.status = 'APPROVED';
      version.approvedBy = userId;
      version.approvedAt = new Date();
      version.approvalNotes = notes || '';
      profile.status = 'APPROVED';
    } else if (action === 'PUBLISH') {
      // 1. Archive other published versions for this profile
      await PaintingSettingsVersion.updateMany(
        { settingsId: id, status: 'PUBLISHED' },
        { status: 'ARCHIVED', isPublished: false }
      );

      // 2. Publish this version
      version.status = 'PUBLISHED';
      version.isPublished = true;
      version.publishedBy = userId;
      version.publishedAt = new Date();
      await version.save();

      profile.status = 'PUBLISHED';
      profile.publishedVersion = version.version;
      profile.activeVersionId = version._id;

      // 3. If marked as default profile, reset others
      if (profile.isDefault) {
        await PaintingSettings.updateMany({ _id: { $ne: id } }, { isDefault: false });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid workflow action' });
    }

    await version.save();
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Settings transitioned to status: ${version.status}`,
      profile,
      version
    });
  } catch (error) {
    console.error('Error transitioning settings workflow:', error);
    res.status(500).json({ success: false, message: 'Failed to process workflow transition', error: error.message });
  }
};

// POST /api/admin/painting/settings/profiles/:id/rollback
exports.rollbackSettingsVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetVersion, reason } = req.body;

    const profile = await PaintingSettings.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Find the snapshot of target version
    const sourceVersion = await PaintingSettingsVersion.findOne({
      settingsId: id,
      version: targetVersion
    });

    if (!sourceVersion) {
      return res.status(404).json({ success: false, message: `Version ${targetVersion} snapshot not found` });
    }

    // Increment currentVersion and create a NEW version that copies the target snapshot
    const nextVer = profile.currentVersion + 1;
    const rolledBackVersion = await PaintingSettingsVersion.create({
      settingsId: id,
      version: nextVer,
      snapshot: sourceVersion.snapshot,
      status: 'DRAFT',
      changeSummary: `Rollback target restoration to version ${targetVersion}`,
      createdBy: req.user?.id,
      rollbackFromVersion: targetVersion,
      approvalNotes: `Rollback requested for reason: ${reason || 'N/A'}`
    });

    profile.currentVersion = nextVer;
    profile.status = 'DRAFT';
    profile.activeVersionId = rolledBackVersion._id;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Rollback configured. Generated version ${nextVer} (draft) from version ${targetVersion}`,
      data: rolledBackVersion
    });
  } catch (error) {
    console.error('Error rolling back settings version:', error);
    res.status(500).json({ success: false, message: 'Failed to process rollback', error: error.message });
  }
};

// GET /api/admin/painting/settings/profiles/:id/history
exports.getSettingsProfileHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await PaintingSettingsVersion.find({ settingsId: id })
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('publishedBy', 'name')
      .sort({ version: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings history', error: error.message });
  }
};
