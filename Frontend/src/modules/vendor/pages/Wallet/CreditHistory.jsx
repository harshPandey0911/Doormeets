import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../../../components/common/LogoLoader';

const CreditHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('All'); // All, Added, Deducted

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const walletRes = await api.get('/vendors/wallet');
      if (walletRes.data.success) {
        setBalance(walletRes.data.data.vendor?.wallet?.credits || 0);
      }

      // Fetch history based on tab
      let typeQuery = '';
      if (activeTab === 'Added') typeQuery = '?type=recharge';
      if (activeTab === 'Deducted') typeQuery = '?type=expenses';

      const historyRes = await api.get(`/vendors/credits/history${typeQuery}`);
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load credit history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'lead_deduct' || type === 'penalty' || amount < 0) return 'text-red-600';
    return 'text-green-600';
  };

  const getTransactionSign = (type, amount) => {
    if (type === 'lead_deduct' || type === 'penalty' || amount < 0) return '-';
    return '+';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vendor/wallet')} className="p-2">
            <FiArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Credit History</h1>
        </div>
        <button 
          onClick={() => navigate('/vendor/wallet/credit-purchase')}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        
        {/* Tabs */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          {['All', 'Added', 'Deducted'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((item) => (
                <div key={item._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{item.description}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`font-black text-lg whitespace-nowrap flex-shrink-0 ml-3 text-right ${getTransactionColor(item.type, item.amount)}`}>
                    {getTransactionSign(item.type, item.amount)}{Math.abs(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreditHistory;
