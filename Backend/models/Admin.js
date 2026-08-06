const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ADMIN_ROLES, PERMISSION_KEYS } = require('../utils/constants');

const permissionSchema = new mongoose.Schema({
  key: {
    type: String,
    enum: PERMISSION_KEYS,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false
  },

  // Roles: SUPER_ADMIN has full access, CITY_ADMIN is scoped. Custom roles like MANAGER or SUPPORT are allowed.
  // Legacy values 'super_admin' and 'admin' are treated as SUPER_ADMIN / CITY_ADMIN for backward compat
  role: {
    type: String,
    default: 'ZONE_ADMIN'
  },

  // Zones this admin is assigned to (empty = Super Admin = all zones)
  assignedZones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  }],
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    default: null
  },
  zoneName: {
    type: String,
    default: ''
  },
  // Cities this admin is assigned to (empty = Super Admin = all cities)
  assignedCities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],

  // Vendors this city admin is allowed to access
  assignedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],

  // Legacy single cityId field — kept for backward compatibility
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    default: null
  },
  cityName: {
    type: String,
    default: ''
  },

  // Granular permission keys
  permissions: [permissionSchema],

  // Hard-coded approval flags (Super Admin can delegate these)
  canApproveVendors: {
    type: Boolean,
    default: false
  },
  canApproveWorkers: {
    type: Boolean,
    default: false
  },

  // Booking Control: OFF (default) = bookings in this admin's zone auto-assign to a vendor as
  // today. ON = every booking in this admin's zone is routed to the manual-assign queue
  // ('pending_admin') for this admin to review and assign a vendor themselves. See
  // controllers/bookingControllers/userBookingController.js createBooking.
  bookingControlEnabled: {
    type: Boolean,
    default: false
  },

  // Approval Control: OFF (default) = this admin's approval-gated actions (vendor approval,
  // KYC, category/brand proposals, vendor deletion) create a CityAdminRequest for Super Admin
  // review, exactly as today. ON = those actions apply immediately, no request created. See
  // utils/approvalInterceptor.js.
  approvalControlEnabled: {
    type: Boolean,
    default: false
  },

  // Audit
  createdBySuperAdmin: {
    type: Boolean,
    default: false
  },

  profilePhoto: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  wallet: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Prevent deletion of protected admin accounts at Mongoose Schema level
const PROTECTED_EMAILS = ['admin@harsh.com', 'admin@doormeets.com', 'admin@admin.com'];

adminSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], async function (next) {
  try {
    const filter = this.getFilter();
    if (filter) {
      const doc = await this.model.findOne(filter);
      if (doc && PROTECTED_EMAILS.includes(doc.email?.toLowerCase())) {
        return next(new Error(`Protected admin account (${doc.email}) cannot be deleted.`));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if admin is a Super Admin (handles both legacy and new role values)
 */
adminSchema.methods.isSuperAdmin = function () {
  return this.role === 'SUPER_ADMIN' || this.role === 'super_admin';
};

/**
 * Check if admin has a specific permission
 */
adminSchema.methods.hasPermission = function (key) {
  if (this.isSuperAdmin()) return true; // Super Admin always has all permissions
  if (this.role === 'ZONE_ADMIN' || this.role === 'zone_admin' || this.role === 'CITY_ADMIN') {
    if (key === 'view_vendors' || key === 'view_vendors_zone') return true;
  }
  const perm = this.permissions.find(p => p.key === key);
  return perm ? perm.enabled : false;
};

/**
 * Check if admin can access a specific city
 */
adminSchema.methods.canAccessCity = function (cityId) {
  if (this.isSuperAdmin()) return true; // Super Admin can access all cities
  if (!cityId) return true; // No city filter means accessible
  const cityStr = cityId.toString();
  return this.assignedCities.some(c => c.toString() === cityStr);
};

/**
 * Check if admin can access a specific zone
 */
adminSchema.methods.canAccessZone = function (zoneId) {
  if (this.isSuperAdmin()) return true; // Super Admin can access all zones
  if (!zoneId) return true;
  const zoneStr = zoneId.toString();
  if (this.zoneId && this.zoneId.toString() === zoneStr) return true;
  return this.assignedZones && this.assignedZones.some(z => z.toString() === zoneStr);
};

module.exports = mongoose.model('Admin', adminSchema);
