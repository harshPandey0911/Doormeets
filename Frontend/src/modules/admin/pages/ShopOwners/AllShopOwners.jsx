import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiUser, FiPhone, FiCheck, FiX, FiDollarSign, FiLayers, FiActivity } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const AllShopOwners = () => {
  const [shopOwners, setShopOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedShop, setSelectedShop] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('credit');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchShopOwners = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response = await api.get('/admin/shop-owners', { params });

      if (response.data.success) {
        setShopOwners(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching shop owners:', error);
      toast.error('Failed to load shop owners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOwners();
  }, [page, search, statusFilter]);

  const handleStatusToggle = async (shopId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this shop owner?`)) {
      return;
    }

    try {
      const response = await api.put(`/admin/shop-owners/${shopId}/status`, { isActive: !currentStatus });

      if (response.data.success) {
        toast.success(response.data.message);
        setShopOwners(shopOwners.map(shop =>
          shop._id === shopId ? { ...shop, isActive: !currentStatus } : shop
        ));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleOpenWalletModal = (shop) => {
    setSelectedShop(shop);
    setAdjustAmount('');
    setAdjustType('credit');
    setAdjustDescription('');
    setShowWalletModal(true);
  };

  const handleAdjustWalletSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || Number(adjustAmount) <= 0 || !adjustDescription) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    try {
      setAdjusting(true);
      const response = await api.post(`/admin/shop-owners/${selectedShop._id}/wallet-adjust`, {
        amount: Number(adjustAmount),
        type: adjustType,
        description: adjustDescription
      });

      if (response.data.success) {
        toast.success('Wallet balance adjusted successfully');
        setShowWalletModal(false);
        fetchShopOwners();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Wallet adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const handleOpenDetails = async (shop) => {
    setSelectedShop(shop);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setDetailsData(null);

    try {
      const response = await api.get(`/admin/shop-owners/${shop._id}`);
      if (response.data.success) {
        setDetailsData(response.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shop details');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, or shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-xs text-gray-700"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold focus:outline-none cursor-pointer text-xs"
        >
          <option value="all">All Merchants</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3.5">Merchant</th>
                <th className="px-6 py-3.5">Shop Name</th>
                <th className="px-6 py-3.5">Phone / Email</th>
                <th className="px-6 py-3.5">Referral Code</th>
                <th className="px-6 py-3.5">Referrals Count</th>
                <th className="px-6 py-3.5">Wallet Balance</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : shopOwners.length > 0 ? (
                shopOwners.map((shop) => (
                  <tr key={shop._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-800">{shop.name}</td>
                    <td className="px-6 py-3.5 text-gray-500 font-semibold">{shop.businessName || 'N/A'}</td>
                    <td className="px-6 py-3.5">
                      <p className="text-gray-700 font-medium">{shop.phone}</p>
                      <p className="text-[10px] text-gray-400">{shop.email || ''}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {shop.referralCode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 font-semibold">
                      {shop.referralsCount || 0}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-800">
                      ₹{shop.wallet?.balance || 0}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleStatusToggle(shop._id, shop.isActive)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          shop.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenWalletModal(shop)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition cursor-pointer"
                          title="Adjust Wallet"
                        >
                          <FiDollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetails(shop)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <FiLayers className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    No shop owners found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-50 flex items-center justify-between text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="font-medium text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Adjust Wallet Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-sm w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Adjust Wallet: {selectedShop?.name}</h3>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdjustWalletSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('credit')}
                      className={`py-2 rounded-lg font-bold transition text-xs cursor-pointer ${
                        adjustType === 'credit'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border border-transparent'
                      }`}
                    >
                      Credit (Add Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('debit')}
                      className={`py-2 rounded-lg font-bold transition text-xs cursor-pointer ${
                        adjustType === 'debit'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-gray-50 text-gray-500 border border-transparent'
                      }`}
                    >
                      Debit (Deduct Cash)
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="adjustAmount" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Amount (₹)</label>
                  <input
                    id="adjustAmount"
                    type="number"
                    required
                    placeholder="Enter amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-700 transition"
                  />
                </div>

                <div>
                  <label htmlFor="adjustDesc" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reason/Description</label>
                  <textarea
                    id="adjustDesc"
                    required
                    rows="3"
                    placeholder="Reason for adjustment"
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-700 transition"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {adjusting ? 'Processing...' : 'Apply'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details / Referrals Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Merchant Account Details: {selectedShop?.name}</h3>
                  <p className="text-[10px] text-gray-400">View wallet ledger and referred vendors list.</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ledger / Transactions */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-xs border-b border-gray-100 pb-1.5 flex items-center space-x-1.5">
                      <FiActivity className="text-blue-600" />
                      <span>Wallet Ledger</span>
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {detailsData?.transactions && detailsData.transactions.length > 0 ? (
                        detailsData.transactions.map((tx) => (
                          <div key={tx._id} className="p-2 border border-gray-100 rounded-lg bg-gray-50/50 flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-bold text-gray-800">{tx.description}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold text-xs ${tx.type === 'shop_referral_earned' || tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.type === 'shop_referral_earned' || tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 py-4 text-center">No wallet logs.</p>
                      )}
                    </div>
                  </div>

                  {/* Onboarded Vendors */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-xs border-b border-gray-100 pb-1.5 flex items-center space-x-1.5">
                      <FiUser className="text-blue-600" />
                      <span>Referred Vendors ({detailsData?.referrals?.length || 0})</span>
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {detailsData?.referrals && detailsData.referrals.length > 0 ? (
                        detailsData.referrals.map((v) => (
                          <div key={v._id} className="p-2 border border-gray-100 rounded-lg flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-bold text-gray-800">{v.name}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Phone: {v.phone}</p>
                            </div>
                            <div>
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                                v.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                v.approvalStatus === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {v.approvalStatus}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 py-4 text-center">No vendors referred.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllShopOwners;
