import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiShield, FiMapPin, FiUser, FiAlertCircle, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminManagementService from '../../../../services/adminManagementService';
import { cityService } from '../../services/cityService';
import * as vendorService from '../../services/vendorService';
import { categoryService } from '../../../../services/catalogService';

const PERMISSION_KEYS = [
  { key: 'view_dashboard', label: 'View Dashboard' },
  { key: 'view_vendors', label: 'View Vendors' },
  { key: 'view_workers', label: 'View Workers' },
  { key: 'view_users', label: 'View Users' },
  { key: 'view_bookings', label: 'View Bookings' },
  { key: 'view_analytics', label: 'View Analytics' },
  { key: 'view_payments', label: 'View Payments' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_homepage', label: 'Manage Homepage Content' },
  { key: 'manage_pricing', label: 'Manage Local Pricing' },
  { key: 'manage_banners', label: 'Manage Offer Banners' },
  { key: 'manage_support', label: 'Manage Support Tickets' },
  { key: 'manage_training', label: 'Manage Training' },
  { key: 'manage_notifications', label: 'Send Notifications' },
  { key: 'propose_categories', label: 'Propose New Categories (needs approval)' },
  { key: 'propose_brands', label: 'Propose New Brands (needs approval)' },
  { key: 'view_reviews', label: 'View Reviews' },
  { key: 'view_settlements', label: 'View Settlements' },
  { key: 'view_commissions', label: 'View Commissions' },
  { key: 'manage_plans', label: 'Manage Plans' },
  { key: 'view_subscriptions', label: 'View Vendor Subscriptions' },
  { key: 'view_police_verification', label: 'View Police Verification' },
  { key: 'view_vendor_requests', label: 'View Vendor Requests' },
  { key: 'view_vendor_services', label: 'View Vendor Services' },
  { key: 'view_vendor_parts', label: 'View Vendor Parts' },
  { key: 'manage_stock', label: 'Manage Stock' },
  { key: 'view_scrap_items', label: 'View Scrap Items' },
  { key: 'manage_promos', label: 'Manage Promo Codes' },
];

const REQUEST_TYPE_LABELS = {
  category: '📁 Category',
  brand: '🏷️ Brand',
  pricing_override: '💰 Pricing Override',
  banner: '🖼️ Banner',
  homepage_content: '🏠 Homepage Content',
  delete_vendor: '🗑️ Vendor Deletion'
};

const emptyForm = {
  name: '', email: '', password: '',
  role: 'CITY_ADMIN',
  assignedCities: [],
  permissions: [],
  assignedVendors: [],
  canApproveVendors: false,
  canApproveWorkers: false
};

const AdminManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admins, setAdmins] = useState([]);
  const [cities, setCities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'requests'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [rolePreset, setRolePreset] = useState('CITY_ADMIN');
  const [saving, setSaving] = useState(false);

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
      permissions: (admin.permissions || []).filter(p => p.enabled).map(p => p.key),
      assignedVendors: (admin.assignedVendors || []).map(v => typeof v === 'object' ? v._id : v),
      canApproveVendors: admin.canApproveVendors || false,
      canApproveWorkers: admin.canApproveWorkers || false
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
        assignedVendors: formData.assignedVendors,
        permissions: formData.permissions,
        canApproveVendors: formData.canApproveVendors,
        canApproveWorkers: formData.canApproveWorkers
      };
      if (formData.password) payload.password = formData.password;

      let res;
      if (editingAdmin) {
        res = await adminManagementService.updateAdmin(editingAdmin._id, payload);
      } else {
        res = await adminManagementService.createAdmin(payload);
      }

      if (res.success) {
        toast.success(editingAdmin ? 'City Admin updated!' : 'City Admin created!');
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
    try {
      const res = await adminManagementService.toggleAdminStatus(admin._id);
      if (res.success) {
        toast.success(`Admin ${res.data.isActive ? 'activated' : 'deactivated'}`);
        loadAll();
      }
    } catch (err) {
      toast.error('Failed to toggle status.');
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
    try {
      const res = await adminManagementService.approveRequest(req._id);
      if (res.success) {
        toast.success('Request approved! Record created.');
        loadAll();
      }
    } catch (err) {
      toast.error('Failed to approve request.');
    }
  };

  const handleRejectRequest = async (req) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return; // Cancelled
    try {
      const res = await adminManagementService.rejectRequest(req._id, reason);
      if (res.success) {
        toast.success('Request rejected.');
        loadAll();
      }
    } catch (err) {
      toast.error('Failed to reject request.');
    }
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(k => k !== key)
        : [...prev.permissions, key]
    }));
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
          <p className="text-sm text-gray-500 mt-1">Manage City Admins and their permissions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create City Admin
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
                      : admin.role === 'CITY_ADMIN' 
                        ? 'City Admin' 
                        : admin.role.charAt(0).toUpperCase() + admin.role.slice(1).toLowerCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{admin.email}</p>

                {/* Assigned Cities */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(admin.assignedCities || []).map(city => (
                    <span key={typeof city === 'object' ? city._id : city} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiMapPin className="text-[8px]" />
                      {typeof city === 'object' ? city.name : city}
                    </span>
                  ))}
                  {(!admin.assignedCities || admin.assignedCities.length === 0) && (
                    <span className="text-[10px] text-gray-400 italic">No cities assigned</span>
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
        /* Pending Requests */
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
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
                  <p className="text-xs text-gray-500 mb-1">
                    By <strong>{req.requestedByName}</strong> for <strong>{req.cityName || 'Unknown City'}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Proposed Data Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-auto">
                    <strong>Proposed:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(req.proposedData, null, 2)}</pre>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">Note: {req.notes}</p>
                  )}

                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-xs text-red-500 mt-2">Rejected: {req.rejectionReason}</p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveRequest(req)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No proposals yet.</div>
          )}
        </div>
      )}

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
                  {editingAdmin ? 'Edit City Admin' : 'Create City Admin'}
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
                    <input
                      type="password" value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))}
                      placeholder="Min 6 characters"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Role *</label>
                    <input
                      type="text"
                      value={formData.role === 'SUPER_ADMIN' ? 'Super Admin' : formData.role === 'CITY_ADMIN' ? 'City Admin' : formData.role}
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
                      Note: Only selected vendors will be visible to this City Admin. If no vendors are selected, they see nothing.
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
                  <div className="grid grid-cols-2 gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50">
                    {PERMISSION_KEYS.map(({ key, label }) => (
                      <label key={key} className="flex items-start gap-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(key)}
                          onChange={() => togglePermission(key)}
                          className="w-3.5 h-3.5 mt-0.5 text-blue-600 rounded"
                        />
                        <span className="text-xs text-gray-700 leading-tight">{label}</span>
                      </label>
                    ))}
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
