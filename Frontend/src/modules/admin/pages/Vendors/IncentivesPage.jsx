import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiSearch, FiCalendar, FiDollarSign, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminVendorService from '../../../../services/adminVendorService';
import CardShell from '../UserCategories/components/CardShell';
import Modal from '../UserCategories/components/Modal';

const IncentivesPage = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('give_incentive'); // 'give_incentive' or 'history'
  
  // Set default date range to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Incentive Modal state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminVendorService.getVendorIncentiveStats({
        startDate,
        endDate
      });
      if (response.success) {
        setStats(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch incentive stats');
      }
    } catch (error) {
      console.error('Error fetching incentive stats:', error);
      toast.error('Failed to load incentive data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await adminVendorService.getIncentiveHistory();
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching incentive history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenIncentiveModal = (vendor) => {
    setSelectedVendor(vendor);
    setAmount('');
    setNotes('');
    setIsIncentiveModalOpen(true);
  };

  const handleAwardIncentive = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setSubmitting(true);
      const response = await adminVendorService.giveVendorIncentive(selectedVendor.id, {
        amount: parseFloat(amount),
        notes
      });
      if (response.success) {
        toast.success(response.message || 'Incentive credited successfully!');
        setIsIncentiveModalOpen(false);
        fetchStats();
        fetchHistory();
      } else {
        toast.error(response.message || 'Failed to award incentive');
      }
    } catch (error) {
      console.error('Award incentive error:', error);
      toast.error(error.response?.data?.message || 'Error occurred while awarding incentive');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStats = stats.filter(vendor => {
    const term = searchQuery.toLowerCase();
    return (
      vendor.name?.toLowerCase().includes(term) ||
      vendor.businessName?.toLowerCase().includes(term) ||
      vendor.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Incentives</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyze vendor performance over custom dates and award financial incentives.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('give_incentive')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'give_incentive'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Award Incentive
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Incentive History
        </button>
      </div>

      {activeTab === 'give_incentive' && (
        <>
          {/* Filters Card */}
          <CardShell>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Search Vendor
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name, Business or Phone..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Start Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  End Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardShell>

          {/* Vendors List Table */}
          <CardShell>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <span className="text-gray-500 dark:text-gray-400">Loading vendor records...</span>
              </div>
            ) : filteredStats.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No matching vendors found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-255 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Available Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Dues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rating (Selected Period)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Bookings (Selected Period)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredStats.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-55/50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {vendor.businessName || vendor.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vendor.name && vendor.businessName ? `${vendor.name} • ` : ''}{vendor.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            ₹{vendor.earnings.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600 dark:text-red-400">
                            ₹{vendor.dues.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {vendor.averageRating > 0 ? vendor.averageRating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {vendor.bookingsCount} Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenIncentiveModal(vendor)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                          >
                            <FiAward className="w-3.5 h-3.5" />
                            Incentive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardShell>
        </>
      )}

      {activeTab === 'history' && (
        /* Incentive Award History */
        <div className="space-y-3">
          <CardShell>
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FiLoader className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No incentives have been awarded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {history.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {tx.vendor?.businessName || tx.vendor?.name || 'Deleted Vendor'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {tx.vendor?.name && tx.vendor?.businessName ? `${tx.vendor?.name} • ` : ''}{tx.vendor?.phone || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            + ₹{tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-950 dark:text-gray-200 max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(tx.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardShell>
        </div>
      )}

      {/* Award Incentive Modal */}
      <Modal
        isOpen={isIncentiveModalOpen}
        onClose={() => setIsIncentiveModalOpen(false)}
        title={`Award Incentive to ${selectedVendor?.businessName || selectedVendor?.name}`}
      >
        <form onSubmit={handleAwardIncentive} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Incentive Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Completed 50+ jobs in June with 4.8+ rating"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsIncentiveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-250 dark:bg-gray-850 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Credit Incentive'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncentivesPage;
