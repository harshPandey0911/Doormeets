import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiShield, FiMapPin, FiUser, FiAlertCircle, FiClock, FiCheckCircle, FiXCircle, FiEye, FiEyeOff, FiFilter, FiLayers, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminManagementService from '../../../../services/adminManagementService';
import { cityService } from '../../services/cityService';
import * as vendorService from '../../services/vendorService';
import { categoryService, zoneService } from '../../../../services/catalogService';

const PERMISSION_KEYS = [
  { key: 'view_dashboard', label: 'View Dashboard', desc: 'Allows access to the main dashboard to view statistics and booking counts.' },
  { 
    key: 'view_vendors', 
    label: 'View Vendors', 
    desc: 'Allows viewing and managing the vendor list, their wallets, and analytics.',
    children: [
      { key: 'view_vendors_all', label: 'All Vendors List' },
      { key: 'view_vendors_zone', label: 'Vendor\'s Zone / Map View' },
      { key: 'view_vendors_manual', label: 'Manual Vendor Assignment' },
      { key: 'view_vendors_bookings', label: 'Vendor Bookings Ledger' },
      { key: 'view_vendors_analytics', label: 'Vendor Performance Analytics' },
      { key: 'view_vendors_police', label: 'Police Verification Status' },
      { key: 'view_vendors_incentives', label: 'Vendor Incentives Scheme' },
      { key: 'view_vendors_wallets', label: 'Vendor Wallets & Adjustments' }
    ]
  },
  { 
    key: 'view_workers', 
    label: 'View Workers', 
    desc: 'Allows viewing workers, managing their jobs, and processing worker payments.',
    children: [
      { key: 'view_workers_all', label: 'All Workers List' },
      { key: 'view_workers_jobs', label: 'Worker Jobs History' },
      { key: 'view_workers_analytics', label: 'Worker Performance Analytics' },
      { key: 'view_workers_payments', label: 'Worker Payments & Ledgers' }
    ]
  },
  { 
    key: 'view_users', 
    label: 'View Users', 
    desc: 'Allows viewing customers, their booking history, and referral settings.',
    children: [
      { key: 'view_users_all', label: 'All Registered Customers' },
      { key: 'view_users_bookings', label: 'Customer Bookings History' },
      { key: 'view_users_analytics', label: 'Customer Analytics' },
      { key: 'view_users_referrals', label: 'Customer Referral Settings' }
    ]
  },
  { 
    key: 'view_bookings', 
    label: 'View Bookings', 
    desc: 'Allows viewing, tracking, and manually assigning vendors to bookings.',
    children: [
      { key: 'view_bookings_all', label: 'All Bookings Console' },
      { key: 'view_bookings_tracking', label: 'Real-time Booking Tracking' },
      { key: 'view_bookings_notifications', label: 'Booking Push Notifications' },
      { key: 'view_bookings_instant', label: 'Instant Booking Settings' }
    ]
  },
  { key: 'view_analytics', label: 'View Analytics', desc: 'Allows viewing growth analytics, charts, and system reports.' },
  { 
    key: 'view_payments', 
    label: 'View Payments', 
    desc: 'Allows viewing payment transactions for users, workers, and vendors.',
    children: [
      { key: 'view_payments_overview', label: 'Payment Overview Stats' },
      { key: 'view_payments_users', label: 'Customer Payment Logs' },
      { key: 'view_payments_workers', label: 'Worker Payout Records' },
      { key: 'view_payments_vendors', label: 'Vendor Payout Records' },
      { key: 'view_payments_revenue', label: 'Admin Net Revenue Reports' },
      { key: 'view_payments_reports', label: 'Standard Payment Statements' }
    ]
  },
  { 
    key: 'view_reports', 
    label: 'View Reports', 
    desc: 'Allows downloading revenue, booking, and payment reports.',
    children: [
      { key: 'view_reports_revenue', label: 'Download Revenue Reports' },
      { key: 'view_reports_bookings', label: 'Download Booking Reports' },
      { key: 'view_reports_payments', label: 'Download Payment Reports' }
    ]
  },
  { key: 'manage_homepage', label: 'Manage Homepage Content & Settings', desc: 'Allows managing homepage categories, banner assets, settings, and showcase.' },
  { key: 'manage_banners', label: 'Manage Offer Banners', desc: 'Allows creating and scheduling promotional offer banners.' },
  { key: 'manage_support', label: 'Manage Support Tickets & SOS Alerts', desc: 'Allows handling customer support tickets and live emergency SOS alerts.' },
  { key: 'manage_training', label: 'Manage Training Modules', desc: 'Allows managing training modules and videos for vendors/workers.' },
  { key: 'manage_notifications', label: 'Send Notifications', desc: 'Allows sending push notifications and custom marketing messages.' },
  { key: 'propose_categories', label: 'Propose Catalog (Categories/Templates)', desc: 'Allows proposing catalog changes, category templates, and booking flows.' },
  { key: 'view_reviews', label: 'View Reviews', desc: 'Allows moderating customer feedback, comments, and ratings.' },
  { key: 'view_settlements', label: 'View Settlements', desc: 'Allows managing vendor wallets, withdrawals, and payout history.' },
  { key: 'view_commissions', label: 'View Commissions', desc: 'Allows viewing platform commission setups.' },
  { key: 'manage_plans', label: 'Manage Plans', desc: 'Allows managing active subscription plans for vendors.' },
  { key: 'view_subscriptions', label: 'View Vendor Subscriptions', desc: 'Allows monitoring vendor active subscription status.' },
  { key: 'view_police_verification', label: 'View Police Verification', desc: 'Allows reviewing police verification documents for vendors.' },
  { key: 'view_vendor_requests', label: 'View Vendor Requests', desc: 'Allows processing pending vendor onboarding approval requests.' },
  { key: 'view_vendor_services', label: 'View Add-on Library', desc: 'Allows managing extra service add-ons and parts catalogs.' },
  { key: 'view_vendor_parts', label: 'View Vendor Parts', desc: 'Allows viewing and managing parts library.' },
  { key: 'view_scrap_items', label: 'View Scrap Items', desc: 'Allows viewing and managing user scrap disposal inquiries.' },
  { key: 'manage_promos', label: 'Manage Promo Codes', desc: 'Allows creating and managing promo codes and gift vouchers.' },
];

