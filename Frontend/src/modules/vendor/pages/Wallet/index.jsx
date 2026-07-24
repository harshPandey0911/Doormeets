import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiArrowDown, FiArrowRight, FiCheckCircle, FiClock, FiPlusCircle, FiArrowUp, FiSend, FiAlertCircle, FiAward, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';
import vendorWalletService from '../../../../services/vendorWalletService';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Wallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('vendor_wallet_cache'));
  const [wallet, setWallet] = useState({
    credits: 0,
    dues: 0,
    totalCashCollected: 0,
    totalSettled: 0,
    totalWithdrawn: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedTxn, setExpandedTxn] = useState(null);
  
  const [barChartData, setBarChartData] = useState([]);

  useLayoutEffect(() => {
    const bgStyle = themeColors.backgroundGradient;
    document.documentElement.style.background = bgStyle;
    document.body.style.background = bgStyle;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    // Load cached data instantly for 0ms render
    try {
      const cached = sessionStorage.getItem('vendor_wallet_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.wallet) setWallet(parsed.wallet);
        if (parsed.barChartData) setBarChartData(parsed.barChartData);
        setLoading(false);
      }
    } catch (e) {}
    loadWalletData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const typeParam = filter === 'all' ? undefined : filter;
      
      const promises = [];
      if (filter !== 'credits_history') {
        promises.push(vendorWalletService.getTransactions({ type: typeParam }).catch(() => ({ success: false, data: [] })));
      } else {
        promises.push(Promise.resolve({ success: true, data: [] }));
      }

      if (filter === 'all' || filter === 'credits_history') {
        promises.push(api.get('/vendors/credits/history').catch(() => ({ data: { success: false, data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { success: true, data: [] } }));
      }

      const [res, creditRes] = await Promise.all(promises);

      let allTxns = [];
      if (res.success && res.data) {
        allTxns = [...allTxns, ...res.data];
      }

      if (creditRes?.data?.success && creditRes?.data?.data) {
        const formattedCredits = creditRes.data.data.map(c => ({
          _id: c._id,
          type: c.type === 'purchase' ? 'credit_purchase' : (c.type === 'lead_deduct' ? 'credit_deduct' : 'credit_txn'),
          amount: c.amount,
          status: 'completed',
          createdAt: c.createdAt,
          description: c.description
        }));
        allTxns = [...allTxns, ...formattedCredits];
      }
      
      // Sort combined by date descending
      allTxns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTransactions(allTxns);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    }
  };

  const loadWalletData = async () => {
    try {
      const hasCache = !!sessionStorage.getItem('vendor_wallet_cache');
      if (!hasCache) setLoading(true);
      const [walletRes, analyticsRes] = await Promise.all([
        vendorWalletService.getWallet(),
        vendorWalletService.getEarningsAnalytics({ period: 'daily', filter: 'week' }).catch((err) => {
          console.error('Analytics Error:', err);
          return null;
        })
      ]);

      if (walletRes.success) {
        setWallet({
          credits: walletRes.data.credits !== undefined ? walletRes.data.credits : (walletRes.data.vendor?.wallet?.credits || 0),
          dues: walletRes.data.dues || 0,
          earnings: walletRes.data.earnings || 0,
          totalCashCollected: walletRes.data.totalCashCollected || 0,
          totalSettled: walletRes.data.totalSettled || 0,
          totalWithdrawn: walletRes.data.totalWithdrawn || 0
        });
      }

      if (analyticsRes?.success) {
        const rawChartData = analyticsRes.data.chartData || [];
        const maxCredits = Math.max(...rawChartData.map(d => d.amount / 10), 1);
        
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          // format to local YYYY-MM-DD
          const dateStr = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
          ].join('-');
          
          const found = rawChartData.find(item => item.date === dateStr);
          const amountInRupees = found ? found.amount : 0;
          const credits = amountInRupees / 10;
          const dayInitial = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
          
          last7Days.push({
            day: dayInitial,
            amount: credits,
            height: credits > 0 ? `${Math.max((credits / maxCredits) * 100, 5)}%` : '0%'
          });
        }
        setBarChartData(last7Days);
        var finalChartData = last7Days;
      } else {
        // Fallback empty week
        const emptyWeek = Array(7).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
            amount: 0,
            height: '0%'
          };
        });
        setBarChartData(emptyWeek);
        var finalChartData = emptyWeek;
      }
      // Save to session cache for instant next visit
      sessionStorage.setItem('vendor_wallet_cache', JSON.stringify({
        wallet: {
          credits: walletRes.data.credits !== undefined ? walletRes.data.credits : (walletRes.data.vendor?.wallet?.credits || 0),
          dues: walletRes.data.dues || 0,
          earnings: walletRes.data.earnings || 0,
          totalCashCollected: walletRes.data.totalCashCollected || 0,
          totalSettled: walletRes.data.totalSettled || 0,
          totalWithdrawn: walletRes.data.totalWithdrawn || 0
        },
        barChartData: finalChartData
      }));
    } catch (error) {
      console.error('loadWalletData error:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };


  // Display value for credits (exact decimal without rounding error)
  const rawCredits = wallet.credits !== undefined && wallet.credits !== null ? wallet.credits : (wallet.earnings ? (wallet.earnings / 10) : 0);
  const displayCredits = Number.isInteger(rawCredits) ? rawCredits : parseFloat(rawCredits).toFixed(2);

  const getTransactionIcon = (txn) => {
    const isIncentive = txn.type === 'credit';
    if (isIncentive) {
      return <FiAward className="w-5 h-5 text-green-600" />;
    }
    switch (txn.type) {
      case 'cash_collected':
        return <FiArrowDown className="w-5 h-5 text-red-500" />;
      case 'earnings_credit':
        return <FiArrowUp className="w-5 h-5 text-green-500" />;
      case 'settlement':
        return <FiSend className="w-5 h-5 text-blue-500" />;
      case 'withdrawal':
        return <FiDollarSign className="w-5 h-5 text-purple-500" />;
      case 'tds_deduction':
        return <FiAlertCircle className="w-5 h-5 text-amber-500" />;
      case 'credit_purchase':
        return <FiPlusCircle className="w-5 h-5 text-blue-500" />;
      case 'credit_deduct':
        return <FiClock className="w-5 h-5 text-orange-500" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionLabel = (txn) => {
    const isIncentive = txn.type === 'credit';
    if (isIncentive) {
      return 'Incentive';
    }
    switch (txn.type) {
      case 'cash_collected':
        return 'Cash Collected';
      case 'earnings_credit':
        return 'Earnings Credited';
      case 'settlement':
        return 'Settlement Paid';
      case 'withdrawal':
        return 'Withdrawal Payout';
      case 'tds_deduction':
        return 'TDS Deduction';
      case 'credit_purchase':
        return 'Credits Purchased';
      case 'credit_deduct':
        return 'Lead Deduction';
      default:
        return txn.type;
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

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Wallet" />

      <main className="px-4 py-6 space-y-6">

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {/* Balance card skeleton */}
            <div className="bg-white rounded-md p-4 shadow-2xs border border-gray-100">
              <div className="h-3 w-32 bg-slate-100 rounded mb-3"></div>
              <div className="h-8 w-48 bg-slate-100 rounded mb-2"></div>
              <div className="flex gap-2 mt-4">
                <div className="h-10 flex-1 bg-slate-100 rounded-md"></div>
                <div className="h-10 flex-1 bg-slate-100 rounded-md"></div>
              </div>
            </div>
            {/* Chart skeleton */}
            <div className="bg-white rounded-md p-4 shadow-2xs border border-gray-100">
              <div className="h-3 w-40 bg-slate-100 rounded mb-4"></div>
              <div className="flex items-end justify-between h-28 px-2 gap-2">
                {[60, 80, 40, 90, 55, 70, 45].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-slate-100 rounded-t-md" style={{ height: `${h}%` }}></div>
                    <div className="h-2 w-4 bg-slate-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Transaction list skeleton */}
            <div className="bg-white rounded-md p-4 shadow-2xs border border-gray-100 space-y-3">
              <div className="h-3 w-36 bg-slate-100 rounded mb-2"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 bg-slate-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-slate-100 rounded"></div>
                    <div className="h-2 w-20 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (<>

        {/* Earnings Chart Section */}

        <div className="bg-white rounded-md p-4 md:p-5 shadow-2xs border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-gray-800 font-bold text-base md:text-lg">This Week's Earnings</h2>
              <p className="text-gray-500 text-xs">Last 7 Days</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl md:text-2xl font-black text-gray-900">{(displayCredits + (wallet.totalCashCollected / 10)).toLocaleString()} <span className="text-xs font-bold text-gray-500">Credits</span></h2>
            </div>
          </div>

          {/* Simple CSS Bar Chart */}
          <div className="flex items-end justify-between h-28 md:h-32 mt-3 px-2">
            {barChartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full">
                <div className="w-6 md:w-8 bg-blue-100 rounded-t-md relative group flex flex-col justify-end h-full">
                  <div 
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-500" 
                    style={{ height: data.height }}
                  ></div>
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded font-bold transition-opacity whitespace-nowrap">
                    {data.amount} Credits
                  </div>
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-md p-5 md:p-6 shadow-md text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 font-semibold mb-1 text-xs uppercase tracking-wider">Credits Balance</p>
              <div className="flex items-baseline gap-1">
                <h2 className="text-3xl md:text-4xl font-black">{displayCredits}</h2>
                <span className="text-blue-200 font-medium text-xs md:text-sm">Credits</span>
              </div>
              <p className="text-[10px] text-blue-200 mt-0.5">1 Credit = ₹10</p>
            </div>
            
            <div 
              onClick={() => navigate('/vendor/wallet/credit-history')}
              className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/30 transition"
              title="View Credit History"
            >
              <FiArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {rawCredits > 0 ? (
            <button
              onClick={() => navigate('/vendor/wallet/withdraw')}
              className="mt-5 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white py-2.5 rounded-md font-bold text-xs md:text-sm transition-colors shadow-2xs backdrop-blur-sm"
            >
              Withdraw Funds
            </button>
          ) : (
            <div className="mt-5 text-blue-100 text-[11px] font-semibold text-center border-t border-white/20 pt-2">
              Complete online jobs to earn withdrawable credits!
            </div>
          )}
        </div>

        {/* Amount Due to Admin (COD) */}
        <div className="bg-white rounded-md p-4 md:p-5 shadow-2xs border border-red-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-gray-800 font-bold text-base md:text-lg">Pending to Admin</h2>
          </div>
          
          <div className="bg-red-50 rounded-md p-3.5 border border-red-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] text-red-600 font-semibold uppercase">Total Dues (COD)</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-xl md:text-2xl font-black text-red-700">{wallet.dues / 10}</h3>
                  <span className="text-xs font-bold text-red-600">Credits</span>
                </div>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-100 flex items-center justify-center">
                <FiArrowDown className="w-4 h-4 text-red-600" />
              </div>
            </div>
            
            {wallet.dues > 0 ? (
              <button
                onClick={() => navigate('/vendor/wallet/settle')}
                className="w-full bg-red-600 text-white py-2.5 rounded-md font-bold text-xs md:text-sm hover:bg-red-700 transition-colors shadow-2xs"
              >
                Pay Dues Now
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md text-xs md:text-sm font-bold">
                <FiCheckCircle />
                No pending dues
              </div>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'cash_collected', label: 'Cash Collected' },
            { id: 'settlement', label: 'Settlements' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'credits_history', label: 'Credits' },
            { id: 'incentive', label: 'Incentives' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all ${filter === filterOption.id
                ? 'text-white'
                : 'bg-white text-gray-700'
                }`}
              style={
                filter === filterOption.id
                  ? {
                    background: themeColors.button,
                    boxShadow: `0 2px 6px ${themeColors.button}33`,
                  }
                  : {
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  }
              }
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Transactions/Ledger */}
        <div>
          <h3 className="font-bold text-gray-800 text-sm md:text-base mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-md p-6 text-center shadow-2xs border border-gray-100">
              <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-700 font-bold text-sm mb-1">No transactions yet</p>
              <p className="text-xs text-gray-500">Your ledger will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((txn) => {
                const isIncentive = txn.type === 'credit';
                return (
                  <div
                    key={txn._id}
                    onClick={() => setExpandedTxn(expandedTxn === txn._id ? null : txn._id)}
                    className="bg-white rounded-md p-3.5 shadow-2xs border-l-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderLeftColor:
                        txn.type === 'cash_collected' ? '#DC2626' :
                          isIncentive ? '#10B981' :
                            txn.type === 'settlement' ? '#10B981' :
                              txn.type === 'withdrawal' ? '#8B5CF6' :
                                txn.type === 'tds_deduction' ? '#F59E0B' :
                                  txn.type === 'platform_fee' ? '#E11D48' : '#F97316'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 md:w-11 md:h-11 rounded-md flex items-center justify-center"
                        style={{
                          background:
                            txn.type === 'cash_collected' ? '#FEE2E2' :
                              isIncentive ? '#D1FAE5' :
                                txn.type === 'settlement' ? '#D1FAE5' :
                                  txn.type === 'withdrawal' ? '#EDE9FE' :
                                    txn.type === 'tds_deduction' ? '#FEF3C7' :
                                      txn.type === 'platform_fee' ? '#FFF1F2' : '#FFEDD5'
                        }}
                      >
                        {getTransactionIcon(txn)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-gray-900 text-xs md:text-sm">
                            {getTransactionLabel(txn)}
                          </p>
                          <p className={`text-base font-bold whitespace-nowrap flex-shrink-0 ml-2 text-right ${['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type)
                            ? 'text-red-600'
                            : 'text-green-600'
                            }`}>
                            {['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type) ? '-' : '+'}{(Math.abs(txn.amount) / 10).toLocaleString()} <span className="text-[10px]">Credits</span>
                          </p>
                        </div>

                        <p className="text-[11px] text-gray-600 truncate mb-1">{txn.description}</p>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{formatDate(txn.createdAt)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                            txn.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {expandedTxn === txn._id ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedTxn === txn._id && txn.bookingId && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-1">Booking Details</p>
                        <div className="bg-gray-50 rounded-md p-2.5 space-y-1">
                          <p className="text-xs"><span className="text-gray-500">Booking ID:</span> <span className="font-semibold text-gray-900">{txn.bookingId.bookingNumber}</span></p>
                          <p className="text-xs"><span className="text-gray-500">Service:</span> <span className="font-semibold text-gray-900">{txn.bookingId.serviceName}</span></p>
                          {txn.bookingId.scheduledDate && (
                            <p className="text-xs"><span className="text-gray-500">Scheduled Date:</span> <span className="font-semibold text-gray-900">{formatDate(txn.bookingId.scheduledDate)}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </>)}

      </main>
      <BottomNav />
    </div>
  );
};

export default Wallet;
