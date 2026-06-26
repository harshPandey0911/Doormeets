import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiMapPin, FiPhone, FiMail, FiClock, FiFileText, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const SOSAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all', 'user', 'vendor'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/sos/logs');
      if (res.data.success) {
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching SOS logs:', err);
      toast.error('Failed to load SOS logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh logs every 20 seconds
    const interval = setInterval(fetchLogs, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    
    setResolving(true);
    try {
      const res = await api.put(`/admin/sos/${selectedAlert._id}/resolve`, { notes: resolveNotes });
      if (res.data.success) {
        toast.success('SOS Alert resolved successfully');
        setAlerts(prev => prev.map(a => a._id === selectedAlert._id ? { ...a, status: 'resolved', notes: resolveNotes, resolvedAt: new Date() } : a));
        setSelectedAlert(null);
        setResolveNotes('');
      }
    } catch (err) {
      console.error('Error resolving SOS:', err);
      toast.error('Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const statusMatches = filter === 'all' || alert.status === filter;
    const typeMatches = userTypeFilter === 'all' || (alert.userType || 'user') === userTypeFilter;
    
    let searchStr = '';
    if (alert.userType === 'vendor') {
      const vendor = alert.vendorId || {};
      searchStr = `${vendor.businessName || ''} ${vendor.name || ''} ${vendor.phone || ''} ${vendor.email || ''}`.toLowerCase();
    } else {
      const user = alert.userId || {};
      searchStr = `${user.name || ''} ${user.phone || ''} ${user.email || ''}`.toLowerCase();
    }
    const searchMatches = search.trim() === '' || searchStr.includes(search.toLowerCase());
    
    return statusMatches && typeMatches && searchMatches;
  });

  return (
    <div className="space-y-6">
      {/* Alarm Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4">
          <FiAlertTriangle className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              Emergency Services
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">SOS Alarms & Logs</h1>
            <p className="text-white/80 max-w-xl text-sm leading-relaxed">
              Monitor, investigate, and log resolution details for emergency SOS alerts triggered by customers and vendors.
            </p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 animate-pulse">
            <FiAlertTriangle className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
          <div className="flex gap-2">
            {['all', 'pending', 'resolved'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === t
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t === 'all' ? 'All Statuses' : `${t} Alerts`}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All Users' },
              { value: 'user', label: 'Customers' },
              { value: 'vendor', label: 'Vendors' }
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setUserTypeFilter(t.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  userTypeFilter === t.value
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-xs"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">User / Vendor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Coordinates / Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-xs text-gray-500">Loading SOS logs...</td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-xs text-gray-500">No SOS events logged</td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert._id} className={`${alert.status === 'pending' ? 'bg-red-50/20' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <td className="px-6 py-4">
                      {alert.userType === 'vendor' ? (
                        <>
                          <div className="font-bold text-gray-900 text-xs">
                            {alert.vendorId?.businessName || alert.vendorId?.name || 'Unknown Vendor'}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold uppercase rounded">Vendor</span>
                            <span className="text-[10px] text-gray-400">ID: {alert._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-gray-900 text-xs">
                            {alert.userId?.name || 'Unknown User'}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold uppercase rounded">Customer</span>
                            <span className="text-[10px] text-gray-400">ID: {alert._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <FiPhone className="w-3 h-3 text-gray-400" />
                        <span>
                          {alert.userType === 'vendor' 
                            ? (alert.vendorId?.phone || 'No Phone') 
                            : (alert.userId?.phone || 'No Phone')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <FiMail className="w-3 h-3 text-gray-400" />
                        <span>
                          {alert.userType === 'vendor' 
                            ? (alert.vendorId?.email || 'No Email') 
                            : (alert.userId?.email || 'No Email')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <FiClock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(alert.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {alert.lat && alert.lng ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-100 transition-colors"
                        >
                          <FiMapPin className="w-3.5 h-3.5" />
                          <span>View on Maps</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Coordinates unavailable</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        alert.status === 'pending'
                          ? 'bg-red-100 text-red-700 animate-pulse'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {alert.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 font-medium">
                          <span className="block font-bold">Resolved</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1" title={alert.notes}>{alert.notes}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Dialog Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-gray-100 mx-4 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <FiAlertTriangle className="w-6 h-6 animate-bounce" />
                <h3 className="text-lg font-bold">Resolve SOS Alarm</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Confirming resolution details for <strong>{selectedAlert.userType === 'vendor' ? (selectedAlert.vendorId?.businessName || selectedAlert.vendorId?.name) : selectedAlert.userId?.name}</strong>'s alarm at {new Date(selectedAlert.createdAt).toLocaleTimeString()}. Log investigative details below.
              </p>

              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Resolution Notes</label>
                  <textarea
                    required
                    rows="3"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Enter what actions were taken (e.g. contacted customer/vendor, called local police desk)..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-red-500 resize-none font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlert(null);
                      setResolveNotes('');
                    }}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolving}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {resolving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Resolve Alarm</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SOSAlerts;
