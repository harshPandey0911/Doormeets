import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiRefreshCw, FiLoader, FiMapPin, FiMoreVertical,
  FiCheckCircle, FiX, FiActivity, FiAlertTriangle, FiClock, FiXCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminBookingService } from '../../../../services/adminBookingService';
import adminVendorService from '../../../../services/adminVendorService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending_admin:  { label: 'Needs Assignment', cls: 'bg-amber-100 text-amber-700' },
  no_vendors:     { label: 'No Vendors / Closed', cls: 'bg-red-100 text-red-700' },
  cancelled:      { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
  completed:      { label: 'Completed', cls: 'bg-green-100 text-green-700' },
  work_done:      { label: 'Work Done', cls: 'bg-green-100 text-green-700' },
  requested:      { label: 'Sent to Vendor', cls: 'bg-blue-100 text-blue-700' },
  accepted:       { label: 'Vendor Accepted', cls: 'bg-indigo-100 text-indigo-700' },
  confirmed:      { label: 'Confirmed', cls: 'bg-indigo-100 text-indigo-700' },
  in_progress:    { label: 'In Progress', cls: 'bg-purple-100 text-purple-700' },
  journey_started:{ label: 'On the Way', cls: 'bg-purple-100 text-purple-700' },
};

const getStatusMeta = (b) => {
  const s = b.status?.toLowerCase();
  return STATUS_META[s] || { label: s?.replace(/_/g, ' ') || 'Unknown', cls: 'bg-gray-100 text-gray-600' };
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Needs Assignment' },
  { key: 'sent',      label: 'Sent to Vendor' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
];

const filterBookingsByTab = (bookings, tab) => {
  switch (tab) {
    case 'pending':   return bookings.filter(b => b.status === 'pending_admin');
    case 'sent':      return bookings.filter(b => b.status === 'requested' && b.assignedByAdmin);
    case 'cancelled': return bookings.filter(b => ['cancelled', 'no_vendors'].includes(b.status?.toLowerCase()));
    case 'completed': return bookings.filter(b => ['completed', 'work_done'].includes(b.status?.toLowerCase()));
    default:          return bookings;
  }
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Reassignments = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  // Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminBookingService.getAllBookings({ manual: 'all', limit: 500 });
      if (res.success) setBookings(res.data || []);
    } catch {
      toast.error('Failed to load reassignment queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    const refresh = () => loadBookings();
    window.addEventListener('adminBookingUpdated', refresh);
    return () => window.removeEventListener('adminBookingUpdated', refresh);
  }, [loadBookings]);

  // ── Counts ───────────────────────────────────────────────────────────────────
  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === 'pending_admin').length,
    sent:      bookings.filter(b => b.status === 'requested' && b.assignedByAdmin).length,
    cancelled: bookings.filter(b => ['cancelled', 'no_vendors'].includes(b.status?.toLowerCase())).length,
    completed: bookings.filter(b => ['completed', 'work_done'].includes(b.status?.toLowerCase())).length,
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const tabFiltered = filterBookingsByTab(bookings, activeTab);
  const displayed = tabFiltered.filter(b => {
    const t = search.toLowerCase();
    return (
      (b.bookingNumber || '').toLowerCase().includes(t) ||
      (b.userId?.name || '').toLowerCase().includes(t) ||
      (b.serviceName || '').toLowerCase().includes(t) ||
      (b.address?.city || '').toLowerCase().includes(t)
    );
  });

  // ── Modal ───────────────────────────────────────────────────────────────────
  const openAssignModal = async (booking) => {
    setSelectedBooking(booking);
    setVendorSearch('');
    setShowModal(true);
    try {
      setVendorsLoading(true);
      const res = await adminVendorService.getAllVendors({ limit: 1000 });
      if (res.success) setVendors(res.data || []);
    } catch { toast.error('Could not load vendor list'); }
    finally { setVendorsLoading(false); }
  };

  const handleAssign = async (vendorId) => {
    if (!selectedBooking) return;
    try {
      setAssigning(true);
      const res = await adminBookingService.assignVendor(selectedBooking._id, vendorId);
      if (res.success) {
        toast.success('Vendor assigned! They have 1 min to respond.');
        setShowModal(false);
        loadBookings();
      } else toast.error(res.message || 'Assignment failed');
    } catch (err) { toast.error(err.message || 'Error assigning vendor'); }
    finally { setAssigning(false); }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      setCancelling(bookingId);
      const res = await adminBookingService.cancelBooking(bookingId, 'Cancelled by admin from reassignment queue');
      if (res.success) {
        toast.success('Booking cancelled');
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'no_vendors' } : b));
      } else toast.error(res.message || 'Failed to cancel');
    } catch (err) { toast.error(err?.message || 'Error cancelling'); }
    finally { setCancelling(null); }
  };

  // Vendor filtering
  const bookingCity = (selectedBooking?.address?.city || '').trim().toLowerCase();
  const allVendorsFiltered = vendors.filter(v => {
    const t = vendorSearch.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(t) ||
      (v.businessName || '').toLowerCase().includes(t) ||
      (v.phone || '').toLowerCase().includes(t)
    );
  });
  const nearbyVendors = allVendorsFiltered.filter(v =>
    bookingCity && (v.address?.city || '').trim().toLowerCase() === bookingCity
  );

  const isActive = (b) => !['cancelled', 'no_vendors', 'completed', 'work_done'].includes(b.status?.toLowerCase());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

      {/* ── Header + Tabs ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiActivity className="text-orange-500 w-4 h-4" />
            <div>
              <h2 className="text-sm font-bold text-gray-800">Reassignment Queue</h2>
              <p className="text-[10px] text-gray-400">All admin-managed bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-xs"
              />
            </div>
            <button onClick={loadBookings} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors" title="Refresh">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const cnt = counts[tab.key];
            const tabColorMap = {
              all: isActive ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
              pending: isActive ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
              sent: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
              cancelled: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
              completed: isActive ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
            };
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${tabColorMap[tab.key]}`}
              >
                {tab.label}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isActive ? 'bg-white/25' : 'bg-white/80 text-gray-500'}`}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total (₹)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <FiLoader className="w-6 h-6 animate-spin text-orange-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">Loading...</p>
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <FiCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-600">No bookings found</p>
                    <p className="text-[10px] text-gray-400 mt-1">Nothing in this category right now.</p>
                  </td>
                </tr>
              ) : (
                displayed.map(booking => {
                  const meta = getStatusMeta(booking);
                  const active = isActive(booking);
                  const s = booking.status?.toLowerCase();
                  const isWaiting = s === 'requested' && booking.bookings?.assignedByAdmin;

                  return (
                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 text-xs">
                          #{(booking.bookingNumber || booking._id?.slice(-6) || '').toUpperCase()}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 text-xs">{booking.userId?.name || 'Guest'}</p>
                        <p className="text-[10px] text-gray-400">{booking.userId?.phone}</p>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-700 max-w-[140px] truncate">
                          {booking.serviceName || booking.serviceId?.title || '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">{booking.serviceCategory || ''}</p>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                          <FiMapPin className="w-3 h-3 text-orange-400 shrink-0" />
                          {booking.address?.city || '—'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 text-xs">₹{booking.finalAmount?.toLocaleString() || '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3">
                        {booking.vendorId ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{booking.vendorId.businessName || booking.vendorId.name}</p>
                            <p className="text-[10px] text-gray-400">{booking.vendorId.phone}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Not assigned</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-600 font-medium">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <p className="text-[9px] text-gray-400">
                          {new Date(booking.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right relative">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === booking._id ? null : booking._id);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === booking._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-8 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-xl min-w-[170px] py-1 overflow-hidden">
                              {/* View Details */}
                              <button
                                onClick={() => { setOpenMenuId(null); navigate(`/admin/bookings/${booking._id}`); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Details
                              </button>

                              {/* Assign / Reassign */}
                              {active && (
                                <button
                                  onClick={() => { setOpenMenuId(null); openAssignModal(booking); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                                >
                                  <FiAlertTriangle className="w-3.5 h-3.5" />
                                  {s === 'pending_admin' ? 'Assign Vendor' : 'Reassign Vendor'}
                                </button>
                              )}

                              {/* Cancel */}
                              {active && (
                                <button
                                  onClick={() => { setOpenMenuId(null); handleCancel(booking._id); }}
                                  disabled={cancelling === booking._id}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {cancelling === booking._id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiXCircle className="w-3.5 h-3.5" />}
                                  Cancel Booking
                                </button>
                              )}

                              {/* Copy ID */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(booking.bookingNumber || booking._id);
                                  toast.success('Booking ID copied!');
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copy Booking ID
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && displayed.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
              Showing {displayed.length} booking{displayed.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Assign Vendor Modal ── */}
      <AnimatePresence>
        {showModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Assign Vendor</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Booking <span className="font-bold text-gray-700">#{selectedBooking.bookingNumber}</span>
                    {selectedBooking.address?.city && <> — <span className="font-bold text-orange-600">📍 {selectedBooking.address.city}</span></>}
                  </p>
                  {selectedBooking.cancellationReason && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-[10px] text-amber-700">
                      <span className="font-bold">Note: </span>{selectedBooking.cancellationReason}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text" value={vendorSearch} onChange={e => setVendorSearch(e.target.value)}
                  placeholder="Search vendor by name, business or phone..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px] overflow-hidden">
                {/* Nearby */}
                <div className="flex flex-col border border-orange-100 rounded-xl p-3 bg-orange-50/30">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100 mb-2">
                    <span className="font-bold text-xs text-orange-700 uppercase tracking-wider flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" /> Nearby ({selectedBooking.address?.city || 'Same City'})
                    </span>
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {vendorsLoading ? '…' : nearbyVendors.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-orange-100/50 pr-1 max-h-[350px]">
                    {vendorsLoading ? <div className="flex items-center justify-center py-12"><FiLoader className="w-5 h-5 animate-spin text-orange-500" /></div>
                      : nearbyVendors.length === 0 ? <p className="text-xs text-gray-400 text-center py-12 italic">No vendors in {selectedBooking.address?.city || 'this city'}.</p>
                      : nearbyVendors.map(v => <VendorRow key={v._id} vendor={v} onAssign={handleAssign} assigning={assigning} highlight />)
                    }
                  </div>
                </div>
                {/* All Vendors */}
                <div className="flex flex-col border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2">
                    <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">🌐 All Vendors</span>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {vendorsLoading ? '…' : allVendorsFiltered.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 max-h-[350px]">
                    {vendorsLoading ? <div className="flex items-center justify-center py-12"><FiLoader className="w-5 h-5 animate-spin text-blue-500" /></div>
                      : allVendorsFiltered.length === 0 ? <p className="text-xs text-gray-400 text-center py-12 italic">No vendors found.</p>
                      : allVendorsFiltered.map(v => <VendorRow key={v._id} vendor={v} onAssign={handleAssign} assigning={assigning} />)
                    }
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Vendor Row ────────────────────────────────────────────────────────────────
const VendorRow = ({ vendor, onAssign, assigning, highlight }) => (
  <div className="py-2.5 flex justify-between items-center text-xs gap-2">
    <div className="min-w-0">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-bold text-gray-800 truncate">{vendor.name || 'Vendor'}</span>
        <span className={`px-1.5 rounded text-[8px] font-bold capitalize shrink-0 ${vendor.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {vendor.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </div>
      {vendor.businessName && <p className="text-blue-600 font-medium text-[10px] truncate mt-0.5">{vendor.businessName}</p>}
      <p className="text-gray-400 text-[10px]">{vendor.phone}</p>
      {vendor.address?.city && <p className="text-gray-400 text-[9px] mt-0.5">📍 {vendor.address.city}</p>}
    </div>
    <button
      onClick={() => onAssign(vendor._id)}
      disabled={assigning}
      className={`px-3 py-1.5 text-white rounded-lg font-bold text-[10px] transition-colors disabled:opacity-50 shrink-0 ${highlight ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {assigning ? '…' : 'Assign'}
    </button>
  </div>
);

export default Reassignments;
