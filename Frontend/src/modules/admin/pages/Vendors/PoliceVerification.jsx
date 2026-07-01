import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiSave,
  FiDownload,
  FiEye,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import adminVendorService from '../../../../services/adminVendorService';
import CardShell from '../UserCategories/components/CardShell';
import Modal from '../UserCategories/components/Modal';

const PoliceVerification = () => {
  const [graceDays, setGraceDays] = useState(7);
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminUploadedDoc, setAdminUploadedDoc] = useState('');

  useEffect(() => {
    fetchSettings();
    loadVendors();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data?.success && response.data?.settings) {
        setGraceDays(response.data.settings.policeVerificationDays || 7);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast.error('Failed to load grace days setting.');
    }
  };

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await adminVendorService.getAllVendors();
      if (response.success) {
        setVendors(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGraceDays = async () => {
    if (graceDays < 1) {
      toast.error('Grace days must be at least 1 day.');
      return;
    }
    setIsSavingDays(true);
    try {
      const response = await api.put('/admin/settings', {
        policeVerificationDays: graceDays
      });
      if (response.data?.success) {
        toast.success('Police verification grace days updated successfully.');
      } else {
        toast.error('Failed to update settings.');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings.');
    } finally {
      setIsSavingDays(false);
    }
  };

  const handleApprovePV = async (vendorId, documentUrl = null) => {
    const finalDoc = documentUrl || adminUploadedDoc;
    // If method is admin and no document is uploaded, throw error
    const vendorObj = vendors.find(v => v._id === vendorId);
    if (vendorObj?.policeVerification?.method === 'admin' && !vendorObj?.policeVerification?.documentUrl && !finalDoc) {
      toast.error('Please upload a police verification document first.');
      return;
    }

    if (!window.confirm('Are you sure you want to approve this vendor\'s police verification?')) {
      return;
    }
    try {
      const res = await api.post(`/admin/police-verification/${vendorId}/approve`, {
        documentUrl: finalDoc || undefined
      });
      if (res.data?.success) {
        toast.success('Vendor police verification approved!');
        setAdminUploadedDoc('');
        loadVendors();
        setIsModalOpen(false);
      } else {
        toast.error(res.data?.message || 'Failed to approve.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve verification.');
    }
  };

  const handleRejectPV = async (vendorId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      const res = await api.post(`/admin/police-verification/${vendorId}/reject`, { reason });
      if (res.data?.success) {
        toast.success('Vendor police verification rejected.');
        loadVendors();
        setIsModalOpen(false);
      } else {
        toast.error(res.data?.message || 'Failed to reject.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject verification.');
    }
  };

  // Filter vendors with active/pending police verification
  const pvVendors = vendors.filter(v => v.policeVerification);

  const getRemainingDays = (dueDate) => {
    if (!dueDate) return 'N/A';
    const diffTime = new Date(dueDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Expired';
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-w-xl">
        <h3 className="text-sm font-black text-gray-800 mb-2 flex items-center gap-2">
          <FiShield className="text-blue-600" />
          Police Verification Grace Period Settings
        </h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Configure the number of days a vendor has to complete their police verification before their application is automatically rejected.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              value={graceDays}
              onChange={(e) => setGraceDays(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Days</span>
          </div>
          <button
            onClick={handleSaveGraceDays}
            disabled={isSavingDays}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition text-sm cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            {isSavingDays ? 'Saving...' : 'Save Config'}
            <FiSave />
          </button>
        </div>
      </div>

      {/* List of PV Vendors */}
      <CardShell
        icon={FiClock}
        title="Police Verifications Queue"
        subtitle="Review and manage police verification documents"
      >
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Left</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingVendors ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-gray-500">Loading verification records...</td>
                </tr>
              ) : pvVendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-gray-500">No verification records found.</td>
                </tr>
              ) : (
                pvVendors.map((vendor) => {
                  const pv = vendor.policeVerification || {};
                  const diffTime = pv.dueDate ? new Date(pv.dueDate) - new Date() : 0;
                  const isExpired = diffTime <= 0;

                  return (
                    <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{vendor.name}</p>
                          <p className="text-[10px] text-gray-500">{vendor.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold capitalize text-gray-700">
                          {pv.method || 'self'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          pv.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                          pv.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          pv.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                          {pv.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-600 font-medium">
                          {pv.dueDate ? new Date(pv.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold ${isExpired && pv.status === 'pending' ? 'text-rose-600' : 'text-gray-600'}`}>
                          {getRemainingDays(pv.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="View Document"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {pv.status !== 'approved' && (
                            <>
                              <button
                                onClick={() => {
                                  if (pv.method === 'admin' && !pv.documentUrl) {
                                    setSelectedVendor(vendor);
                                    setIsModalOpen(true);
                                    toast.error('Please upload the police verification document first.');
                                  } else {
                                    handleApprovePV(vendor._id);
                                  }
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Approve"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectPV(vendor._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Reject"
                              >
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* View Document Modal */}
      {selectedVendor && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVendor(null);
            setAdminUploadedDoc('');
          }}
          title="Police Verification Certificate"
          size="md"
        >
          <div className="space-y-4 text-center">
            {selectedVendor.policeVerification?.documentUrl ? (
              <div>
                <img
                  src={selectedVendor.policeVerification.documentUrl}
                  alt="PV Certificate"
                  className="w-full h-80 object-contain rounded-2xl border border-gray-150"
                />
                <a
                  href={selectedVendor.policeVerification.documentUrl}
                  download
                  className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700"
                >
                  <FiDownload className="w-4 h-4" />
                  Download Certificate
                </a>
              </div>
            ) : adminUploadedDoc ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-250 bg-gray-50 flex flex-col items-center justify-center p-4">
                {adminUploadedDoc.includes('pdf') || adminUploadedDoc.startsWith('data:application/pdf') ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <span className="text-5xl mb-2">📄</span>
                    <span className="text-xs font-bold">Police_Verification_Document.pdf</span>
                  </div>
                ) : (
                  <img src={adminUploadedDoc} alt="Uploaded Doc" className="max-h-80 object-contain rounded-xl" />
                )}
                <button
                  type="button"
                  onClick={() => setAdminUploadedDoc('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                >
                  ✕
                </button>
              </div>
            ) : selectedVendor.policeVerification?.method === 'admin' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center relative hover:bg-gray-50/50 transition cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
                <FiShield className="text-4xl text-gray-400 mb-2" />
                <span className="text-xs text-gray-600 font-bold">Upload Police Clearance Certificate (Admin)</span>
                <span className="text-[10px] text-gray-400 mt-1">Accepts images and PDF files up to 5MB</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, setAdminUploadedDoc)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="py-12 bg-gray-50 text-gray-400 font-bold text-sm border border-dashed border-gray-200 rounded-2xl">
                No certificate document has been uploaded yet.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleRejectPV(selectedVendor._id)}
                className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprovePV(selectedVendor._id)}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-500 transition cursor-pointer"
              >
                Approve
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PoliceVerification;
