import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLoader, FiCalendar, FiClock, FiMapPin, FiBriefcase, FiAlertTriangle, FiCheckCircle, FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import CardShell from '../UserCategories/components/CardShell';
import { adminBookingService } from '../../../../services/adminBookingService';
import adminVendorService from '../../../../services/adminVendorService';

const ManualAssignment = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assign Vendor Modal state
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminBookingService.getAllBookings({ manual: true, limit: 100 });
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading manual bookings:', error);
      toast.error('Failed to load manual bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true);
      const res = await adminVendorService.getAllVendors({ limit: 1000 });
      if (res.success) {
        setBookings(prevBookings => {
          loadBookings(); // Reload to refresh list
          return prevBookings;
        });
        setVendors(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      toast.error('Failed to load vendors');
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    
    // Listen for custom socket update events if any
    const handleRefresh = () => loadBookings();
    window.addEventListener('adminBookingUpdated', handleRefresh);
    window.addEventListener('userBookingsUpdated', handleRefresh);
    return () => {
      window.removeEventListener('adminBookingUpdated', handleRefresh);
      window.removeEventListener('userBookingsUpdated', handleRefresh);
    };
  }, []);

  const handleOpenAssignModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    fetchVendors();
    setShowAssignModal(true);
  };

  const handleAssignVendor = async (vendorId) => {
    try {
      setAssigning(true);
      const res = await adminBookingService.assignVendor(selectedBookingId, vendorId);
      if (res.success) {
        toast.success('Vendor assigned successfully. Waiting for vendor response.');
        setShowAssignModal(false);
        loadBookings();
      } else {
        toast.error(res.message || 'Failed to assign vendor');
      }
    } catch (err) {
      console.error('Error assigning vendor:', err);
      toast.error(err.message || 'Error assigning vendor');
    } finally {
      setAssigning(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      (b.bookingNumber || '').toLowerCase().includes(term) ||
      (b.serviceName || '').toLowerCase().includes(term) ||
      (b.userId?.name || '').toLowerCase().includes(term)
    );
  });

  const filteredVendors = vendors.filter(v => {
    const term = vendorSearch.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(term) ||
      (v.businessName || '').toLowerCase().includes(term) ||
      (v.phone || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <CardShell
        icon={FiUser}
        title="Manual Vendor Assignment"
        subtitle="Manage bookings with no online vendors or rejected assignments"
      >
        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order number, service or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>
          <button 
            onClick={loadBookings} 
            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-150 transition-colors"
            title="Reload List"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs text-gray-500">Loading pending requests...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs italic">
            No bookings currently require manual assignment.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isAssigned = booking.status === 'requested' && booking.assignedByAdmin;
              const hasBeenRejected = booking.cancellationReason && booking.cancellationReason.includes('rejected');
              
              return (
                <div key={booking._id} className="border border-gray-150 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  {/* Left Side: Booking & Customer Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-800">#{booking.bookingNumber}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isAssigned 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isAssigned ? 'Assigned (Pending)' : 'Unassigned'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400">Service</p>
                        <p className="font-semibold text-gray-700">{booking.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400">Customer</p>
                        <p className="font-semibold text-gray-700">{booking.userId?.name || 'Guest'}</p>
                        <p className="text-[10px] text-gray-400">{booking.userId?.phone || 'No phone'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400">Schedule</p>
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3 text-gray-400" />
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Flexible'}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {booking.scheduledTime || (booking.timeSlot?.start ? `${booking.timeSlot.start} - ${booking.timeSlot.end}` : 'Flexible')}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Status tracker */}
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-gray-650">
                        <FiCheckCircle className="text-green-500 w-3.5 h-3.5" />
                        <span>Booking Created successfully (Amount: ₹{booking.finalAmount})</span>
                      </div>
                      
                      {!isAssigned ? (
                        <div className="space-y-1.5 w-full">
                          {booking.cancellationReason && booking.cancellationReason.toLowerCase().includes('rejected') && (
                            <div className="flex items-start gap-1.5 text-red-700 bg-red-50 p-2 rounded border border-red-100 w-full">
                              <FiX className="text-red-500 w-3.5 h-3.5 mt-0.5" />
                              <div>
                                <p className="font-bold">Assignment Rejected</p>
                                <p className="text-[10px] text-red-600">{booking.cancellationReason}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-1.5 text-amber-700">
                            <FiAlertTriangle className="text-amber-500 w-3.5 h-3.5 mt-0.5" />
                            <div>
                              <p className="font-semibold">Manual Assignment Needed</p>
                              <p className="text-[10px] text-amber-600">No vendor is currently assigned. Please select a vendor to proceed.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-blue-700">
                          <FiLoader className="text-blue-500 animate-spin w-3.5 h-3.5 mt-0.5" />
                          <div>
                            <p className="font-semibold">Assigned to Vendor</p>
                            <p className="text-[10px] text-blue-600">
                              Waiting for response from: <strong className="text-blue-800">{booking.vendorId?.businessName || booking.vendorId?.name || 'Vendor'}</strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Reassign / Assign Button */}
                  <div className="flex flex-col justify-center items-start md:items-end gap-2 self-center">
                    {booking.status === 'pending_admin' && (
                      <button
                        onClick={() => handleOpenAssignModal(booking._id)}
                        className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm ${
                          booking.cancellationReason && booking.cancellationReason.toLowerCase().includes('rejected')
                            ? 'bg-amber-500 hover:bg-amber-650' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {booking.cancellationReason && booking.cancellationReason.toLowerCase().includes('rejected')
                          ? 'Reassign Vendor' 
                          : 'Assign Vendor'}
                      </button>
                    )}
                    <a 
                      href={`/admin/bookings/${booking._id}`} 
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      View Full Details
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardShell>

      {/* Assign Vendor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-base font-bold text-gray-800">Assign Vendor</h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendor by name, business or phone..."
                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Vendor List */}
            <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[400px] divide-y divide-gray-100 pr-1">
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredVendors.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8 italic">No matching vendors found.</p>
              ) : (
                filteredVendors.map((vendor) => (
                  <div key={vendor._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-800">{vendor.name || 'Vendor'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${vendor.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {vendor.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold capitalize ${
                          vendor.approvalStatus === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          {vendor.approvalStatus || 'pending'}
                        </span>
                      </div>
                      {vendor.businessName && (
                        <p className="text-blue-600 font-medium text-[11px] mt-0.5">{vendor.businessName}</p>
                      )}
                      <p className="text-gray-500 mt-0.5">{vendor.phone}</p>
                    </div>
                    <button
                      onClick={() => handleAssignVendor(vendor._id)}
                      disabled={assigning}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors disabled:opacity-50"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-100 text-xs font-semibold">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-650 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAssignment;
