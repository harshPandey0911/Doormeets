import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiStar, FiBriefcase, FiZap, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { HiLightningBolt } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const LabourList = () => {
  const navigate = useNavigate();
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingLoadingId, setBookingLoadingId] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { labourId, labourName }
  const [note, setNote] = useState('');

  // Detect who is booking (user or vendor) — correct token key names
  const getBookerToken = () => {
    return localStorage.getItem('accessToken')        // user
      || localStorage.getItem('vendorAccessToken')    // vendor
      || sessionStorage.getItem('accessToken')
      || sessionStorage.getItem('vendorAccessToken')
      || null;
  };
  const isLoggedIn = !!getBookerToken();

  const fetchOnlineLabours = async () => {
    try {
      const token = getBookerToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await api.get('/labour/online', config);
      if (res.data.success) setLabours(res.data.labours);
    } catch (err) {
      console.error('[LabourList] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineLabours();
    // Refresh every 30s
    const interval = setInterval(fetchOnlineLabours, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLabours = labours.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.serviceCategories?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openBookingModal = (labour) => {
    if (!isLoggedIn) {
      toast.error('Please login to book a labour');
      return;
    }
    setNoteModal({ labourId: labour.id, labourName: labour.name });
    setNote('');
  };

  const confirmBooking = async () => {
    if (!noteModal) return;
    const token = getBookerToken();
    if (!token) {
      toast.error('Please login to book a labour');
      return;
    }
    setBookingLoadingId(noteModal.labourId);
    try {
      const res = await api.post(
        '/labour/book',
        { labourId: noteModal.labourId, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Booking request sent! Waiting for labour to accept.');
        setNoteModal(null);
        setNote('');
      } else {
        toast.error(res.data.message || 'Failed to send request');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book labour');
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/10 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-4 pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <h1 className="text-2xl font-black text-white">Available Labour</h1>
          <p className="text-white/70 text-sm mt-1">Book a skilled worker right now</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 px-4 py-3.5 mb-4">
          <FiSearch className="text-gray-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or skill..."
            className="flex-1 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Online count badge */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-black text-gray-700">{labours.length} Labour{labours.length !== 1 ? 's' : ''} Online Now</span>
        </div>

        {/* Labour Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLabours.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-teal-300" />
            </div>
            <h3 className="font-black text-gray-800 mb-2">No Labour Available</h3>
            <p className="text-xs text-gray-500">No labours are online right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLabours.map(labour => (
              <div
                key={labour.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {labour.profilePhoto ? (
                      <img
                        src={labour.profilePhoto}
                        alt={labour.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-gray-50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                        <span className="text-2xl font-black text-teal-600">{labour.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    {/* Online dot */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 text-base">{labour.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {labour.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs font-bold text-teal-600">
                          <FiStar className="w-3.5 h-3.5" /> {labour.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                        <FiBriefcase className="w-3.5 h-3.5" /> {labour.totalJobs} jobs
                      </span>
                    </div>
                    {/* Skills */}
                    {labour.serviceCategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {labour.serviceCategories.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-black rounded-lg border border-teal-100 uppercase tracking-wide">
                            {s}
                          </span>
                        ))}
                        {labour.serviceCategories.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black rounded-lg">
                            +{labour.serviceCategories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => openBookingModal(labour)}
                    disabled={bookingLoadingId === labour.id}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-gradient-to-b from-teal-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-teal-200 hover:from-teal-600 hover:to-emerald-700 transition-all active:scale-95 font-black text-xs uppercase tracking-wide"
                  >
                    {bookingLoadingId === labour.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <HiLightningBolt className="w-5 h-5" />
                        Book
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note/Confirm Booking Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 pb-20">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <HiLightningBolt className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Book {noteModal.labourName}</h3>
              <p className="text-sm text-gray-500 mt-1">Add a note (optional) before sending request</p>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Need plumber for bathroom pipe leak repair..."
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 resize-none mb-4 transition-all"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNoteModal(null)}
                className="py-4 rounded-2xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={!!bookingLoadingId}
                className="py-4 rounded-2xl font-black text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg shadow-teal-200 hover:from-teal-600 hover:to-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {bookingLoadingId ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><FiZap className="w-4 h-4" /> Send Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourList;
