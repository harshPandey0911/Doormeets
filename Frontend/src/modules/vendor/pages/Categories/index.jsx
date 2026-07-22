import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  FiGrid, FiChevronRight, FiPlus, FiX, FiSend,
  FiInbox, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import { vendorCategoryService } from '../../services/vendorCategoryService';
import vendorCategoryRequestService from '../../services/vendorCategoryRequestService';
import LogoLoader from '../../../../components/common/LogoLoader';

const statusConfig = {
  pending:  { label: 'Pending',  icon: FiClock,        color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  approved: { label: 'Approved', icon: FiCheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200' },
  rejected: { label: 'Rejected', icon: FiXCircle,      color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200' }
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'requests'

  // Request modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ categoryName: '', reason: '' });

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [catRes, reqRes] = await Promise.allSettled([
        vendorCategoryService.getCategories(),
        vendorCategoryRequestService.getMyRequests()
      ]);
      if (catRes.status === 'fulfilled' && catRes.value.success) {
        setCategories(catRes.value.categories || []);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.success) {
        setMyRequests(reqRes.value.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!form.categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await vendorCategoryRequestService.submitRequest(form);
      if (res.success) {
        toast.success('Request sent to admin!');
        setIsModalOpen(false);
        setForm({ categoryName: '', reason: '' });
        fetchAll();
        setActiveTab('requests');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Categories" showBack={false} />

      <main className="px-3.5 pt-3 pb-6 max-w-lg mx-auto">

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-md shadow-2xs border border-gray-100 mb-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs transition-all ${activeTab === 'browse' ? 'text-white shadow-xs' : 'text-gray-500'}`}
            style={activeTab === 'browse' ? { backgroundColor: themeColors.primary } : {}}
          >
            <FiGrid className="w-3.5 h-3.5" />
            Browse
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs transition-all relative ${activeTab === 'requests' ? 'text-white shadow-xs' : 'text-gray-500'}`}
            style={activeTab === 'requests' ? { backgroundColor: themeColors.primary } : {}}
          >
            <FiInbox className="w-3.5 h-3.5" />
            My Requests
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LogoLoader /></div>
        ) : activeTab === 'browse' ? (

          /* ── Browse Categories ── */
          <>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 className="text-sm md:text-base font-bold text-gray-900">Service Categories</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-xs text-white shadow-xs active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
              >
                <FiPlus className="w-3.5 h-3.5" />
                Request New
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-200 p-6">
                <FiGrid className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-bold text-sm">No categories available yet</p>
                <p className="text-gray-400 text-xs mt-0.5">Admin will add categories soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/vendor/categories/${cat.id}`, { state: { category: cat } })}
                    className="w-full bg-white rounded-md shadow-2xs border border-gray-100 flex items-center gap-3 p-3 hover:shadow-xs active:scale-[0.98] transition-all text-left"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center bg-brand/10 border border-brand/20 shadow-2xs">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.title} className="w-full h-full object-cover" />
                      ) : (
                        <FiGrid className="w-5 h-5 text-brand" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-xs md:text-sm">{cat.title}</h3>
                      {cat.description && (
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-brand/10 text-brand text-[9px] font-bold rounded-md uppercase tracking-wider">
                        Service
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Info card */}
            <div className="mt-4 p-3.5 bg-blue-50/80 rounded-md border border-blue-100 shadow-2xs">
              <div className="flex gap-2.5 items-start">
                <FiAlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Need a category that's not listed?</p>
                  <p className="text-[11px] text-blue-700 mt-0.5 leading-snug">
                    Tap "Request New" to send a request to the admin. They'll review and add it.
                  </p>
                </div>
              </div>
            </div>
          </>

        ) : (

          /* ── My Requests ── */
          <>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 className="text-sm md:text-base font-bold text-gray-900">My Requests</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-xs text-white shadow-xs active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
              >
                <FiPlus className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-200 p-6">
                <FiInbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-bold text-sm">No requests yet</p>
                <p className="text-gray-400 text-xs mt-0.5">Request a new category from the Browse tab</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myRequests.map((req) => {
                  const cfg = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={req.id} className={`bg-white rounded-md border p-3 shadow-2xs ${cfg.border}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-xs md:text-sm truncate">{req.categoryName}</h3>
                          {req.reason && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{req.reason}</p>
                          )}
                          {req.adminNote && (
                            <div className={`mt-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                              <span className="font-black">Admin note: </span>{req.adminNote}
                            </div>
                          )}
                          <p className="text-[9px] text-gray-400 mt-1.5">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Request New Category Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900">Request New Category</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Admin will review and respond</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setForm({ categoryName: '', reason: '' }); }}
                className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={e => setForm({ ...form, categoryName: e.target.value })}
                  placeholder="e.g. Solar Panel Installation"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Reason / Description (Optional)
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Why do you need this category? Any additional details..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setForm({ categoryName: '', reason: '' }); }}
                  className="w-full sm:flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-2 text-white font-bold rounded-md transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSend className="w-3.5 h-3.5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Categories;