const REQUEST_TYPE_LABELS = {
  category: '📁 Category',
  brand: '🏷️ Brand',
  pricing_override: '💰 Pricing Override',
  banner: '🖼️ Banner',
  homepage_content: '🏠 Homepage Content',
  vendor_approval: '✅ Vendor Approval',
  delete_vendor: '🗑️ Vendor Deletion'
};

const REQUEST_TYPE_ICONS = {
  category: <FiLayers className="text-blue-500" />,
  brand: <FiTag className="text-indigo-500" />,
  vendor_approval: <FiCheckCircle className="text-emerald-500" />,
  delete_vendor: <FiTrash2 className="text-red-500" />
};

const emptyForm = {
  name: '', email: '', password: '',
  role: 'CITY_ADMIN',
  assignedCities: [],
  assignedZones: [],
  permissions: [],
  assignedVendors: [],
  canApproveVendors: false,
  canApproveWorkers: false,
  // Booking Control OFF (default): bookings in this admin's zone auto-assign to a vendor as
  // today. ON: every booking in this admin's zone routes to their manual-assign queue instead.
  bookingControlEnabled: false,
  // Approval Control OFF (default): this admin's approval-gated actions (vendor approval, KYC,
  // category/brand proposals, vendor deletion) go to Super Admin for review, as today. ON:
  // those actions apply immediately.
  approvalControlEnabled: false
};

const AdminManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admins, setAdmins] = useState([]);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'requests'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [rolePreset, setRolePreset] = useState('CITY_ADMIN');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Pending Proposals tab — this is now the single place for reviewing zone-admin approval
  // requests (the standalone Approval Dashboard page was a duplicate of this and was removed).
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approvalActionLoading, setApprovalActionLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('/proposals')) {
      setActiveTab('requests');
    } else {
      setActiveTab('admins');
    }
  }, [location.pathname]);

  const loadAll = async () => {
    setLoading(true);
    
    // Load Admins
    try {
      const adminRes = await adminManagementService.getAllAdmins();
      if (adminRes.success) setAdmins(adminRes.data);
    } catch (err) {
      console.error('Error loading admins:', err);
      toast.error('Error loading admins: ' + (err.message || 'Unknown'));
    }

    // Load Cities
    try {
      const cityRes = await cityService.getAll();
      let parsedCities = [];
      if (Array.isArray(cityRes)) parsedCities = cityRes;
      else if (cityRes?.cities) parsedCities = cityRes.cities;
      else if (cityRes?.data) parsedCities = cityRes.data;
      setCities(parsedCities);
    } catch (err) {
      console.error('Error loading cities:', err);
      toast.error('Error loading cities: ' + (err.message || 'Unknown'));
    }

    // Load Zones
    try {
      const zoneRes = await zoneService.getAll();
      if (zoneRes?.success) setZones(zoneRes.zones || []);
    } catch (err) {
      console.error('Error loading zones:', err);
    }

    // Load Requests
    try {
      const requestRes = await adminManagementService.getCityAdminRequests();
      if (requestRes.success) setRequests(requestRes.data);
    } catch (err) {
      console.error('Error loading requests:', err);
    }

    // Load Vendors
    try {
      const vendorRes = await vendorService.getAllVendors({ limit: 1000 });
      if (vendorRes?.success) setVendors(vendorRes.data);
    } catch (err) {
      console.error('Error loading vendors:', err);
    }

    setLoading(false);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setRolePreset('CITY_ADMIN');
    setEditingAdmin(null);
    setShowCreateModal(true);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    const presets = ['SUPER_ADMIN', 'CITY_ADMIN', 'MANAGER', 'SUPPORT', 'OPERATIONS'];
    const isPreset = presets.includes(admin.role);
    setRolePreset(isPreset ? admin.role : 'CUSTOM');
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
      assignedCities: (admin.assignedCities || []).map(c => typeof c === 'object' ? c._id : c),
      assignedZones: (admin.assignedZones || []).map(z => typeof z === 'object' ? z._id : z),
      permissions: (admin.permissions || []).filter(p => p.enabled).map(p => p.key),
      assignedVendors: (admin.assignedVendors || []).map(v => typeof v === 'object' ? v._id : v),
      canApproveVendors: admin.canApproveVendors || false,
      canApproveWorkers: admin.canApproveWorkers || false,
      bookingControlEnabled: admin.bookingControlEnabled || false,
      approvalControlEnabled: admin.approvalControlEnabled || false
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required.');
      return;
    }
    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new admins.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        assignedCities: formData.assignedCities,
        assignedZones: formData.assignedZones,
        // zoneId is the admin's primary/working zone — default to the first assigned zone so
        // the backend's single-zone lookups (e.g. Booking Control) have something to match on.
        zoneId: formData.assignedZones?.[0] || null,
        assignedVendors: formData.assignedVendors,
        permissions: formData.permissions,
        canApproveVendors: formData.canApproveVendors,
        canApproveWorkers: formData.canApproveWorkers,
        bookingControlEnabled: formData.bookingControlEnabled,
        approvalControlEnabled: formData.approvalControlEnabled
      };
      if (formData.password) payload.password = formData.password;

      let res;
      if (editingAdmin) {
        res = await adminManagementService.updateAdmin(editingAdmin._id, payload);
      } else {
        res = await adminManagementService.createAdmin(payload);
      }

      if (res.success) {
        toast.success(editingAdmin ? 'Zone Admin updated!' : 'Zone Admin created!');
        setShowCreateModal(false);
        loadAll();
      } else {
        toast.error(res.message || 'Failed to save.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error saving admin.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    // Optimistic UI state update
    setAdmins(prev => prev.map(a => a._id === admin._id ? { ...a, isActive: !a.isActive } : a));
    try {
      const res = await adminManagementService.toggleAdminStatus(admin._id);
      if (res.success) {
        toast.success(`Admin ${res.data?.isActive ? 'activated' : 'deactivated'}`);
        loadAll();
      } else {
        toast.error(res.message || 'Failed to toggle status.');
        loadAll();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle status.');
      loadAll();
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete "${admin.name}"? This cannot be undone.`)) return;
    try {
      const res = await adminManagementService.deleteAdmin(admin._id);
      if (res.success) {
        toast.success('Admin deleted.');
        loadAll();
      }
    } catch (err) {
      toast.error('Failed to delete admin.');
    }
  };

  const handleApproveRequest = async (req) => {
    if (!window.confirm('Are you sure you want to approve this proposal?')) return;
    try {
      setApprovalActionLoading(true);
      const res = await adminManagementService.approveRequest(req._id);
      if (res.success) {
        toast.success(res.message || 'Proposal approved and executed successfully!');
        loadAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setApprovalActionLoading(false);
    }
  };

  const openRejectModal = (req) => {
    setRejectingRequest(req);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    try {
      setApprovalActionLoading(true);
      const res = await adminManagementService.rejectRequest(rejectingRequest._id, rejectReason);
      if (res.success) {
        toast.success('Proposal request rejected.');
        setIsRejectModalOpen(false);
        setRejectReason('');
        setRejectingRequest(null);
        loadAll();
      }
    } catch (err) {
      toast.error('Failed to reject request.');
    } finally {
      setApprovalActionLoading(false);
    }
  };

  const togglePermission = (key) => {
    setFormData(prev => {
      const hasKey = prev.permissions.includes(key);
      const configItem = PERMISSION_KEYS.find(p => p.key === key);
      
      let newPerms = [...prev.permissions];
      
      if (configItem && configItem.children) {
        const childKeys = configItem.children.map(c => c.key);
        if (hasKey) {
          // Uncheck parent and all children
          newPerms = newPerms.filter(k => k !== key && !childKeys.includes(k));
        } else {
          // Check parent and all children
          newPerms = [...newPerms, key, ...childKeys];
        }
      } else {
        // Child key or standard key
        if (hasKey) {
          newPerms = newPerms.filter(k => k !== key);
          // Optional: if parent exists, check if all other children are also unchecked to deselect parent
          const parentItem = PERMISSION_KEYS.find(p => p.children && p.children.some(c => c.key === key));
          if (parentItem) {
            const siblings = parentItem.children.map(c => c.key);
            const activeSiblings = newPerms.filter(k => siblings.includes(k));
            if (activeSiblings.length === 0) {
              newPerms = newPerms.filter(k => k !== parentItem.key);
            }
          }
        } else {
          newPerms = [...newPerms, key];
          // If checking a child, ensure its parent is also checked
          const parentItem = PERMISSION_KEYS.find(p => p.children && p.children.some(c => c.key === key));
          if (parentItem && !newPerms.includes(parentItem.key)) {
            newPerms.push(parentItem.key);
          }
        }
      }
      return {
        ...prev,
        permissions: newPerms
      };
    });
  };

  const toggleCity = (cityId) => {
    setFormData(prev => ({
      ...prev,
      assignedCities: prev.assignedCities.includes(cityId)
        ? prev.assignedCities.filter(c => c !== cityId)
        : [...prev.assignedCities, cityId]
    }));
  };

  const toggleVendor = (vendorId) => {
    setFormData(prev => ({
      ...prev,
      assignedVendors: prev.assignedVendors.includes(vendorId)
        ? prev.assignedVendors.filter(v => v !== vendorId)
        : [...prev.assignedVendors, vendorId]
    }));
  };

  const toggleZone = (zoneId) => {
    setFormData(prev => ({
      ...prev,
      assignedZones: prev.assignedZones.includes(zoneId)
        ? prev.assignedZones.filter(z => z !== zoneId)
        : [...prev.assignedZones, zoneId]
    }));
  };

  const handleSelectAllVendors = () => {
    const allFilteredVendorIds = vendors
      .filter(v => formData.assignedCities.includes(v.address?.city ? cities.find(c => c.name.toLowerCase() === v.address.city.toLowerCase())?._id : null))
      .map(v => v._id);
      
    if (formData.assignedVendors.length === allFilteredVendorIds.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, assignedVendors: [] }));
    } else {
      // Select all
      setFormData(prev => ({ ...prev, assignedVendors: allFilteredVendorIds }));
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="text-blue-600" /> Admin Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage Zone Admins and their permissions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create Zone Admin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => navigate('/admin/admin-management')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Administrators ({admins.length})
        </button>
        <button
          onClick={() => navigate('/admin/admin-management/proposals')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Pending Proposals
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
      ) : activeTab === 'admins' ? (
        /* Admin List */
        <div className="grid gap-4">
          {admins.map(admin => (
            <div key={admin._id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FiUser className="text-blue-500" />
                  <span className="font-bold text-gray-900 text-sm">{admin.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin'
                      ? 'Super Admin'
                      : (admin.role === 'CITY_ADMIN' || admin.role === 'ZONE_ADMIN' || admin.role === 'zone_admin' || admin.role === 'city_admin')
                        ? 'Zone Admin'
                        : admin.role.charAt(0).toUpperCase() + admin.role.slice(1).toLowerCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {admin.bookingControlEnabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Booking Control ON</span>
                  )}
                  {admin.approvalControlEnabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Approval Control ON</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{admin.email}</p>

                {/* Assigned Zones — the field that actually scopes this admin's data access */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(admin.assignedZones || []).map(zone => (
                    <span key={typeof zone === 'object' ? zone._id : zone} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiMapPin className="text-[8px]" />
                      {typeof zone === 'object' ? zone.name : zone}
                    </span>
                  ))}
                  {(!admin.assignedZones || admin.assignedZones.length === 0) && (
                    <span className="text-[10px] text-red-400 italic">No zones assigned — this admin will see no data</span>
                  )}
                  {admin.assignedVendors && admin.assignedVendors.length > 0 && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiShield className="text-[8px]" />
                      {admin.assignedVendors.length} Vendor(s) Assigned
                    </span>
                  )}
                </div>

                {/* Special Permissions */}
                <div className="flex flex-wrap gap-1">
                  {admin.canApproveVendors && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Can Approve Vendors</span>
                  )}
                  {admin.canApproveWorkers && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Can Approve Workers</span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {(admin.permissions || []).filter(p => p.enabled).length} permissions enabled
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(admin)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${admin.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  {admin.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEdit(admin)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleDelete(admin)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          {admins.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No Admins yet. Create one to get started.
            </div>
          )}
        </div>
      ) : (
        /* Pending Proposals — the single place for reviewing Zone Admin approval requests
           (this used to be duplicated by a standalone Approval Dashboard page; removed). */
        <div className="space-y-5">
          {/* Stat tiles double as filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'all', label: 'Total Proposals', count: requests.length, active: 'bg-blue-50/50 border-blue-200', icon: <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">∑</span> },
              { key: 'pending', label: 'Pending Approval', count: requests.filter(r => r.status === 'pending').length, active: 'bg-yellow-50/50 border-yellow-200', icon: <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600"><FiClock className="w-4 h-4" /></span> },
              { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length, active: 'bg-green-50/50 border-green-200', icon: <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><FiCheckCircle className="w-4 h-4" /></span> },
              { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, active: 'bg-red-50/50 border-red-200', icon: <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><FiXCircle className="w-4 h-4" /></span> }
            ].map(tile => (
              <div
                key={tile.key}
                onClick={() => setApprovalFilter(tile.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${approvalFilter === tile.key ? `${tile.active} shadow-md scale-[1.02]` : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{tile.label}</span>
                  {tile.icon}
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{tile.count}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <FiFilter className="text-gray-400" /> Filter: {approvalFilter.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              {requests.filter(r => approvalFilter === 'all' || r.status === approvalFilter).length} record(s)
            </span>
          </div>

          {requests.filter(r => approvalFilter === 'all' || r.status === approvalFilter).map(req => (
            <div key={req._id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="p-1 rounded-lg bg-gray-100 shrink-0">
                      {REQUEST_TYPE_ICONS[req.requestType] || <FiLayers className="text-gray-500" />}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap font-medium mb-1">
                    <span className="flex items-center gap-1">
                      <FiUser className="w-3.5 h-3.5" /> By <strong className="text-gray-700">{req.requestedByName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3.5 h-3.5" /> Zone: <strong className="text-gray-700">{req.zoneId?.name || req.cityName || 'Unassigned'}</strong>
                    </span>
                    <span>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Proposed Data Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-auto mt-2">
                    <strong>Proposed:</strong>
                    <pre className="mt-1 whitespace-pre-wrap font-mono text-[10px]">{JSON.stringify(req.proposedData, null, 2)}</pre>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">Zone Admin note: {req.notes}</p>
                  )}

                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-xs text-red-500 mt-2">Rejected: {req.rejectionReason}</p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveRequest(req)}
                      disabled={approvalActionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(req)}
                      disabled={approvalActionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {requests.filter(r => approvalFilter === 'all' || r.status === approvalFilter).length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No proposals matching this filter.</div>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-base font-black text-gray-900 mb-2">Decline Proposal</h3>
              <p className="text-xs text-gray-500 mb-4">Provide a reason for rejecting this proposal — this will be shown to the Zone Admin who submitted it.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid slug name / categories mapping is incorrect..."
                rows={4}
                className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-semibold"
              />
              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setRejectingRequest(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectRequest}
                  disabled={approvalActionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  Decline Proposal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <FiShield className="text-blue-600" />
                  {editingAdmin ? 'Edit Zone Admin' : 'Create Zone Admin'}
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <FiX />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                    <input
                      type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                      placeholder="Admin name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                    <input
                      type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                      placeholder="admin@example.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password {editingAdmin ? '(leave blank to keep)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                        placeholder="Min 6 characters"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Role *</label>
                    <input
                      type="text"
                      value={formData.role === 'SUPER_ADMIN' ? 'Super Admin' : (formData.role === 'CITY_ADMIN' || formData.role === 'ZONE_ADMIN') ? 'Zone Admin' : formData.role}
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Assigned Cities - Only show if CITY_ADMIN */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FiMapPin className="text-blue-500" /> Assigned Cities
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                    {cities.map(city => (
                      <label key={city._id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900 p-1 rounded-lg hover:bg-white">
                        <input
                          type="checkbox"
                          checked={formData.assignedCities.includes(city._id)}
                          onChange={() => toggleCity(city._id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        {city.name}
                      </label>
                    ))}
                    {cities.length === 0 && <p className="text-xs text-red-500 col-span-2">No cities found. Debug info: {JSON.stringify(cities)}</p>}
                  </div>
                </div>
                )}

                {/* Assigned Zones — this is the field that actually scopes a Zone Admin's data
                    access; the backend never trusts a client-supplied zoneId, it always derives
                    scope from these assignments on the authenticated admin. */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FiMapPin className="text-emerald-500" /> Assigned Zones
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                    {zones.map(zone => (
                      <label key={zone._id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900 p-1 rounded-lg hover:bg-white">
                        <input
                          type="checkbox"
                          checked={formData.assignedZones.includes(zone._id)}
                          onChange={() => toggleZone(zone._id)}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        {zone.name}
                      </label>
                    ))}
                    {zones.length === 0 && <p className="text-xs text-red-500 col-span-2">No zones found — create one under Zone Management first.</p>}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    This admin will only see data (bookings, vendors, payments, reports, everything) belonging to the zones checked here. Zero cross-zone access.
                  </p>
                </div>
                )}

                {/* Booking Control / Approval Control toggles */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'super_admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-semibold text-gray-700">Booking Control</span>
                      <input
                        type="checkbox"
                        checked={formData.bookingControlEnabled}
                        onChange={e => setFormData(p => ({ ...p, bookingControlEnabled: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </label>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {formData.bookingControlEnabled
                        ? 'ON — every booking in this zone routes to this admin for manual vendor assignment.'
                        : 'OFF (default) — bookings auto-assign to a vendor in this zone, as today.'}
                    </p>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-semibold text-gray-700">Approval Control</span>
                      <input
                        type="checkbox"
                        checked={formData.approvalControlEnabled}
                        onChange={e => setFormData(p => ({ ...p, approvalControlEnabled: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </label>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {formData.approvalControlEnabled
                        ? 'ON — vendor/KYC/category/brand approvals apply immediately, no Super Admin review.'
                        : 'OFF (default) — approvals are sent to Super Admin for review, as today.'}
                    </p>
                  </div>
                </div>
                )}

                {/* Assigned Vendors */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'super_admin' && formData.assignedCities.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <FiShield className="text-blue-500" /> Assigned Vendors
                      </label>
                      <button
                        onClick={handleSelectAllVendors}
                        className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        Select / Deselect All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                      {vendors
                        .filter(v => formData.assignedCities.includes(v.address?.city ? cities.find(c => c.name.toLowerCase() === v.address.city.toLowerCase())?._id : null))
                        .map(vendor => (
                        <label key={vendor._id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900 p-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.assignedVendors.includes(vendor._id)}
                            onChange={() => toggleVendor(vendor._id)}
                            className="w-3.5 h-3.5 text-blue-600 rounded shrink-0 mt-0.5"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{vendor.name || vendor.businessName}</span>
                            <span className="text-[10px] text-gray-400 truncate">{vendor.email}</span>
                          </div>
                        </label>
                      ))}
                      {vendors.filter(v => formData.assignedCities.includes(v.address?.city ? cities.find(c => c.name.toLowerCase() === v.address.city.toLowerCase())?._id : null)).length === 0 && (
                        <p className="text-xs text-gray-400 col-span-2 p-2">No vendors found in assigned cities.</p>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 italic">
                      Note: this is optional now that Assigned Zones exists — Zone Admins already see every vendor in their assigned zone(s). Only select vendors here if you want to additionally grant access to specific vendors outside their zone.
                    </p>
                  </div>
                )}

                {/* Special Approval Flags */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Approval Permissions</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.canApproveVendors}
                        onChange={e => setFormData(p => ({...p, canApproveVendors: e.target.checked}))}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-gray-700">Can Approve Vendors</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.canApproveWorkers}
                        onChange={e => setFormData(p => ({...p, canApproveWorkers: e.target.checked}))}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-gray-700">Can Approve Workers</span>
                    </label>
                  </div>
                </div>

                {/* Permission Keys - Only for CITY_ADMIN */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'super_admin' && (
                 <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-2">Module Permissions</label>
                   <div className="grid grid-cols-1 gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50 max-h-96 overflow-y-auto">
                     {PERMISSION_KEYS.map((perm) => {
                       const isParentChecked = formData.permissions.includes(perm.key);
                       const hasChildren = perm.children && perm.children.length > 0;
                       
                       return (
                         <div key={perm.key} className="border border-gray-200/50 rounded-xl bg-white p-3 space-y-2">
                           <label className="flex items-start gap-2.5 cursor-pointer select-none">
                             <input
                               type="checkbox"
                               checked={isParentChecked}
                               onChange={() => togglePermission(perm.key)}
                               className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500/20"
                             />
                             <div className="flex flex-col min-w-0 ml-1">
                               <span className="text-xs font-bold text-gray-800 leading-tight">{perm.label}</span>
                               {perm.desc && <span className="text-[10px] text-gray-400 mt-0.5 leading-normal">{perm.desc}</span>}
                             </div>
                           </label>

                           {/* Granular Sub-permissions */}
                           {hasChildren && isParentChecked && (
                             <motion.div
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               className="pl-6 border-l border-gray-200 grid grid-cols-2 gap-2 pt-2.5 bg-gray-50/50 p-2 rounded-lg"
                             >
                               {perm.children.map((child) => {
                                 const isChildChecked = formData.permissions.includes(child.key);
                                 return (
                                   <label key={child.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white select-none border border-transparent hover:border-gray-200 transition-colors">
                                     <input
                                       type="checkbox"
                                       checked={isChildChecked}
                                       onChange={() => togglePermission(child.key)}
                                       className="w-3.5 h-3.5 text-blue-600 rounded"
                                     />
                                     <span className="text-[11px] font-semibold text-gray-600">{child.label}</span>
                                   </label>
                                 );
                               })}
                             </motion.div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : (editingAdmin ? 'Save Changes' : 'Create Administrator')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManagement;
