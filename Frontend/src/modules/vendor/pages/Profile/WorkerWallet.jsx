import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiArrowUp, FiArrowDown, FiArrowRight, FiClock, FiCheckCircle, FiAlertCircle, FiSend, FiAward, FiX } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const WorkerWallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    balance: 0,
    totalWithdrawn: 0,
    name: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txnRes, withdrawRes] = await Promise.all([
        api.get('/workers/wallet'),
        api.get('/workers/wallet/transactions'),
        api.get('/workers/wallet/withdrawals')
      ]);

      if (walletRes.data?.success) {
        setWallet(walletRes.data.data);
      }

      if (txnRes.data?.success) {
        setTransactions(txnRes.data.data || []);
      }

      if (withdrawRes.data?.success) {
        setWithdrawals(withdrawRes.data.data || []);
      }
    } catch (error) {
      console.error('Error loading worker wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!upiId) {
      toast.error('UPI ID is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/workers/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        bankDetails: { upiId },
        notes
      });

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setUpiId('');
        setNotes('');
        loadWalletData();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="My Wallet" />

      <main className="px-4 py-6">
        {/* Balance Card (Sleek Indigo/Purple style) */}
        <div 
          className="rounded-[2rem] p-6 shadow-xl relative overflow-hidden mb-6 text-white border border-white/10"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            boxShadow: '0 15px 30px rgba(79, 70, 229, 0.25)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Available Payout Balance</p>
                <p className="text-4xl font-black mb-4">₹{wallet.balance?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>

            {wallet.balance > 0 ? (
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="w-full bg-white text-indigo-700 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-md"
              >
                Request Withdrawal Payout
              </button>
            ) : (
              <div className="w-full bg-white/10 text-white/80 py-3.5 rounded-xl font-bold text-sm text-center border border-white/5">
                No Balance Available
              </div>
            )}
          </div>
        </div>

        {/* Payout History Details */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-4 px-1">Withdrawal Requests</h3>
          {withdrawals.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100/50">
              <p className="text-xs text-gray-500 font-semibold">No payout requests submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((req) => (
                <div key={req._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">₹{req.amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Requested on {formatDate(req.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    req.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' :
                    req.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                    'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {req.status?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work Payments Transactions */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 px-1">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100/50">
              <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 font-bold text-sm mb-1">No transaction logs yet</p>
              <p className="text-xs text-gray-500">Your job payouts history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                    <FiArrowUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm">Job Payment Credited</p>
                      <p className="font-bold text-green-600 text-sm">+₹{txn.amount}</p>
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{txn.description}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">{formatDate(txn.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payout Withdrawal Form Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWithdrawModalOpen(false)} />
          <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Request Payout</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Available Balance: ₹{wallet.balance}</label>
                <input
                  type="number"
                  placeholder="Enter payout amount"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">UPI ID (Google Pay / PhonePe / Paytm)</label>
                <input
                  type="text"
                  placeholder="e.g. name@upi"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="Add any request notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default WorkerWallet;
