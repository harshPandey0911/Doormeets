import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiBox, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiChevronRight, FiSearch, FiMinus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import stockService from '../../../../services/stockService';
import LogoLoader from '../../../../components/common/LogoLoader';

const StockManagement = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Form State
  const [cart, setCart] = useState([]);
  const [vendorNotes, setVendorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, parts] = await Promise.all([
        stockService.getMyRequests(),
        stockService.getAvailableParts()
      ]);
      setRequests(reqs.data || []);
      setAvailableParts(parts.data || []);
    } catch (error) {
      console.error('Error loading stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (part) => {
    setCart(prev => {
      const existing = prev.find(p => p.partId === part._id);
      if (existing) {
        return prev.map(p => p.partId === part._id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { partId: part._id, name: part.name, quantity: 1 }];
    });
    toast.success(`${part.name} added to request`);
  };

  const updateQuantity = (partId, delta) => {
    setCart(prev => prev.map(p => {
      if (p.partId === partId) {
        const newQty = Math.max(0, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }).filter(p => p.quantity > 0));
  };

  const handleSubmitRequest = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to your request');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await stockService.createRequest({
        items: cart,
        vendorNotes
      });
      if (response.success) {
        toast.success('Stock request submitted successfully!');
        setShowRequestForm(false);
        setCart([]);
        setVendorNotes('');
        loadData();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-amber-500" />;
      case 'approved': return <FiCheckCircle className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      case 'rejected':
      case 'cancelled': return <FiXCircle className="text-red-500" />;
      default: return <FiBox className="text-gray-400" />;
    }
  };

  const filteredParts = availableParts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Stock Management" />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {!showRequestForm ? (
          <>
            {/* Action Card */}
            <div 
              onClick={() => setShowRequestForm(true)}
              className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50 mb-8 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FiPlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Request New Stock</h3>
                  <p className="text-xs text-gray-500">Ask admin for inventory replenishment</p>
                </div>
              </div>
              <FiChevronRight className="text-gray-300 w-6 h-6 group-hover:text-blue-600 transition-colors" />
            </div>

            {/* Request History */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] px-2">Request History</h4>
              
              {requests.length === 0 ? (
                <div className="bg-white/50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <FiBox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-400">No requests yet</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="bg-white rounded-3xl p-5 shadow-md border border-gray-50 transition-all hover:shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                          {getStatusIcon(req.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800 uppercase tracking-wide">#{req._id.slice(-6)}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest ${
                        req.status === 'delivered' ? 'bg-green-50 text-green-600' :
                        req.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        req.status === 'shipped' ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {req.status}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-[11px] font-medium text-gray-500 flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        {req.totalItems} Items requested
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.items.map((item, i) => (
                          <span key={i} className="text-[9px] font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                            {item.name} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    </div>

                    {req.adminNotes && (
                      <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-50">
                        <p className="text-[9px] font-semibold text-blue-600 uppercase mb-1">Admin Remark</p>
                        <p className="text-[11px] text-blue-800 font-medium italic">"{req.adminNotes}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Request Form */
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Request Stock</h3>
                <button 
                  onClick={() => setShowRequestForm(false)}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Search Parts */}
              <div className="relative mb-6">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search inventory items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-300 focus:bg-white rounded-2xl text-sm font-medium text-gray-800 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Parts List */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredParts.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">No parts found</p>
                ) : (
                  filteredParts.map(part => {
                    const cartItem = cart.find(p => p.partId === part._id);
                    return (
                      <div key={part._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{part.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">{part.categoryId?.title || 'Part'}</p>
                        </div>
                        
                        {cartItem ? (
                          <div className="flex items-center gap-3 bg-blue-50 p-1.5 rounded-xl">
                            <button 
                              onClick={() => updateQuantity(part._id, -1)}
                              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm active:scale-90"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-blue-700 w-4 text-center">{cartItem.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(part._id, 1)}
                              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm active:scale-90"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                             onClick={() => addToCart(part)}
                            className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-all"
                          >
                            <FiPlus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Summary & Notes */}
            {cart.length > 0 && (
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50 animate-in fade-in slide-in-from-bottom-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBox className="text-blue-600" /> Request Summary
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Additional Notes</label>
                    <textarea 
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      placeholder="e.g. Urgent requirement for upcoming jobs..."
                      className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-xs font-semibold text-gray-800 outline-none border border-transparent focus:border-blue-200 transition-all min-h-[100px]"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex justify-between items-center text-blue-800">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Items</span>
                      <span className="text-xl font-semibold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-semibold text-[13px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Request'}
                  {!isSubmitting && <FiTruck className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
      
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default StockManagement;
