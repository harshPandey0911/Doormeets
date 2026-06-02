/**
 * Application Constants
 */

// User Roles
const USER_ROLES = {
  USER: 'USER',
  VENDOR: 'VENDOR',
  WORKER: 'WORKER',
  ADMIN: 'ADMIN'
};

// Admin Roles (sub-roles within admin)
const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CITY_ADMIN: 'CITY_ADMIN'
};

// Permission Keys for City Admins
const PERMISSION_KEYS = [
  'view_dashboard',
  'view_vendors',
  'view_workers',
  'view_users',
  'view_bookings',
  'view_analytics',
  'view_payments',
  'view_reports',
  'manage_homepage',      // can edit homepage content for their city
  'manage_pricing',       // can override local pricing for their city
  'manage_banners',       // can manage offer banners for their city
  'manage_support',       // can respond to support tickets
  'manage_training',      // can manage training content
  'manage_notifications', // can send push notifications
  'propose_categories',   // can propose new categories (needs super admin approval)
  'propose_brands',       // can propose new brands (needs super admin approval)
  'view_reviews',
  'view_settlements',
  'view_commissions',
  'manage_plans',
  'view_subscriptions',
  'view_police_verification',
  'view_vendor_requests',
  'view_vendor_services',
  'view_vendor_parts',
  'manage_stock',
  'view_scrap_items',
  'manage_promos',
];


// Token Types
const TOKEN_TYPES = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

// Vendor Approval Status
const VENDOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  TRAINING_PENDING: 'training_pending', // Docs approved, training not yet done
  TRAINING_FAILED: 'training_failed'    // Failed training (score < 50%)
};

// Training Levels
const TRAINING_LEVELS = {
  L1: 'L1', // 80%+ (premium — priority job allocation)
  L2: 'L2', // 50-79% (standard)
  L3: 'L3'  // <50% (must retrain, restricted)
};

// Training Score Thresholds
const TRAINING_SCORE_THRESHOLDS = {
  L1_MIN: 80,
  L2_MIN: 50
};

// Training Status
const TRAINING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Worker Status
const WORKER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY'
};

// Booking Status
const BOOKING_STATUS = {
  SEARCHING: 'searching', // Initial search phase
  REQUESTED: 'requested', // Waiting for vendor to accept
  AWAITING_PAYMENT: 'awaiting_payment', // Accepted by vendor, waiting for user payment
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACCEPTED: 'accepted',
  ASSIGNED: 'assigned',
  JOURNEY_STARTED: 'journey_started',
  VISITED: 'visited',
  IN_PROGRESS: 'in_progress',
  WORK_DONE: 'work_done',
  COMPLETED: 'completed',
  BIDDING: 'bidding', // Open for bidding
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  NO_VENDORS: 'no_vendors'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  COLLECTED_BY_VENDOR: 'collected_by_vendor',
  PLAN_COVERED: 'plan_covered', // For plan_benefit bookings until bill is finalized
  COMPLETED: 'completed'
};

// Service Status
const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
  COMING_SOON: 'coming_soon'
};

// Bill Status
const BILL_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

module.exports = {
  USER_ROLES,
  ADMIN_ROLES,
  PERMISSION_KEYS,
  TOKEN_TYPES,
  VENDOR_STATUS,
  WORKER_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SERVICE_STATUS,
  BILL_STATUS,
  TRAINING_LEVELS,
  TRAINING_SCORE_THRESHOLDS,
  TRAINING_STATUS
};
