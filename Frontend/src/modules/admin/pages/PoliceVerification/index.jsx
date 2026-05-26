import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from "../../../../services/api";
import LogoLoader from '../../../../components/common/LogoLoader';
import Modal from '../UserCategories/components/Modal';

const PoliceVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null }); // type: 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/police-verification?status=${statusFilter}`);
      if (res.data?.success) {
        setVerifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch police verifications', err);
      toast.error('Failed to fetch police verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const handleAction = async () => {
    try {
      if (actionModal.type === 'approve') {
        const res = await api.post(`/admin/police-verification/${selectedVendor._id}/approve`);
        if (res.data.success) {
          toast.success('Police verification approved successfully');
        }
      } else if (actionModal.type === 'reject') {
        if (!rejectionReason.trim()) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        const res = await api.post(`/admin/police-verification/${selectedVendor._id}/reject`, { reason: rejectionReason });
        if (res.data.success) {
          toast.success('Police verification rejected');
        }
      }
      
      setActionModal({ isOpen: false, type: null });
      setRejectionReason('');
      setSelectedVendor(null);
      fetchVerifications();
    } catch (err) {
      console.error('Action failed:', err);
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  if (loading && verifications.length === 0) {
    return <LogoLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Police Verification Management</h1>
          <p className="text-gray-500">Review and manage vendor police verification documents</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-lg focus:ring-[#1B4B43] focus:border-[#1B4B43] p-2"
          >
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Vendor Name</th>
              <th className="p-4 font-semibold text-gray-600">Phone</th>
              <th className="p-4 font-semibold text-gray-600">Submitted At</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.length > 0 ? (
              verifications.map(vendor => (
                <tr key={vendor._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{vendor.name}</td>
                  <td className="p-4 text-gray-600">{vendor.phone}</td>
                  <td className="p-4 text-gray-600">
                    {new Date(vendor.policeVerification.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                      ${vendor.policeVerification.status === 'approved' ? 'bg-green-100 text-green-800' :
                        vendor.policeVerification.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {vendor.policeVerification.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.open(vendor.policeVerification.documentUrl, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                        title="View Document"
                      >
                        <FiEye />
                      </button>
                      
                      {statusFilter === 'submitted' && (
                        <>
                          <button 
                            onClick={() => { setSelectedVendor(vendor); setActionModal({ isOpen: true, type: 'approve' }); }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip"
                            title="Approve"
                          >
                            <FiCheck />
                          </button>
                          <button 
                            onClick={() => { setSelectedVendor(vendor); setActionModal({ isOpen: true, type: 'reject' }); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="Reject"
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No verifications found for this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && selectedVendor && (
        <Modal isOpen={actionModal.isOpen} onClose={() => setActionModal({ isOpen: false, type: null })}>
          <div className="p-6">
            <h2 className={`text-xl font-bold mb-4 ${actionModal.type === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
              {actionModal.type === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionModal.type} the police verification for <strong>{selectedVendor.name}</strong>?
            </p>

            {actionModal.type === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal({ isOpen: false, type: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PoliceVerification;
