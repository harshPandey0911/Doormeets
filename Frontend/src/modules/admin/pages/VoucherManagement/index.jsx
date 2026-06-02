import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiGift, FiX, FiInfo } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'wallet',
    value: '',
    discountType: 'percentage',
    serviceId: '',
    categoryId: '',
    maxDiscountQty: '',
    minOrderValue: '',
    usageLimit: '',
    expiryDate: '',
    oneTimePerUser: true,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically enforce value caps on form selections
  useEffect(() => {
    const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
    if (formData.type === 'service_discount' && formData.discountType === 'percentage') {
      if (Number(formData.value) > 100) {
        setFormData(prev => ({ ...prev, value: 100 }));
      }
    } else if (formData.type === 'service_discount' && formData.discountType === 'flat' && selectedService) {
      if (Number(formData.value) > selectedService.basePrice) {
        setFormData(prev => ({ ...prev, value: selectedService.basePrice }));
      }
    }
  }, [formData.discountType, formData.type, formData.serviceId, services, formData.value]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vouchRes, catRes, srvRes] = await Promise.all([
        api.get('/admin/vouchers'),
        api.get('/admin/categories'),
        api.get('/admin/services')
      ]);

      setVouchers(vouchRes.data.data || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
      setServices(srvRes.data.services || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (voucher = null) => {
    setCurrentVoucher(voucher);
    if (voucher) {
      setFormData({
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discountType: voucher.discountType || 'percentage',
        serviceId: voucher.serviceId?._id || voucher.serviceId || '',
        categoryId: voucher.categoryId?._id || voucher.categoryId || '',
        maxDiscountQty: voucher.maxDiscountQty || '',
        minOrderValue: voucher.minOrderValue || '',
        usageLimit: voucher.usageLimit || '',
        expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split('T')[0] : '',
        oneTimePerUser: voucher.oneTimePerUser !== undefined ? voucher.oneTimePerUser : true,
        isActive: voucher.isActive
      });
    } else {
      setFormData({
        code: '',
        type: 'wallet',
        value: '',
        discountType: 'percentage',
        serviceId: '',
        categoryId: '',
        maxDiscountQty: '',
        minOrderValue: '',
        usageLimit: '',
        expiryDate: '',
        oneTimePerUser: true,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error('Voucher code is required');
    if (formData.value === '') return toast.error('Value is required');
    if (!formData.expiryDate) return toast.error('Expiry date is required');

    if (formData.type === 'service_discount' && formData.discountType === 'percentage' && Number(formData.value) > 100) {
      return toast.error('Percentage discount cannot exceed 100%');
    }

    const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
    if (formData.type === 'service_discount' && formData.discountType === 'flat' && selectedService && Number(formData.value) > selectedService.basePrice) {
      return toast.error(`Flat discount cannot exceed service base price of ₹${selectedService.basePrice}`);
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue || 0),
        maxDiscountQty: formData.maxDiscountQty ? Number(formData.maxDiscountQty) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
      };

      if (currentVoucher) {
        const res = await api.put(`/admin/vouchers/${currentVoucher._id}`, payload);
        if (res.data.success) {
          toast.success('Gift voucher updated successfully!');
        }
      } else {
        const res = await api.post('/admin/vouchers', payload);
        if (res.data.success) {
          toast.success('Gift voucher created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error saving voucher';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gift voucher? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/admin/vouchers/${id}`);
      if (res.data.success) {
        toast.success('Gift voucher deleted successfully.');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete voucher');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiGift className="text-blue-600" /> Gift Cards & Vouchers
          </h2>
          <p className="text-sm text-gray-500">Create wallet top-ups, service vouchers, and general checkout gift cards</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-semibold shadow-xs"
        >
          <FiPlus /> Create Gift Card
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading gift cards & vouchers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Voucher Code</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Type</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Value</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Scope / Applies To</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Redeemed</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Expiry Date</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => {
                const isExpired = new Date(voucher.expiryDate) < new Date();
                return (
                  <tr key={voucher._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded text-xs tracking-wider border border-indigo-100 uppercase">
                        {voucher.code}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold">
                      {voucher.type === 'wallet' && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 uppercase">Wallet Top-up</span>
                      )}
                      {voucher.type === 'service_discount' && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 uppercase">Service Discount</span>
                      )}
                      {voucher.type === 'all_discount' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 uppercase">General Off</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-800">
                        {voucher.type === 'wallet' ? `₹${voucher.value}` : (voucher.discountType === 'flat' ? `₹${voucher.value}` : `${voucher.value}%`)}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-600">
                      {voucher.type === 'wallet' && <span className="text-gray-400">Adds Wallet Balance</span>}
                      {voucher.type === 'all_discount' && <span className="text-gray-600">Global Checkout discount</span>}
                      {voucher.type === 'service_discount' && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                          {voucher.serviceId?.title ? `Svc: ${voucher.serviceId.title}` : (voucher.categoryId?.title ? `Cat: ${voucher.categoryId.title}` : 'Discount')}
                          {voucher.maxDiscountQty ? ` (Max Qty: ${voucher.maxDiscountQty})` : ''}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-600 font-semibold">
                      {voucher.usageCount} {voucher.usageLimit ? `/ ${voucher.usageLimit}` : 'uses'}
                    </td>
                    <td className="p-4 text-xs font-medium">
                      <span className={isExpired ? 'text-red-500 font-bold' : 'text-gray-600'}>
                        {new Date(voucher.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {isExpired && <p className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Expired</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${voucher.isActive && !isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {voucher.isActive && !isExpired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(voucher)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(voucher._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 text-sm">No gift cards or vouchers created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiGift className="text-blue-600" /> {currentVoucher ? 'Edit Gift Voucher' : 'Create Gift Voucher'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              <form id="voucher-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Voucher Code Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white uppercase font-mono font-bold tracking-wider"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. GIFT500, SUPERAC"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Voucher Type *</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="wallet">Wallet Cash Card (Adds balance)</option>
                      <option value="service_discount">Service Specific Discount</option>
                      <option value="all_discount">General Off (Checkout Voucher)</option>
                    </select>
                  </div>

                  {formData.type !== 'wallet' && (
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
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {formData.type === 'wallet' ? 'Cash Value to Add (₹) *' : 'Discount Value *'}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.value}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(0, val);
                        const selectedService = services.find(srv => (srv._id || srv.id) === formData.serviceId);
                        if (formData.type === 'service_discount' && formData.discountType === 'percentage' && val > 100) {
                          val = 100;
                        } else if (formData.type === 'service_discount' && formData.discountType === 'flat' && selectedService && val > selectedService.basePrice) {
                          val = selectedService.basePrice;
                        }
                        setFormData({...formData, value: e.target.value === '' ? '' : val});
                      }}
                      placeholder={formData.type === 'wallet' ? '₹ cash' : (formData.discountType === 'flat' ? '₹ discount' : '% discount')}
                      required
                      min="0"
                      max={formData.type === 'service_discount' && formData.discountType === 'percentage' ? 100 : (formData.type === 'service_discount' && formData.discountType === 'flat' && services.find(srv => (srv._id || srv.id) === formData.serviceId) ? services.find(srv => (srv._id || srv.id) === formData.serviceId).basePrice : undefined)}
                    />
                  </div>

                  {formData.type !== 'wallet' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order Value (₹ optional)</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.minOrderValue}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          val = Math.max(0, val);
                          setFormData({...formData, minOrderValue: e.target.value === '' ? '' : val});
                        }}
                        placeholder="e.g. ₹199 minimum"
                        min="0"
                      />
                    </div>
                  )}

                  {formData.type === 'service_discount' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Max Discounted Qty (optional)</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.maxDiscountQty}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          val = Math.max(1, val);
                          setFormData({...formData, maxDiscountQty: e.target.value === '' ? '' : val});
                        }}
                        placeholder="e.g. limit to 1 item"
                        min="1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Usage Limit (Global optional)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.usageLimit}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(1, val);
                        setFormData({...formData, usageLimit: e.target.value === '' ? '' : val});
                      }}
                      placeholder="Total max claims globally"
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
                </div>

                {formData.type === 'service_discount' && (
                  <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 space-y-3">
                    <div className="text-xs font-bold text-gray-600">Restricted Service details:</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Applies To Scope *</label>
                        <select
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={formData.serviceId ? 'service' : (formData.categoryId ? 'category' : 'service')}
                          onChange={(e) => {
                            if (e.target.value === 'service') {
                              setFormData({...formData, categoryId: ''});
                            } else {
                              setFormData({...formData, serviceId: ''});
                            }
                          }}
                        >
                          <option value="service">Particular Service</option>
                          <option value="category">Particular Category</option>
                        </select>
                      </div>

                      {formData.serviceId !== undefined && !formData.categoryId && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-gray-700">Select Restricted Service *</label>
                            {services.find(s => (s._id || s.id) === formData.serviceId) && (
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                Price: ₹{services.find(s => (s._id || s.id) === formData.serviceId).basePrice}
                              </span>
                            )}
                          </div>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.serviceId}
                            onChange={(e) => setFormData({...formData, serviceId: e.target.value, categoryId: ''})}
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
                      )}

                      {formData.categoryId !== undefined && !formData.serviceId && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Restricted Category *</label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.categoryId}
                            onChange={(e) => setFormData({...formData, categoryId: e.target.value, serviceId: ''})}
                            required
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map(cat => (
                              <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.oneTimePerUser}
                      onChange={(e) => setFormData({...formData, oneTimePerUser: e.target.checked})}
                    />
                    <span className="text-gray-700">Limit to one redemption per User</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="text-gray-700">Voucher is Active</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
              <button type="submit" form="voucher-form" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Gift Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
