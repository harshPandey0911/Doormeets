import React, { useState, useEffect } from 'react';
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

      <main className="px-4 pt-4 max-w-lg mx-auto">

        {/* Tab Switcher */}
        <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-sm border border-white/50 mb-5">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'browse' ? 'text-white shadow-md' : 'text-gray-500'}`}
            style={activeTab === 'browse' ? { backgroundColor: themeColors.primary } : {}}
          >
            <FiGrid className="w-4 h-4" />
            Browse
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all relative ${activeTab === 'requests' ? 'text-white shadow-md' : 'text-gray-500'}`}
            style={activeTab === 'requests' ? { backgroundColor: themeColors.primary } : {}}
          >
            <FiInbox className="w-4 h-4" />
            My Requests
            {pendingCount > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LogoLoader /></div>
        ) : activeTab === 'browse' ? (

          /* ── Browse Categories ── */
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Service Categories</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs text-white shadow-md active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
              >
                <FiPlus className="w-3.5 h-3.5" />
                Request New
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-3xl border border-white/40">
                <FiGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No categories available yet</p>
                <p className="text-gray-400 text-sm mt-1">Admin will add categories soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/vendor/categories/${cat.id}`, { state: { category: cat } })}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 p-4 hover:shadow-md active:scale-[0.98] transition-all text-left"
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center bg-brand/10 border border-brand/20">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.title} className="w-full h-full object-cover" />
                      ) : (
                        <FiGrid className="w-6 h-6 text-brand" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-base">{cat.title}</h3>
                      {cat.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase tracking-wider">
                        Service
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Info card */}
            <div className="mt-6 p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
              <div className="flex gap-3 items-start">
                <FiAlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Need a category that's not listed?</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tap "Request New" to send a request to the admin. They'll review and add it.
                  </p>
                </div>
              </div>
            </div>
          </>

        ) : (

          /* ── My Requests ── */
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">My Requests</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs text-white shadow-md active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
              >
                <FiPlus className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-3xl border border-white/40">
                <FiInbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No requests yet</p>
                <p className="text-gray-400 text-sm mt-1">Request a new category from the Browse tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => {
                  const cfg = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={req.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${cfg.border}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base truncate">{req.categoryName}</h3>
                          {req.reason && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.reason}</p>
                          )}
                          {req.adminNote && (
                            <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                              <span className="font-bold">Admin note: </span>{req.adminNote}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                          <StatusIcon className="w-3.5 h-3.5" />
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
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request New Category</h3>
                <p className="text-xs text-gray-400 mt-0.5">Admin will review and respond</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setForm({ categoryName: '', reason: '' }); }}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={e => setForm({ ...form, categoryName: e.target.value })}
                  placeholder="e.g. Solar Panel Installation"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Reason / Description (Optional)
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Why do you need this category? Any additional details..."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setForm({ categoryName: '', reason: '' }); }}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 text-white font-semibold rounded-2xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}cc)` }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
