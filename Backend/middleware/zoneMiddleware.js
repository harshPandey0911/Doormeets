const { getAdminZoneScope } = require('../utils/adminFilterHelper');

/**
 * Zone-scoping middleware
 * ───────────────────────
 * Thin wrappers around utils/adminFilterHelper.js so zone logic lives in exactly one place
 * (the helper) and every controller/route reuses it instead of re-deriving zone scope itself.
 */

/**
 * Attaches req.zoneScope = { isSuperAdmin, isZoneAdmin, zoneIds } derived from the already-
 * authenticated admin on req.user (authenticate() runs first and loads it — no extra DB call
 * here). Mount once, after authenticate, on every /api/admin/* route.
 */
const applyZoneFilter = async (req, res, next) => {
  try {
    // Only meaningful for admin requests — skip silently for user/vendor/worker tokens so this
    // can sit safely on shared route files if ever needed.
    if (!req.user || req.userRole !== 'ADMIN') {
      return next();
    }
    req.zoneScope = await getAdminZoneScope(req.user);
    next();
  } catch (error) {
    console.error('[zoneMiddleware] applyZoneFilter error:', error);
    // Fail closed: on error, never silently grant unrestricted access.
    req.zoneScope = { isSuperAdmin: false, isZoneAdmin: true, zoneIds: [] };
    next();
  }
};

/**
 * Rejects a request whose client-supplied zone param falls outside the admin's own zone scope.
 * Defense in depth for the handful of endpoints that accept an explicit zoneId/cityId query or
 * body param (e.g. pricing/category filters) — Super Admin is exempt. If no explicit value is
 * supplied, this is a no-op; the controller's own default scope filter still applies.
 */
const validateZoneAccess = (paramField = 'zoneId') => {
  return (req, res, next) => {
    const scope = req.zoneScope;
    if (!scope || scope.isSuperAdmin) return next();

    const supplied = req.params?.[paramField] || req.query?.[paramField] || req.body?.[paramField];
    if (!supplied || supplied === 'all') return next();

    if (!scope.zoneIds.includes(supplied.toString())) {
      return res.status(403).json({ success: false, message: 'You do not have access to this zone.' });
    }
    next();
  };
};

/**
 * For single-resource routes (GET/PUT/DELETE /:id) — loads the target document and 403s if its
 * zone isn't in the admin's scope, so a zone admin can't reach another zone's record by
 * guessing an ID even when the corresponding list endpoint is correctly filtered. A record with
 * no zone at all (pre-migration data) is treated as Super-Admin-only, same as everywhere else
 * in this system.
 */
const validateZoneOwnership = (Model, idParam = 'id', zoneField = 'zoneId') => {
  return async (req, res, next) => {
    try {
      const scope = req.zoneScope;
      if (!scope || scope.isSuperAdmin) return next();

      const docId = req.params[idParam];
      if (!docId) return next();

      const doc = await Model.findById(docId).select(zoneField).lean();
      if (!doc) return next(); // let the controller's own lookup 404 normally

      const docZoneId = doc[zoneField];
      if (!docZoneId) {
        return res.status(403).json({ success: false, message: 'This record has no zone assigned yet and is only visible to Super Admin.' });
      }

      if (!scope.zoneIds.includes(docZoneId.toString())) {
        return res.status(403).json({ success: false, message: 'This record does not belong to your assigned zone.' });
      }

      next();
    } catch (error) {
      console.error('[zoneMiddleware] validateZoneOwnership error:', error);
      res.status(500).json({ success: false, message: 'Zone validation failed' });
    }
  };
};

module.exports = { applyZoneFilter, validateZoneAccess, validateZoneOwnership };
