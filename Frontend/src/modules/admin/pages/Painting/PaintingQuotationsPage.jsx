import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFileText, FiX, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import * as paintingService from '../../services/paintingService';
import QuotationReview from './QuotationReview';

const PaintingQuotationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [rates, setRates] = useState([]);
  
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  // Filters & Search
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('all');
  const [quoteVendor, setQuoteVendor] = useState('all');
  const [quoteCustomer, setQuoteCustomer] = useState('all');
  const [quotePropType, setQuotePropType] = useState('all');
  const [quoteSort, setQuoteSort] = useState('newest');
  const [quoteStartDate, setQuoteStartDate] = useState('');
  const [quoteEndDate, setQuoteEndDate] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    customerName: '', customerPhone: '', interiorArea: '', exteriorArea: '',
    interiorPaintId: '', exteriorPaintId: '', labourId: '', discount: '', gstPercentage: 18
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const qRes = await paintingService.getQuotations({
        search: quoteSearch.trim() || undefined,
        status: quoteStatus === 'all' ? undefined : quoteStatus,
        vendorId: quoteVendor === 'all' ? undefined : quoteVendor,
        customerId: quoteCustomer === 'all' ? undefined : quoteCustomer,
        propertyType: quotePropType === 'all' ? undefined : quotePropType,
        sort: quoteSort,
        startDate: quoteStartDate || undefined,
        endDate: quoteEndDate || undefined
      });
      if (qRes.success) setQuotations(qRes.data || []);

      // Load products, brands, and rates for manual quote creation
      const [bRes, pRes, rRes] = await Promise.all([
        paintingService.getBrands(),
        paintingService.getProducts(),
        paintingService.getLabourRates()
      ]);
      if (bRes.success) setBrands(bRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
      if (rRes.success) setRates(rRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotations list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quoteSearch, quoteStatus, quoteVendor, quoteCustomer, quotePropType, quoteSort, quoteStartDate, quoteEndDate]);

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...quoteForm,
        interiorArea: Number(quoteForm.interiorArea || 0),
        exteriorArea: Number(quoteForm.exteriorArea || 0),
        discount: Number(quoteForm.discount || 0),
        gstPercentage: Number(quoteForm.gstPercentage || 18)
      };

      if (editingId) {
        const res = await paintingService.updateQuotation(editingId, payload);
        if (res.success) toast.success('Quotation updated successfully!');
      } else {
        const res = await paintingService.createQuotation(payload);
        if (res.success) toast.success('Quotation generated successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditQuotation = (quote) => {
    setQuoteForm({
      customerName: quote.customerName || '',
      customerPhone: quote.customerPhone || '',
      interiorArea: quote.interiorArea || '',
      exteriorArea: quote.exteriorArea || '',
      interiorPaintId: quote.interiorPaintId?._id || quote.interiorPaintId || '',
      exteriorPaintId: quote.exteriorPaintId?._id || quote.exteriorPaintId || '',
      labourId: quote.labourId?._id || quote.labourId || '',
      discount: quote.calculation?.discount || '',
      gstPercentage: quote.gstPercentage || 18
    });
    setEditingId(quote._id);
    setShowModal(true);
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Delete this quotation record?')) return;
    try {
      await paintingService.deleteQuotation(id);
      toast.success('Quotation deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete quotation');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setQuoteForm({
      customerName: '', customerPhone: '', interiorArea: '', exteriorArea: '',
      interiorPaintId: '', exteriorPaintId: '', labourId: '', discount: '', gstPercentage: 18
    });
    setShowModal(true);
  };

  if (selectedQuotationId) {
    return (
      <QuotationReview 
        quotationId={selectedQuotationId} 
        onBack={() => {
          setSelectedQuotationId(null);
          loadData();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">Painting Quotations</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage custom vendor estimates and review billing breakdown.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-205 shadow-sm hover:shadow-md cursor-pointer"
        >
          <FiPlus className="w-5 h-5" />
          Add Custom Quote
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Search</label>
            <input
              type="text"
              placeholder="ID, Customer, Phone..."
              value={quoteSearch}
              onChange={e => setQuoteSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
            <select
              value={quoteStatus}
              onChange={e => setQuoteStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="SUBMITTED_TO_ADMIN">Submitted to Admin</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="ADMIN_APPROVED">Admin Approved</option>
              <option value="ADMIN_REJECTED">Admin Rejected</option>
              <option value="SENT_TO_CUSTOMER">Sent to Customer</option>
              <option value="CUSTOMER_ACCEPTED">Customer Accepted</option>
              <option value="CUSTOMER_REJECTED">Customer Rejected</option>
              <option value="CONVERTED_TO_ORDER">Converted to Order</option>
            </select>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendor</label>
            <select
              value={quoteVendor}
              onChange={e => setQuoteVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
            >
              <option value="all">All Vendors</option>
              {Array.from(new Map(
                quotations
                  .filter(q => q.vendorId)
                  .map(q => [q.vendorId._id, q.vendorId.name])
              ).entries()).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</label>
            <select
              value={quoteCustomer}
              onChange={e => setQuoteCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
            >
              <option value="all">All Customers</option>
              {Array.from(new Map(
                quotations
                  .filter(q => q.customerId || q.customerName)
                  .map(q => [q.customerId?._id || q.customerName, q.customerId?.name || q.customerName])
              ).entries()).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Date Range Start */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From Date</label>
            <input
              type="date"
              value={quoteStartDate}
              onChange={e => setQuoteStartDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-gray-700"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To Date</label>
            <input
              type="date"
              value={quoteEndDate}
              onChange={e => setQuoteEndDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-gray-700"
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Property Type</label>
            <select
              value={quotePropType}
              onChange={e => setQuotePropType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="3BHK">3 BHK</option>
              <option value="4BHK">4 BHK</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sort By</label>
            <select
              value={quoteSort}
              onChange={e => setQuoteSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-semibold">No quotations matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Quote Details</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amounts</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
                {quotations.map(quote => (
                  <tr key={quote._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-gray-900">#{quote._id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                        {quote.property?.propertyType || 'Custom Layout'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{quote.customerId?.name || quote.customerName || 'N/A'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{quote.customerId?.phone || quote.customerPhone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {quote.vendorId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-bold">₹{(quote.summary?.grandTotal || quote.calculation?.grandTotal || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                        Mat: ₹{(quote.summary?.materialCost || quote.calculation?.paintCost || 0).toFixed(0)} | Lab: ₹{(quote.summary?.labourCost || quote.calculation?.labourCost || 0).toFixed(0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        quote.status === 'ADMIN_APPROVED' || quote.status === 'CUSTOMER_ACCEPTED'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : quote.status === 'REVISION_REQUESTED' || quote.status === 'CUSTOMER_REJECTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : quote.status === 'SUBMITTED_TO_ADMIN' || quote.status === 'UNDER_REVIEW'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-gray-50 text-gray-600 border border-gray-100'
                      }`}>
                        {quote.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedQuotationId(quote._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <FiFileText /> Review
                        </button>
                        <button
                          onClick={() => handleEditQuotation(quote)}
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuotation(quote._id)}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Quotation Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 font-sans">
                {editingId ? 'Edit Quotation Estimate' : 'Generate New Custom Quotation'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-all cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuoteSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.customerName}
                    onChange={e => setQuoteForm({...quoteForm, customerName: e.target.value})}
                    placeholder="Enter name"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={quoteForm.customerPhone}
                    onChange={e => setQuoteForm({...quoteForm, customerPhone: e.target.value})}
                    placeholder="10 digit number"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Interior Area (sqft)</label>
                  <input
                    type="number"
                    value={quoteForm.interiorArea}
                    onChange={e => setQuoteForm({...quoteForm, interiorArea: e.target.value})}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Exterior Area (sqft)</label>
                  <input
                    type="number"
                    value={quoteForm.exteriorArea}
                    onChange={e => setQuoteForm({...quoteForm, exteriorArea: e.target.value})}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Interior Paint Product</label>
                <select
                  value={quoteForm.interiorPaintId}
                  onChange={e => setQuoteForm({...quoteForm, interiorPaintId: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
                >
                  <option value="">None / Not Selected</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.brandId?.name || 'Paint'} - {p.paintName} ({p.category}) - ₹{p.price}/L
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Exterior Paint Product</label>
                <select
                  value={quoteForm.exteriorPaintId}
                  onChange={e => setQuoteForm({...quoteForm, exteriorPaintId: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
                >
                  <option value="">None / Not Selected</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.brandId?.name || 'Paint'} - {p.paintName} ({p.category}) - ₹{p.price}/L
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Labour Cost Matrix Rate</label>
                <select
                  value={quoteForm.labourId}
                  onChange={e => setQuoteForm({...quoteForm, labourId: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-semibold text-gray-700"
                >
                  <option value="">Select Labour Rate Scheme</option>
                  {rates.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.workType} ({r.application}) - ₹{r.pricePerSqft}/sqft
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Discount Value (₹)</label>
                  <input
                    type="number"
                    value={quoteForm.discount}
                    onChange={e => setQuoteForm({...quoteForm, discount: e.target.value})}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">GST Rate (%)</label>
                  <input
                    type="number"
                    value={quoteForm.gstPercentage}
                    onChange={e => setQuoteForm({...quoteForm, gstPercentage: e.target.value})}
                    placeholder="18"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Generate Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaintingQuotationsPage;
