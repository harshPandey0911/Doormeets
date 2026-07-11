import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiRefreshCw, FiCheck, FiCheckCircle, FiTrash2,
  FiSend, FiUsers, FiUser, FiImage, FiLink, FiSearch,
  FiX, FiSmartphone, FiClock, FiChevronRight, FiZap,
  FiDollarSign, FiUserCheck, FiInfo, FiAlertCircle, FiUploadCloud
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../../../../services/api';

// ─── Notification Preview Card (exactly how it looks on phone) ───────────────
const NotificationPreview = ({ title, body, imageUrl, actionUrl }) => (
  <div className="bg-gray-900 rounded-2xl p-4 shadow-xl">
    <div className="flex items-center gap-2 mb-3">
      <FiSmartphone className="text-gray-400 text-xs" />
      <span className="text-gray-400 text-xs font-medium">Phone Preview</span>
    </div>
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Status bar mock */}
      <div className="bg-gray-100 px-3 py-1 flex justify-between items-center">
        <span className="text-gray-400 text-[10px]">9:41 AM</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
      {/* Notification card */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <FiBell className="text-white text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your App</span>
              <span className="text-[9px] text-gray-400">now</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5 leading-tight">
              {title || 'Notification Title'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug line-clamp-2">
              {body || 'Notification message yahan dikhegi...'}
            </p>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="notification"
                className="w-full h-24 object-cover rounded-lg mt-2"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {actionUrl && (
              <div className="flex items-center gap-1 mt-1.5">
                <FiLink className="text-blue-500 text-[10px]" />
                <span className="text-[10px] text-blue-500 truncate">{actionUrl}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <p className="text-center text-gray-500 text-[10px] mt-3">Yahi dikhega users ko</p>
  </div>
);

// ─── Image Uploader Component ─────────────────────────────────────────────────
const ImageUploader = ({ value, onChange }) => {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Sirf image file select karo (jpg, png, webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image 5MB se choti honi chahiye');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.imageUrl) {
        onChange(res.data.imageUrl);
        toast.success('Image upload ho gayi!');
      } else {
        toast.error('Upload failed');
      }
    } catch (e) {
      console.error('Image upload error:', e);
      toast.error('Upload nahi hua, URL paste karo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Uploaded/filled state
  if (value && !urlMode) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 p-2">
        <div className="relative h-44 rounded-lg overflow-hidden">
          <img
            src={value}
            alt="notification preview"
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
          {/* Top-Right Remove Button always visible */}
          <button
            type="button"
            onClick={() => { onChange(''); setUrlMode(false); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
            title="Remove Image"
          >
            <FiX className="text-lg" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
          dragging
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-gray-50'
        }`}
      >
        {uploading ? (
          <>
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-purple-600 font-semibold">Uploading...</p>
          </>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              dragging ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <FiUploadCloud className={`text-2xl ${
                dragging ? 'text-purple-500' : 'text-gray-400'
              }`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {dragging ? 'Chhod do!' : 'Image upload karo'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Drag & drop ya click karo • JPG, PNG, WebP • max 5MB</p>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {/* URL paste option */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] text-gray-400 font-medium">ya URL paste karo</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <input
        type="url"
        value={urlMode || !value ? value : ''}
        onChange={e => { onChange(e.target.value); setUrlMode(true); }}
        onBlur={() => setUrlMode(false)}
        placeholder="https://example.com/image.jpg"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-600"
      />
    </div>
  );
};

const TARGET_OPTIONS = [
  { id: 'all_users', label: 'All Users', icon: FiUsers, color: 'blue', desc: 'Sabhi registered users ko' },
  { id: 'specific_user', label: 'Specific User', icon: FiUser, color: 'indigo', desc: 'Ek specific user ko' },
  { id: 'all_vendors', label: 'All Vendors', icon: FiUsers, color: 'purple', desc: 'Sabhi vendors/partners ko' },
  { id: 'specific_vendor', label: 'Specific Vendor', icon: FiUserCheck, color: 'violet', desc: 'Ek specific vendor ko' },
];

// ─── Search Dropdown Component ────────────────────────────────────────────────
const SearchDropdown = ({ placeholder, onSearch, onSelect, results, loading, selected, onClear, type }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (val.length >= 2) onSearch(val);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <FiUser className="text-blue-600 text-xs" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selected.businessName || selected.name}
          </p>
          <p className="text-xs text-gray-500">{selected.phone}</p>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-blue-100 rounded-lg">
          <FiX className="text-gray-500 text-sm" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          >
            {results.map((item) => (
              <button
                key={item._id}
                onClick={() => { onSelect(item); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FiUser className="text-gray-500 text-xs" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.businessName || item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.phone}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Send Result Banner ───────────────────────────────────────────────────────
const ResultBanner = ({ result, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
  >
    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <FiCheckCircle className="text-green-600 text-lg" />
    </div>
    <div className="flex-1">
      <p className="font-bold text-green-800 text-sm">Notification Successfully Bheji Gayi! 🎉</p>
      {result.stats && (
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-green-700">{result.stats.successCount}</span>
            <span className="text-xs text-green-600">delivered</span>
          </div>
          {result.stats.failureCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-orange-600">{result.stats.failureCount}</span>
              <span className="text-xs text-orange-500">failed</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-gray-700">{result.stats.totalUsers || result.stats.totalVendors || 0}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </div>
      )}
      {result.message && !result.stats && (
        <p className="text-sm text-green-700 mt-1">{result.message}</p>
      )}
    </div>
    <button onClick={onClose} className="p-1 hover:bg-green-100 rounded-lg">
      <FiX className="text-green-700 text-sm" />
    </button>
  </motion.div>
);

// ─── Main Notifications Component ─────────────────────────────────────────────
const Notifications = () => {
  const [activeTab, setActiveTab] = useState('send'); // 'my' | 'send' | 'history'

  // ── My Notifications State ──
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // ── Send Notification State (Persisted in localStorage so refresh doesn't wipe it) ──
  const [form, setForm] = useState(() => {
    try {
      const savedForm = localStorage.getItem('admin_notif_form');
      return savedForm ? JSON.parse(savedForm) : { title: '', body: '', imageUrl: '', actionUrl: '' };
    } catch (e) {
      return { title: '', body: '', imageUrl: '', actionUrl: '' };
    }
  });

  const [target, setTarget] = useState(() => {
    return localStorage.getItem('admin_notif_target') || 'all_users';
  });

  const [selectedUser, setSelectedUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notif_selected_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [selectedVendor, setSelectedVendor] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notif_selected_vendor');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [userResults, setUserResults] = useState([]);
  const [vendorResults, setVendorResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [vendorSearchLoading, setVendorSearchLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Category and Subcategory selection states
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedSubCatId, setSelectedSubCatId] = useState('');

  // Fetch Category and Subcategory options on component mount
  useEffect(() => {
    const fetchCatalogOptions = async () => {
      try {
        const catRes = await api.get('/admin/categories');
        if (catRes.data.success) {
          // Category controller exports array as res.data.categories instead of res.data.data
          setCategoriesList(catRes.data.categories || catRes.data.data || []);
        }
        const subRes = await api.get('/admin/subcategories');
        if (subRes.data.success) {
          setSubCategoriesList(subRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load category/subcategory listings:', err);
      }
    };
    fetchCatalogOptions();
  }, []);

  // Update redirect URL automatically when Category is selected
  const handleCategoryRedirect = (catId) => {
    setSelectedCatId(catId);
    setSelectedSubCatId(''); // Reset subcategory selection
    if (!catId) {
      setForm(f => ({ ...f, actionUrl: '' }));
      return;
    }
    const selected = categoriesList.find(c => c.id === catId || c._id === catId);
    if (selected) {
      // Auto-set Redirect URL based on category slug
      const url = `/category/${selected.slug}`;
      setForm(f => ({ ...f, actionUrl: url }));
    }
  };

  // Update redirect URL automatically when Subcategory is selected
  const handleSubCategoryRedirect = (subCatId) => {
    setSelectedSubCatId(subCatId);
    if (!subCatId) {
      // Fallback to parent category url if subcategory is unselected
      handleCategoryRedirect(selectedCatId);
      return;
    }
    const selectedSub = subCategoriesList.find(s => s.id === subCatId || s._id === subCatId);
    if (selectedSub) {
      // Auto-set Redirect URL based on subcategory slug
      const url = `/subcategory/${selectedSub.slug}`;
      setForm(f => ({ ...f, actionUrl: url }));
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('admin_notif_form', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem('admin_notif_target', target);
  }, [target]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('admin_notif_selected_user', JSON.stringify(selectedUser));
    } else {
      localStorage.removeItem('admin_notif_selected_user');
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedVendor) {
      localStorage.setItem('admin_notif_selected_vendor', JSON.stringify(selectedVendor));
    } else {
      localStorage.removeItem('admin_notif_selected_vendor');
    }
  }, [selectedVendor]);

  // ── History State ──
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Fetch my notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Admin ke liye /notifications/admin endpoint use karo
      const res = await api.get('/notifications/admin', { params: { limit: 50 } });
      if (res.data.success) setNotifications(res.data.data || []);
    } catch (error) {
      // Silently fail — red banner mat dikhao, bas empty state
      console.error('Error fetching admin notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch history ──
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/admin/notifications/broadcast-history', { params: { limit: 30 } });
      if (res.data.success) setHistory(res.data.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my') fetchNotifications();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchNotifications, fetchHistory]);

  // ─── My Notifications handlers ──
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      // Silent fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteHistoryNotification = async (id, e) => {
    e.stopPropagation(); // Avoid triggering composer populate action
    if (!window.confirm('Are you sure you want to delete this sent notification from history?')) return;
    try {
      await api.delete(`/admin/notifications/${id}`);
      setHistory(prev => prev.filter(n => n._id !== id));
      toast.success('Notification history item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete history item');
    }
  };

  // ─── User/Vendor search ──
  const searchUsers = useCallback(async (q) => {
    try {
      setUserSearchLoading(true);
      const res = await api.get('/admin/notifications/search-users', { params: { q } });
      if (res.data.success) setUserResults(res.data.data || []);
    } catch (e) { /* ignore */ } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const searchVendors = useCallback(async (q) => {
    try {
      setVendorSearchLoading(true);
      const res = await api.get('/admin/notifications/search-vendors', { params: { q } });
      if (res.data.success) setVendorResults(res.data.data || []);
    } catch (e) { /* ignore */ } finally {
      setVendorSearchLoading(false);
    }
  }, []);

  // ─── Send notification ──
  const handleSend = async () => {
    if (!form.title.trim()) { toast.error('Title required hai'); return; }
    if (!form.body.trim()) { toast.error('Message required hai'); return; }
    if (target === 'specific_user' && !selectedUser) { toast.error('User select karo'); return; }
    if (target === 'specific_vendor' && !selectedVendor) { toast.error('Vendor select karo'); return; }

    setSending(true);
    setSendResult(null);

    try {
      let res;
      const payload = {
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || undefined,
        actionUrl: form.actionUrl || undefined,
      };

      switch (target) {
        case 'all_users':
          res = await api.post('/admin/notifications/send-to-all-users', payload);
          break;
        case 'specific_user':
          res = await api.post('/admin/notifications/send-to-user', { ...payload, userId: selectedUser._id });
          break;
        case 'all_vendors':
          res = await api.post('/admin/notifications/send-to-all-vendors', payload);
          break;
        case 'specific_vendor':
          res = await api.post('/admin/notifications/send-to-vendor', { ...payload, vendorId: selectedVendor._id });
          break;
        default:
          break;
      }

      if (res.data.success) {
        setSendResult(res.data);
        toast.success('Notification bheji gayi!');
        // Clear persisted form only on successful send
        const clearedForm = { title: '', body: '', imageUrl: '', actionUrl: '' };
        setForm(clearedForm);
        setSelectedUser(null);
        setSelectedVendor(null);
        localStorage.removeItem('admin_notif_form');
        localStorage.removeItem('admin_notif_selected_user');
        localStorage.removeItem('admin_notif_selected_vendor');
      } else {
    toast.error(res.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'vendor_withdrawal_request': return <FiDollarSign className="text-green-500" />;
      case 'vendor_approval_request': return <FiUserCheck className="text-blue-500" />;
      case 'admin_broadcast': return <FiZap className="text-purple-500" />;
      default: return <FiBell className="text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const TABS = [
    { id: 'send', label: 'Send Notification', icon: FiSend },
    { id: 'history', label: 'History', icon: FiClock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FiBell className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications Center</h1>
              <p className="text-sm text-gray-500 mt-0.5">Send push notifications to Users and Vendors</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-all relative flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'text-purple-700 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="text-base" />
              <span>{tab.label}</span>
              {tab.id === 'my' && unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Send Notification Tab ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'send' && (
          <motion.div
            key="send"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-4"
          >
            {/* Left: Composer */}
            <div className="lg:col-span-3 space-y-4">
              {/* Result banner */}
              <AnimatePresence>
                {sendResult && (
                  <ResultBanner result={sendResult} onClose={() => setSendResult(null)} />
                )}
              </AnimatePresence>

              {/* Target Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FiUsers className="text-purple-500" />
                  Step 1: Target Chunho
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const colorMap = {
                      blue: 'border-blue-200 bg-blue-50 text-blue-700',
                      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                      purple: 'border-purple-200 bg-purple-50 text-purple-700',
                      violet: 'border-violet-200 bg-violet-50 text-violet-700',
                    };
                    const isSelected = target === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setTarget(opt.id); setSelectedUser(null); setSelectedVendor(null); }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? `${colorMap[opt.color]} border-current`
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <Icon className={`text-lg mb-1.5 ${isSelected ? '' : 'text-gray-400'}`} />
                        <p className={`text-xs font-bold ${isSelected ? '' : 'text-gray-700'}`}>{opt.label}</p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-70' : 'text-gray-400'}`}>{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Specific User/Vendor Search */}
                <AnimatePresence>
                  {target === 'specific_user' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">User Search karo</label>
                      <SearchDropdown
                        placeholder="Naam ya phone number likhho..."
                        onSearch={searchUsers}
                        onSelect={setSelectedUser}
                        results={userResults}
                        loading={userSearchLoading}
                        selected={selectedUser}
                        onClear={() => setSelectedUser(null)}
                        type="user"
                      />
                    </motion.div>
                  )}
                  {target === 'specific_vendor' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Vendor Search karo</label>
                      <SearchDropdown
                        placeholder="Business naam ya phone number..."
                        onSearch={searchVendors}
                        onSelect={setSelectedVendor}
                        results={vendorResults}
                        loading={vendorSearchLoading}
                        selected={selectedVendor}
                        onClear={() => setSelectedVendor(null)}
                        type="vendor"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notification Content */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <FiBell className="text-purple-500" />
                  Step 2: Notification Content
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder='e.g. "Barish ho rhi hai ☔"'
                      maxLength={80}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-right text-[10px] text-gray-400 mt-1">{form.title.length}/80</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.body}
                      onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                      placeholder='e.g. "Ghar baithe chai pee lo, hum aate hain!"'
                      maxLength={200}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <p className="text-right text-[10px] text-gray-400 mt-1">{form.body.length}/200</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <FiImage className="text-gray-400" /> Notification Image
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <ImageUploader
                      value={form.imageUrl}
                      onChange={val => setForm(f => ({ ...f, imageUrl: val }))}
                    />
                  </div>

                   <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <FiLink className="text-gray-400" /> Redirect Options <span className="text-gray-400 font-normal">(User click pe kahan jaye)</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5">
                      {/* Category Select */}
                      <div>
                        <select
                          value={selectedCatId}
                          onChange={e => handleCategoryRedirect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-700"
                        >
                          <option value="">-- Choose Category --</option>
                          {categoriesList.map(cat => (
                            <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subcategory Select */}
                      <div>
                        <select
                          value={selectedSubCatId}
                          onChange={e => handleSubCategoryRedirect(e.target.value)}
                          disabled={!selectedCatId}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">-- Choose Subcategory --</option>
                          {subCategoriesList
                            .filter(sub => {
                              const parentId = sub.categoryId?.id || sub.categoryId?._id || sub.categoryId;
                              return parentId === selectedCatId;
                            })
                            .map(sub => (
                              <option key={sub.id || sub._id} value={sub.id || sub._id}>{sub.title}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={form.actionUrl}
                      onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))}
                      placeholder="/category/plumbing ya /subcategory/ac-service ya custom URL..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <FiInfo className="text-[10px]" />
                      Category/Subcategory choose karne par Redirect URL apne aap fill ho jayega.
                    </p>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending || !form.title || !form.body}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                  sending || !form.title || !form.body
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Bhej raha hai...
                  </>
                ) : (
                  <>
                    <FiSend className="text-lg" />
                    Notification Bhejo
                    {target === 'all_users' && ' → All Users'}
                    {target === 'all_vendors' && ' → All Vendors'}
                    {target === 'specific_user' && selectedUser && ` → ${selectedUser.name}`}
                    {target === 'specific_vendor' && selectedVendor && ` → ${selectedVendor.businessName || selectedVendor.name}`}
                  </>
                )}
              </button>

              {/* Info box */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <FiAlertCircle className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Yeh notification users ko tab bhi milegi jab app <strong>band ho</strong> ya <strong>background mein ho</strong> — FCM (Firebase Cloud Messaging) use karta hai, exactly Zomato ki tarah.
                </p>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FiSmartphone className="text-purple-500" />
                  Live Preview
                </h2>
                <NotificationPreview
                  title={form.title}
                  body={form.body}
                  imageUrl={form.imageUrl}
                  actionUrl={form.actionUrl}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── My Notifications Tab ─────────────────────────────────────────── */}
        {activeTab === 'my' && (
          <motion.div
            key="my"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Action bar */}
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex gap-2">
                  {['all', 'unread', 'read'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${filter === f
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiRefreshCw className={`text-gray-500 text-sm ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FiCheckCircle className="text-sm" />
                      Mark All Read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Saare notifications delete karein?')) {
                          try {
                            await api.delete('/notifications/delete-all');
                            setNotifications([]);
                            toast.success('Cleared!');
                          } catch {
                            // silent
                          }
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FiTrash2 className="text-sm" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                  <p className="text-xs text-gray-500 mt-3">Loading...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <FiBell className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Koi notification nahi mili</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredNotifications.map(n => (
                      <motion.div
                        key={n._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-purple-50/20' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {!n.isRead && (
                              <button onClick={() => markAsRead(n._id)} className="text-[10px] font-semibold text-purple-600 hover:underline flex items-center gap-1">
                                <FiCheck className="text-xs" /> Mark as read
                              </button>
                            )}
                            <button onClick={() => deleteNotification(n._id)} className="text-[10px] font-semibold text-red-500 hover:underline flex items-center gap-1">
                              <FiTrash2 className="text-xs" /> Delete
                            </button>
                          </div>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0 mt-2" />}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── History Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiClock className="text-purple-500" />
                  <h2 className="text-sm font-bold text-gray-800">Pehle Bheji Gayi Notifications</h2>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiRefreshCw className={`text-gray-500 text-sm ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {historyLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                  <p className="text-xs text-gray-500 mt-3">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center">
                  <FiSend className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Abhi tak koi notification nahi bheji gayi</p>
                  <button
                    onClick={() => setActiveTab('send')}
                    className="mt-4 px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Pehli Notification Bhejo →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.map(n => {
                    const targetType = n.data?.targetType || 'unknown';
                    const targetLabels = {
                      all_users: { label: 'All Users', color: 'blue' },
                      specific_user: { label: 'Specific User', color: 'indigo' },
                      all_vendors: { label: 'All Vendors', color: 'purple' },
                      specific_vendor: { label: 'Specific Vendor', color: 'violet' },
                    };
                    const tl = targetLabels[targetType] || { label: targetType, color: 'gray' };
                    const colorMap = {
                      blue: 'bg-blue-100 text-blue-700',
                      indigo: 'bg-indigo-100 text-indigo-700',
                      purple: 'bg-purple-100 text-purple-700',
                      violet: 'bg-violet-100 text-violet-700',
                      gray: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <div
                        key={n._id}
                        onClick={() => {
                          // Populate form
                          setForm({
                            title: n.title || '',
                            body: n.message || '',
                            imageUrl: n.imageUrl || '',
                            actionUrl: n.actionUrl || ''
                          });
                          // Re-set target type
                          if (n.data?.targetType) {
                            setTarget(n.data.targetType);
                          }
                          // Switch to Send Composer tab
                          setActiveTab('send');
                          toast.success('Notification details loaded into composer');
                        }}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Click to Reuse Notification"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                            <FiZap className="text-purple-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                              </div>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorMap[tl.color]}`}>
                                  {tl.label}
                                </span>
                                {n.imageUrl && (
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <FiImage className="text-[10px]" /> Image
                                  </span>
                                )}
                                {n.actionUrl && (
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 truncate max-w-[120px]">
                                    <FiLink className="text-[10px] flex-shrink-0" />
                                    <span className="truncate">{n.actionUrl}</span>
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => deleteHistoryNotification(n._id, e)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors flex items-center gap-1"
                                title="Delete from History"
                              >
                                <FiTrash2 className="text-xs" />
                                <span className="text-[10px] font-semibold">Delete</span>
                              </button>
                            </div>
                          </div>
                          <FiChevronRight className="text-gray-300 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Notifications;
