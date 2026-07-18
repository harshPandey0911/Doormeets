import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck, FiXCircle } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const CreditPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    creditsAmount: '',
    price: '',
    isActive: true
  });

  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/credit-packages');
      if (res.data.success) {
        setPackages(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch credit packages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        creditsAmount: Number(formData.creditsAmount),
        price: Number(formData.price),
        isActive: formData.isActive
      };

      if (isEditing) {
        await api.put(`/admin/credit-packages/${currentId}`, payload);
        toast.success('Package updated successfully');
      } else {
        await api.post('/admin/credit-packages', payload);
        toast.success('Package created successfully');
      }
      
      setShowModal(false);
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save package');
    }
  };

  const openEditModal = (pkg) => {
    setIsEditing(true);
    setCurrentId(pkg._id);
    setFormData({
      name: pkg.name,
      creditsAmount: pkg.creditsAmount,
      price: pkg.price,
      isActive: pkg.isActive
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      creditsAmount: '',
      price: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.delete(`/admin/credit-packages/${id}`);
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const toggleStatus = async (pkg) => {
    try {
      await api.put(`/admin/credit-packages/${pkg._id}`, { isActive: !pkg.isActive });
      toast.success(`Package ${pkg.isActive ? 'disabled' : 'enabled'}`);
      fetchPackages();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Credit Packages</h2>
          <p className="text-sm text-gray-500">Manage packages vendors can purchase</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
        >
          <FiPlus /> Add Package
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <th className="p-4 rounded-tl-lg">Package Name</th>
              <th className="p-4">Credits</th>
              <th className="p-4">Price (₹)</th>
              <th className="p-4">Status</th>
              <th className="p-4 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {packages.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">No credit packages found. Create one to get started.</td>
              </tr>
            ) : (
              packages.map(pkg => (
                <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{pkg.name}</td>
                  <td className="p-4 font-bold text-blue-600">{pkg.creditsAmount}</td>
                  <td className="p-4 font-bold text-green-600">₹{pkg.price}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(pkg)}
                      className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-fit ${
                        pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {pkg.isActive ? <FiCheck /> : <FiXCircle />}
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-800">
                {isEditing ? 'Edit Credit Package' : 'Create Credit Package'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Package Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Starter Pack"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Credits Amount</label>
                  <input
                    type="number"
                    name="creditsAmount"
                    value={formData.creditsAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    min="1"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 1000"
                    min="0"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Package is active and visible to vendors
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                >
                  <FiSave /> {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CreditPackages;
