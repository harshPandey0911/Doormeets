import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPercent, FiX, FiTag } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const PromoManagement = () => {
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderValue: '',
    maxDiscountQty: '',
    appliesTo: 'all',
    serviceId: '',
    categoryId: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically enforce discount caps in real-time
  useEffect(() => {
    const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
    if (formData.discountType === 'percentage') {
      if (Number(formData.discountValue) > 100) {
        setFormData(prev => ({ ...prev, discountValue: 100 }));
      }
    } else if (formData.discountType === 'flat' && formData.appliesTo === 'service' && selectedService) {
      if (Number(formData.discountValue) > selectedService.basePrice) {
        setFormData(prev => ({ ...prev, discountValue: selectedService.basePrice }));
      }
    }
  }, [formData.discountType, formData.appliesTo, formData.serviceId, services, formData.discountValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promoRes, catRes, srvRes] = await Promise.all([
        api.get('/admin/promos'),
        api.get('/admin/categories'),
        api.get('/admin/services')
      ]);

      setPromos(promoRes.data.data || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
      setServices(srvRes.data.services || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    setCurrentPromo(promo);
    if (promo) {
      setFormData({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxDiscountAmount: promo.maxDiscountAmount || '',
        minOrderValue: promo.minOrderValue || '',
        maxDiscountQty: promo.maxDiscountQty || '',
        appliesTo: promo.appliesTo || 'all',
        serviceId: promo.serviceId?._id || promo.serviceId || '',
        categoryId: promo.categoryId?._id || promo.categoryId || '',
        expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : '',
        usageLimit: promo.usageLimit || '',
        isActive: promo.isActive
      });
    } else {
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderValue: '',
        maxDiscountQty: '',
        appliesTo: 'all',
        serviceId: '',
        categoryId: '',
        expiryDate: '',
        usageLimit: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error('Promo code is required');
    if (!formData.discountValue) return toast.error('Discount value is required');
    if (!formData.expiryDate) return toast.error('Expiry date is required');

    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
      return toast.error('Percentage discount value cannot exceed 100%');
    }

    const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
    if (formData.discountType === 'flat' && formData.appliesTo === 'service' && selectedService && Number(formData.discountValue) > selectedService.basePrice) {
      return toast.error(`Flat discount amount cannot exceed the service original base price of ₹${selectedService.basePrice}`);
    }

    if (formData.appliesTo === 'service' && !formData.serviceId) {
      return toast.error('Please select a specific service');
    }
    if (formData.appliesTo === 'category' && !formData.categoryId) {
      return toast.error('Please select a specific category');
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue || 0),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        maxDiscountQty: formData.maxDiscountQty ? Number(formData.maxDiscountQty) : null
      };

      if (currentPromo) {
        const res = await api.put(`/admin/promos/${currentPromo._id}`, payload);
        if (res.data.success) {
          toast.success('Promo code updated successfully!');
        }
      } else {
        const res = await api.post('/admin/promos', payload);
        if (res.data.success) {
          toast.success('Promo code created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error saving promo code';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/admin/promos/${id}`);
      if (res.data.success) {
        toast.success('Promo code deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiTag className="text-blue-600" /> Promo & Coupon Codes
          </h2>
          <p className="text-sm text-gray-500">Create and manage discounts for your services</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          <FiPlus /> Create Promo Code
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading promo codes...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Promo Code</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Discount</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Applies To</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Usage</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Min Value</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Expiry Date</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => {
                const isExpired = new Date(promo.expiryDate) < new Date();
                return (
                  <tr key={promo._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs tracking-wider border border-blue-100">
                        {promo.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-800">
                        {promo.discountType === 'flat' ? `₹${promo.discountValue}` : `${promo.discountValue}%`}
                      </span>
                      {promo.maxDiscountAmount && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Max ₹{promo.maxDiscountAmount}</p>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-600">
                      {promo.appliesTo === 'all' && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">All Services</span>
                      )}
                      {promo.appliesTo === 'service' && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                          Svc: {promo.serviceId?.title || 'Unknown'} {promo.maxDiscountQty ? `(Max Qty: ${promo.maxDiscountQty})` : ''}
                        </span>
                      )}
                      {promo.appliesTo === 'category' && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                          Cat: {promo.categoryId?.title || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-600 font-semibold">
                      {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : 'uses'}
                    </td>
                    <td className="p-4 text-xs text-gray-600 font-semibold">
                      ₹{promo.minOrderValue}
                    </td>
                    <td className="p-4 text-xs font-medium">
                      <span className={isExpired ? 'text-red-500 font-bold' : 'text-gray-600'}>
                        {new Date(promo.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {isExpired && <p className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Expired</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${promo.isActive && !isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {promo.isActive && !isExpired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(promo._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
              {promos.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 text-sm">No promo codes created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiTag className="text-blue-600" /> {currentPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              <form id="promo-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Promo Code Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white uppercase font-mono font-bold tracking-wider"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. WELCOME50, SUPERAC"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type *</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Value *</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.discountValue}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(0, val); // Enforce non-negative
                        const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
                        if (formData.discountType === 'percentage' && val > 100) {
                          val = 100;
                        } else if (formData.discountType === 'flat' && formData.appliesTo === 'service' && selectedService && val > selectedService.basePrice) {
                          val = selectedService.basePrice;
                        }
                        setFormData({...formData, discountValue: e.target.value === '' ? '' : val});
                      }}
                      placeholder={formData.discountType === 'flat' ? '₹ discount' : '% discount'}
                      required
                      min="0"
                      max={formData.discountType === 'percentage' ? 100 : (formData.appliesTo === 'service' && services.find(srv => (srv._id || srv.id) === formData.serviceId) ? services.find(srv => (srv._id || srv.id) === formData.serviceId).basePrice : undefined)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order Value (₹ optional)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.minOrderValue}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(0, val); // Enforce non-negative
                        setFormData({...formData, minOrderValue: e.target.value === '' ? '' : val});
                      }}
                      placeholder="e.g. ₹199 minimum"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Max Discounted Qty (optional)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.maxDiscountQty}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(1, val); // Enforce at least 1
                        setFormData({...formData, maxDiscountQty: e.target.value === '' ? '' : val});
                      }}
                      placeholder="e.g. limit to 1 item"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Usage Limit (Global optional)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="Total max uses overall"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Applies To Scope *</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.appliesTo}
                      onChange={(e) => setFormData({...formData, appliesTo: e.target.value})}
                    >
                      <option value="all">All Services (Global)</option>
                      <option value="service">Particular Service</option>
                      <option value="category">Particular Category</option>
                    </select>
                  </div>
                </div>

                {formData.appliesTo === 'category' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Restricted Category *</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(cat => (
                        <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.appliesTo === 'service' && (() => {
                  const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
                  return (
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-gray-700">Select Restricted Service *</label>
                        {selectedService && (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                            Original Base Price: ₹{selectedService.basePrice}
                          </span>
                        )}
                      </div>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                        required
                      >
                        <option value="">-- Choose Service --</option>
                        {services.map(srv => (
                          <option key={srv._id || srv.id} value={srv._id || srv.id}>
                            {srv.title} ({srv.categoryId?.title || 'Category'})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="text-gray-700">Promo Code is Active</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
              <button type="submit" form="promo-form" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoManagement;
