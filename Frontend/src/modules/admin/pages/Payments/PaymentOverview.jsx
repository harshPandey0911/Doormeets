import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiPercent,
  FiX,
  FiCreditCard
} from 'react-icons/fi';
import { adminTransactionService } from '../../../../services/adminTransactionService';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../../../utils/csvExport';

const PaymentOverview = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    totalGST: 0,
    totalCGST: 0,
    totalSGST: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── NEW: Tab and Breakdown States ──
  const [activeTab, setActiveTab] = useState('transactions');
  const [vendors, setVendors] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownPagination, setBreakdownPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [breakdownFilters, setBreakdownFilters] = useState({
    search: '',
    taxType: 'all',
    vendorId: 'all'
  });
  const [debouncedBreakdownSearch, setDebouncedBreakdownSearch] = useState('');
  const [selectedTaxDetails, setSelectedTaxDetails] = useState(null);

  // Sync pathname to activeTab
  useEffect(() => {
    if (window.location.pathname.endsWith('/taxes')) {
      setActiveTab('taxes');
    }
  }, [window.location.pathname]);

  // Debounce search for transactions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Debounce search for breakdown
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBreakdownSearch(breakdownFilters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [breakdownFilters.search]);

  // Fetch vendors list for filters on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await adminTransactionService.getVendorBalances();
        if (res.success) {
          setVendors(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching vendors for filter:', err);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchData();
    }
  }, [pagination.page, debouncedSearch, filters.status, filters.type, activeTab]);

  useEffect(() => {
    if (activeTab === 'commissions' || activeTab === 'taxes') {
      fetchBreakdownData();
    }
  }, [breakdownPagination.page, debouncedBreakdownSearch, breakdownFilters.taxType, breakdownFilters.vendorId, activeTab]);

  const fetchBreakdownData = async () => {
    try {
      setBreakdownLoading(true);
      const res = await adminTransactionService.getEarningsBreakdown({
        page: breakdownPagination.page,
        limit: breakdownPagination.limit,
        search: debouncedBreakdownSearch,
        taxType: breakdownFilters.taxType,
        vendorId: breakdownFilters.vendorId
      });
      if (res.success) {
        setBreakdownData(res.data);
        setBreakdownPagination(prev => ({
          ...prev,
          total: res.pagination.total,
          pages: res.pagination.pages
        }));
      }
    } catch (err) {
      console.error('Error fetching breakdown data:', err);
      toast.error('Failed to load earnings breakdown');
    } finally {
      setBreakdownLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stats and transactions in parallel
      const [statsRes, transactionsRes] = await Promise.all([
        adminTransactionService.getTransactionStats(),
        adminTransactionService.getAllTransactions({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          status: filters.status,
          type: filters.type
        })
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data);
        setPagination(prev => ({
          ...prev,
          total: transactionsRes.pagination.total,
          pages: transactionsRes.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'pending': return <FiClock className="w-3.5 h-3.5 mr-1" />;
      case 'failed': return <FiXCircle className="w-3.5 h-3.5 mr-1" />;
      case 'refunded': return <FiAlertCircle className="w-3.5 h-3.5 mr-1" />;
      default: return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'credit': return 'text-green-600 bg-green-50 border-green-100';
      case 'payment': return 'text-blue-600 bg-blue-50 border-blue-100'; // Online Payment
      case 'cash_collected': return 'text-amber-600 bg-amber-50 border-amber-100'; // Cash
      case 'debit': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'refund': return 'text-purple-600 bg-purple-50 border-purple-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  // Export transactions to CSV
  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    exportToCSV(transactions, 'payment_transactions', [
      { key: '_id', label: 'Transaction ID' },
      { key: 'userId.name', label: 'User Name' },
      { key: 'userId.phone', label: 'Phone' },
      { key: 'userId.email', label: 'Email' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date', type: 'datetime' },
      { key: 'razorpayOrderId', label: 'Razorpay Order ID' },
      { key: 'referenceId', label: 'Reference ID' },
      { key: 'description', label: 'Description' }
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <FiDollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Refunds</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRefunds)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <FiTrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Net Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.netRevenue)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <FiTrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* GST, CGST, and SGST Cards */}
        <div 
          onClick={() => {
            setActiveTab('taxes');
            setBreakdownFilters(prev => ({ ...prev, taxType: 'gst' }));
          }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200"
        >
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total GST</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalGST || 0)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <FiPercent className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => {
            setActiveTab('taxes');
            setBreakdownFilters(prev => ({ ...prev, taxType: 'cgst' }));
          }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all duration-200"
        >
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total CGST</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalCGST || 0)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FiPercent className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => {
            setActiveTab('taxes');
            setBreakdownFilters(prev => ({ ...prev, taxType: 'sgst' }));
          }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-teal-300 transition-all duration-200"
        >
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total SGST</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalSGST || 0)}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <FiPercent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-2 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={() => { setActiveTab('transactions'); }}
          className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FiCreditCard className="w-4 h-4" /> Transactions Overview
        </button>
        <button
          onClick={() => { setActiveTab('commissions'); }}
          className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'commissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FiDollarSign className="w-4 h-4" /> Commission Earnings
        </button>
        <button
          onClick={() => { setActiveTab('taxes'); }}
          className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'taxes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FiPercent className="w-4 h-4" /> Tax Earnings
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          {/* Filters & Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="credit">Credit (Platform)</option>
                <option value="debit">Debit (Wallet)</option>
                <option value="payment">Online Payment</option>
                <option value="cash_collected">Cash Collected</option>
                <option value="refund">Refund</option>
              </select>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User / Entity</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Loading transactions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        <p className="text-sm">No transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-xs font-mono text-gray-500">#{tx._id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {tx.userId?.name || tx.vendorId?.businessName || tx.vendorId?.name || tx.workerId?.name || 'Unknown'}
                              </span>
                              {tx.userId && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">User</span>}
                              {tx.vendorId && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">Vendor</span>}
                              {tx.workerId && <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium">Worker</span>}
                            </div>
                            <span className="text-xs text-gray-400">
                              {tx.userId?.email || tx.vendorId?.email || tx.workerId?.email || ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(tx.type)}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-semibold ${['credit', 'payment', 'cash_collected'].includes(tx.type) ? 'text-green-600' : 'text-gray-800'}`}>
                            {['credit', 'payment', 'cash_collected'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            <span className="capitalize">{tx.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-400 font-mono" title={tx.razorpayOrderId || tx.referenceId}>
                            {(tx.razorpayOrderId || tx.referenceId || '-').slice(0, 10)}...
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && transactions.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-500">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'commissions' && (
        <>
          {/* Commission Filters & Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Booking # or User..."
                value={breakdownFilters.search}
                onChange={(e) => setBreakdownFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={breakdownFilters.vendorId}
                onChange={(e) => setBreakdownFilters(prev => ({ ...prev, vendorId: e.target.value }))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500 w-full sm:w-56"
              >
                <option value="all">All Vendors</option>
                {vendors.map(v => (
                  <option key={v.vendorId?._id || v.vendorId} value={v.vendorId?._id || v.vendorId}>
                    {v.vendorId?.businessName || v.vendorId?.name || 'Unknown Vendor'}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  exportToCSV(breakdownData, 'commission_earnings', [
                    { key: 'bookingNumber', label: 'Booking Number' },
                    { key: 'createdAt', label: 'Completed Date', type: 'datetime' },
                    { key: 'vendor.businessName', label: 'Vendor' },
                    { key: 'vendorLevel', label: 'Vendor Level' },
                    { key: 'customerPay', label: 'Customer Pay', type: 'currency' },
                    { key: 'vendorPayoutBase', label: 'Vendor Base', type: 'currency' },
                    { key: 'platformCommissionAmount', label: 'Platform Commission', type: 'currency' },
                    { key: 'levelCommissionAmount', label: 'Level Commission', type: 'currency' },
                    { key: 'totalCommissionEarned', label: 'Total Earnings', type: 'currency' }
                  ]);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Commission Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Number</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor / Level</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Pay</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Base</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Comm</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level Comm</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Commission</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdownLoading ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Loading commission details...</p>
                        </div>
                      </td>
                    </tr>
                  ) : breakdownData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-gray-500">
                        <p className="text-sm">No commission records found</p>
                      </td>
                    </tr>
                  ) : (
                    breakdownData.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-800">#{row.bookingNumber}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{row.vendor?.businessName || row.vendor?.name || '—'}</span>
                            <span className="text-xs text-indigo-600 font-bold uppercase">{row.vendorLevel} Vendor</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-700">{formatCurrency(row.customerPay)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatCurrency(row.vendorPayoutBase)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatCurrency(row.platformCommissionAmount)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatCurrency(row.levelCommissionAmount)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(row.totalCommissionEarned)}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Commission Pagination */}
            {!breakdownLoading && breakdownData.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-500">
                  Showing <span className="font-medium">{((breakdownPagination.page - 1) * breakdownPagination.limit) + 1}</span> to <span className="font-medium">{Math.min(breakdownPagination.page * breakdownPagination.limit, breakdownPagination.total)}</span> of <span className="font-medium">{breakdownPagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBreakdownPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={breakdownPagination.page === 1}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setBreakdownPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={breakdownPagination.page === breakdownPagination.pages}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'taxes' && (
        <>
          {/* Tax Filters & Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Booking # or User..."
                value={breakdownFilters.search}
                onChange={(e) => setBreakdownFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={breakdownFilters.taxType}
                onChange={(e) => setBreakdownFilters(prev => ({ ...prev, taxType: e.target.value }))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Taxes</option>
                <option value="gst">Platform GST (18%)</option>
                <option value="cgst">Vendor CGST (2.5%)</option>
                <option value="sgst">Vendor SGST (2.5%)</option>
              </select>

              <select
                value={breakdownFilters.vendorId}
                onChange={(e) => setBreakdownFilters(prev => ({ ...prev, vendorId: e.target.value }))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500 w-full sm:w-56"
              >
                <option value="all">All Vendors</option>
                {vendors.map(v => (
                  <option key={v.vendorId?._id || v.vendorId} value={v.vendorId?._id || v.vendorId}>
                    {v.vendorId?.businessName || v.vendorId?.name || 'Unknown Vendor'}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  exportToCSV(breakdownData, 'tax_earnings', [
                    { key: 'bookingNumber', label: 'Booking Number' },
                    { key: 'createdAt', label: 'Date', type: 'datetime' },
                    { key: 'customerPay', label: 'Customer Pay', type: 'currency' },
                    { key: 'adminGrossShare', label: 'Admin Gross Share', type: 'currency' },
                    { key: 'platformGstAmount', label: 'Platform GST (18%)', type: 'currency' },
                    { key: 'vendorPayoutBase', label: 'Vendor Base', type: 'currency' },
                    { key: 'vendorCgstAmount', label: 'Vendor CGST (2.5%)', type: 'currency' },
                    { key: 'vendorSgstAmount', label: 'Vendor SGST (2.5%)', type: 'currency' },
                    { key: 'totalGstCalculated', label: 'Total Tax', type: 'currency' }
                  ]);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Tax Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Number</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CGST (2.5%)</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SGST (2.5%)</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform GST (18%)</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tax</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Details</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdownLoading ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Loading tax details...</p>
                        </div>
                      </td>
                    </tr>
                  ) : breakdownData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        <p className="text-sm">No tax records found</p>
                      </td>
                    </tr>
                  ) : (
                    breakdownData.map((row) => (
                      <tr 
                        key={row._id} 
                        onClick={() => setSelectedTaxDetails(row)}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-gray-800">#{row.bookingNumber}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{row.serviceName || 'General Service'}</td>
                        <td className="py-3 px-4 text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{row.user?.name || '—'}</span>
                            <span className="text-[10px] text-gray-400">{row.user?.email || ''}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-semibold">{formatCurrency(row.vendorCgstAmount)}</td>
                        <td className="py-3 px-4 text-gray-600 font-semibold">{formatCurrency(row.vendorSgstAmount)}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">{formatCurrency(row.platformGstAmount)}</td>
                        <td className="py-3 px-4 font-extrabold text-blue-700">{formatCurrency(row.totalGstCalculated)}</td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{row.vendor?.businessName || row.vendor?.name || '—'}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs font-mono">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tax Pagination */}
            {!breakdownLoading && breakdownData.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-500">
                  Showing <span className="font-medium">{((breakdownPagination.page - 1) * breakdownPagination.limit) + 1}</span> to <span className="font-medium">{Math.min(breakdownPagination.page * breakdownPagination.limit, breakdownPagination.total)}</span> of <span className="font-medium">{breakdownPagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBreakdownPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={breakdownPagination.page === 1}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setBreakdownPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={breakdownPagination.page === breakdownPagination.pages}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Dynamic Tax Details Modal */}
      {selectedTaxDetails && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedTaxDetails(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <FiPercent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tax Breakdown Details</h3>
                <p className="text-xs text-gray-400">Booking #{selectedTaxDetails.bookingNumber}</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              {/* Service & Customer */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Service</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedTaxDetails.serviceName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Customer</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedTaxDetails.user?.name || '—'}</span>
                  {selectedTaxDetails.user?.phone && (
                    <span className="text-xs text-gray-400 block">{selectedTaxDetails.user.phone}</span>
                  )}
                </div>
              </div>

              {/* Tax Table Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tax Distribution</span>
                
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-gray-500">Platform GST (18%)</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(selectedTaxDetails.platformGstAmount)}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-gray-500">Vendor CGST (2.5%)</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(selectedTaxDetails.vendorCgstAmount)}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-gray-500">Vendor SGST (2.5%)</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(selectedTaxDetails.vendorSgstAmount)}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm bg-blue-50/30 font-bold">
                    <span className="text-blue-700">Total GST Earning</span>
                    <span className="text-blue-700">{formatCurrency(selectedTaxDetails.totalGstCalculated)}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <span className="text-gray-400 block">Customer Paid</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(selectedTaxDetails.customerPay)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Vendor Payout Base</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(selectedTaxDetails.vendorPayoutBase)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button 
                onClick={() => setSelectedTaxDetails(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentOverview;