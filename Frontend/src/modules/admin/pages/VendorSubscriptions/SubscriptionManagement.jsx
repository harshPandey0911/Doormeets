import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import vendorSubscriptionService from '../../services/vendorSubscriptionService';
import { themeColors } from '../../../../theme';

const VendorSubscriptionManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'transactions'
  
  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean).pop();
    if (path === 'transactions') {
      setActiveTab('transactions');
    } else {
      setActiveTab('plans');
    }
  }, [location.pathname]);

  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, transactionCount: 0 });
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
    features: '',
    isActive: true
  });

  const brandColor = themeColors.brand?.teal || '#347989';

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchTransactions(1);
    }
  }, [activeTab, dateRange]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await vendorSubscriptionService.getAllPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await vendorSubscriptionService.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data);
        if (response.stats) {
          setStats(response.stats);
        }
        if (response.pagination) {
          setPagination({
            page: response.pagination.page,
            totalPages: response.pagination.pages,
            total: response.pagination.total
          });
        }
      }
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        description: plan.description || '',
        features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '',
        isActive: plan.isActive === true || (plan.isActive !== false && plan.status !== 'hide'),
        isPopular: !!plan.isPopular
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        name: '',
        price: '',
        duration: '',
        description: '',
        features: '',
        isActive: true,
        isPopular: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      status: formData.isActive ? 'active' : 'hide',
      features: typeof formData.features === 'string' ? formData.features.split(',').map(f => f.trim()).filter(f => f !== '') : formData.features
    };

    try {
      if (currentPlan) {
        await vendorSubscriptionService.updatePlan(currentPlan._id, data);
        toast.success('Plan updated successfully');
      } else {
        await vendorSubscriptionService.createPlan(data);
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await vendorSubscriptionService.deletePlan(id);
        toast.success('Plan deleted successfully');
        fetchPlans();
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleToggleStatus = async (plan, e) => {
    if (e) e.stopPropagation();
    try {
      const currentActive = plan.isActive === true || (plan.isActive !== false && plan.status !== 'hide');
      const updatedStatus = !currentActive;
      await vendorSubscriptionService.updatePlan(plan._id, {
        ...plan,
        isActive: updatedStatus,
        status: updatedStatus ? 'active' : 'hide'
      });
      toast.success(`Plan marked as ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan status');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Subscriptions</h1>
            <p className="text-gray-500">Manage plans and view revenue transactions</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => navigate('/admin/vendor-subscriptions/plans')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'plans' ? 'bg-[#347989] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Plans
            </button>
            <button
              onClick={() => navigate('/admin/vendor-subscriptions/transactions')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'transactions' ? 'bg-[#347989] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Transactions
            </button>
          </div>
        </div>

        {/* Stats Section - Show only on Transactions Tab */}
        {activeTab === 'transactions' && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Total Revenue</div>
              <div className="text-3xl font-black text-[#347989]">₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Total Transactions</div>
              <div className="text-3xl font-black text-gray-900">{stats?.transactionCount || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
              <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Date Filter</div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-100 bg-gray-50 outline-none focus:ring-1 focus:ring-[#347989]"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-100 bg-gray-50 outline-none focus:ring-1 focus:ring-[#347989]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' ? (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <FiPlus /> Create New Plan
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#347989] mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Fetching records...</p>
          </div>
        ) : activeTab === 'plans' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(plan, e)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                        plan.isActive
                          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                      }`}
                      title={`Click to toggle status (Currently ${plan.isActive ? 'Active' : 'Inactive'})`}
                    >
                      <span className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 text-sm">/ {plan.duration} days</span>
                  </div>
                </div>
                
                <div className="p-6 flex-grow">
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <FiCheck className="text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="px-3 py-2 rounded-lg border border-red-100 bg-white text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{tx.vendorId?.businessName || tx.vendorId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{tx.vendorId?.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-700">{tx.planId?.name}</div>
                        <div className="text-xs text-gray-500">{tx.planId?.duration} days</div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">₹{tx.amount}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">{tx.razorpay_payment_id}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          {tx.status?.toUpperCase() || 'CAPTURED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-gray-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900">{((pagination.page - 1) * 10) + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> records
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1 mx-2">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pagination.totalPages <= 7 ||
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                              pagination.page === pageNum
                                ? 'bg-[#347989] text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {plans.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FiInfo className="mx-auto text-gray-300 w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No plans found</h3>
            <p className="text-gray-500">Create your first subscription plan to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#347989] outline-none"
                    placeholder="e.g. Premium Partner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#347989] outline-none"
                    placeholder="999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#347989] outline-none"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#347989] outline-none"
                  rows="2"
                  placeholder="Short description of the plan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Features (Comma separated)</label>
                <textarea
                  required
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#347989] outline-none"
                  rows="3"
                  placeholder="Unlimited leads, Priority listing, 24/7 support"
                />
              </div>

              <div 
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer select-none hover:bg-gray-100/80 transition-all"
              >
                <div>
                  <span className="text-sm font-bold text-gray-800 block">
                    Plan Status ({formData.isActive ? 'ACTIVE' : 'INACTIVE'})
                  </span>
                  <span className="text-xs text-gray-500">Enable or disable this plan for vendor subscription</span>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-[#347989]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>

              <div 
                onClick={() => setFormData(prev => ({ ...prev, isPopular: !prev.isPopular }))}
                className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 cursor-pointer select-none hover:bg-amber-100/50 transition-all"
              >
                <div>
                  <span className="text-sm font-bold text-gray-800 block">
                    Mark as "Most Popular"
                  </span>
                  <span className="text-xs text-gray-500">Display "MOST POPULAR" highlighted badge on vendor plans</span>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    formData.isPopular ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isPopular ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  {currentPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSubscriptionManagement;
