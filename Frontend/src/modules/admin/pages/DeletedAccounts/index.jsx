import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUser, FiTruck, FiSmile, FiSearch, FiCalendar, FiClock, FiDollarSign, FiEye, FiX, FiActivity, FiTag, FiTrendingUp } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const DeletedAccountsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], vendors: [], workers: [], shopOwners: [] });
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/deleted-accounts');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error('Failed to load deleted accounts.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching deleted accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewHistory = async (tabName, id) => {
    let role = tabName;
    if (tabName === 'users') role = 'user';
    if (tabName === 'vendors') role = 'vendor';
    if (tabName === 'workers') role = 'worker';
    if (tabName === 'shopOwners') role = 'shopOwner';

    setHistoryLoading(true);
    setSelectedAccount({ role: tabName, id });
    setHistoryData(null);
    try {
      const response = await api.get(`/admin/deleted-accounts/${role}/${id}/history`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      } else {
        toast.error('Failed to load history details.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading account history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get current tab accounts list
  const getAccountsList = () => {
    if (activeTab === 'users') return data.users;
    if (activeTab === 'vendors') return data.vendors;
    if (activeTab === 'workers') return data.workers;
    if (activeTab === 'shopOwners') return data.shopOwners;
    return [];
  };

  // Filter accounts by search query
  const filteredAccounts = getAccountsList().filter(acc => {
    const query = searchQuery.toLowerCase();
    return (
      acc.name?.toLowerCase().includes(query) ||
      acc.phone?.toLowerCase().includes(query) ||
      acc.email?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Deleted Accounts Dashboard</h2>
          <p className="text-sm text-gray-500">Track and inspect deleted users, vendors, workers, and shop owners</p>
        </div>
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: 'users', label: 'Deleted Users', count: data.users.length },
          { id: 'vendors', label: 'Deleted Vendors', count: data.vendors.length },
          { id: 'workers', label: 'Deleted Workers', count: data.workers.length },
          { id: 'shopOwners', label: 'Shop Owners', count: data.shopOwners.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full font-mono">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No deleted accounts found in this tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <motion.div
              layout
              key={account._id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <FiUser className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{account.name}</h3>
                    <p className="text-xs text-red-600 font-medium">Deleted on {formatDate(account.deletedAt)}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <p><strong>Phone:</strong> {account.phone}</p>
                  {account.email && <p><strong>Email:</strong> {account.email}</p>}
                  {account.businessName && <p><strong>Business:</strong> {account.businessName}</p>}
                </div>

                <button
                  onClick={() => handleViewHistory(activeTab, account._id)}
                  className="w-full py-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-gray-100 hover:border-red-100 transition-all active:scale-[0.98]"
                >
                  <FiEye className="w-3.5 h-3.5" />
                  Inspect History & Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* History Details Slide-over Modal */}
      <AnimatePresence>
        {selectedAccount && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAccount(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Account Inspection</h3>
                  <p className="text-xs text-gray-500">History log for selected deleted record</p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-500">Retrieving full logs...</p>
                  </div>
                ) : historyData ? (
                  <>
                    {/* Basic Profile Details card */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50/30 rounded-2xl p-5 border border-red-100/50 space-y-4">
                      <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">Deleted Profile Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Full Name</p>
                          <p className="font-bold text-gray-800 text-sm mt-0.5">{historyData.details.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Phone Number</p>
                          <p className="font-bold text-gray-800 text-sm mt-0.5">{historyData.details.phone}</p>
                        </div>
                        {historyData.details.email && (
                          <div>
                            <p className="text-gray-400">Email Address</p>
                            <p className="font-bold text-gray-800 mt-0.5">{historyData.details.email}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400">Account Created</p>
                          <p className="font-bold text-gray-800 mt-0.5">{formatDate(historyData.details.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking History Section */}
                    {selectedAccount.role !== 'shopOwner' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <FiActivity className="text-red-500 w-4 h-4" />
                            Booking Activity Log ({historyData.history?.length || 0})
                          </h4>
                        </div>

                        {historyData.history?.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400">No bookings logged for this account.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {historyData.history.map((booking) => (
                              <div
                                key={booking._id}
                                className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-red-100 transition-all flex justify-between items-start gap-4"
                              >
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-600">{booking.bookingNumber}</span>
                                  <h5 className="text-xs font-bold text-gray-800 mt-1">
                                    {booking.vendorId ? `Partner: ${booking.vendorId.name}` : `Client: ${booking.userId?.name}`}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <FiCalendar className="w-3 h-3" />
                                    {booking.scheduledDate} ({booking.scheduledTime || booking.timeSlot?.start})
                                  </p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-xs font-extrabold text-gray-800">₹{booking.finalAmount || booking.totalAmount}</p>
                                  <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                    booking.status === 'completed'
                                      ? 'bg-green-50 text-green-700'
                                      : booking.status === 'cancelled'
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-yellow-50 text-yellow-700'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Shop Owner referred vendors and transactions
                      <div className="space-y-6">
                        {/* Referred Vendors list */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <FiSmile className="text-red-500 w-4 h-4" />
                            Referred Partner Partners ({historyData.history?.referredVendors?.length || 0})
                          </h4>
                          {historyData.history?.referredVendors?.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <p className="text-xs text-gray-400">No referred partners.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {historyData.history.referredVendors.map((vendor) => (
                                <div key={vendor._id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                                  <p className="font-bold text-gray-800">{vendor.name}</p>
                                  <p className="text-[10px] text-gray-500">{vendor.phone}</p>
                                  <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold uppercase">{vendor.approvalStatus}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Transactions list */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <FiTrendingUp className="text-red-500 w-4 h-4" />
                            Transaction Ledgers ({historyData.history?.transactions?.length || 0})
                          </h4>
                          {historyData.history?.transactions?.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <p className="text-xs text-gray-400">No wallet transactions logged.</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {historyData.history.transactions.map((tx) => (
                                <div key={tx._id} className="p-3 bg-white border border-gray-100 rounded-xl text-xs flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-gray-800 capitalize">{tx.type.replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(tx.createdAt)}</p>
                                  </div>
                                  <span className={`font-extrabold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center">No logs retrieved.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeletedAccountsDashboard;
