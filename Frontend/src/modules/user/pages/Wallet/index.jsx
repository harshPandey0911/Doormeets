import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight, FiLoader, FiX, FiGift, FiPlus, FiMinus, FiRotateCcw } from 'react-icons/fi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { walletService } from '../../../../services/walletService';
import { voucherService } from '../../../../services/voucherService';
import { bookingService } from '../../../../services/bookingService';
import LogoLoader from '../../../../components/common/LogoLoader';
import NotificationBell from '../../components/common/NotificationBell';
import { themeColors } from '../../../../theme';
import { apiCache } from '../../../../utils/apiCache';

const TX_CACHE_KEY = 'user:wallet:transactions';

const Wallet = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Voucher Redemption states
  const [voucherCode, setVoucherCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true);
        const [balanceResponse, transactionsResponse, bookingsResponse] = await Promise.all([
          walletService.getBalance(),
          walletService.getTransactions(),
          bookingService.getUserBookings()
        ]);

        if (balanceResponse.success) {
          setWalletBalance(balanceResponse.data.balance || 0);
          setLoyaltyPoints(balanceResponse.data.loyaltyPoints || 0);

          // Update profile cache with fresh wallet values
          const profile = apiCache.getStale('user:profile');
          if (profile) {
            profile.walletBalance = balanceResponse.data.balance || 0;
            profile.loyaltyPoints = balanceResponse.data.loyaltyPoints || 0;
            apiCache.set('user:profile', profile, 60);
          }
        }

        if (transactionsResponse.success) {
          const freshTx = transactionsResponse.data || [];
          setTransactions(freshTx);
          setHasMore(freshTx.length === 10);
          setPage(1); // reset to page 1 on fresh load
          apiCache.set(TX_CACHE_KEY, freshTx, 30); // Cache transactions 30s
        }

        if (bookingsResponse && bookingsResponse.success) {
          const userBookings = bookingsResponse.data || [];
          setBookings(userBookings);

          // Construct Loyalty History Ledger
          const history = [];
          userBookings.forEach(booking => {
            // 1. Earned Loyalty Points upon booking completion
            if (booking.loyaltyPointsEarned > 0) {
              history.push({
                id: `earn-${booking._id || booking.id}`,
                type: 'earn',
                amount: booking.loyaltyPointsEarned,
                description: `Earned from completing booking #${booking.bookingNumber}`,
                date: booking.completedAt || booking.updatedAt || booking.createdAt,
                bookingNumber: booking.bookingNumber,
                serviceName: booking.serviceName
              });
            }

            // 2. Redeemed Loyalty Points during checkout
            if (booking.loyaltyPointsRedeemed > 0) {
              history.push({
                id: `redeem-${booking._id || booking.id}`,
                type: 'redeem',
                amount: booking.loyaltyPointsRedeemed,
                description: `Redeemed at checkout for booking #${booking.bookingNumber}`,
                date: booking.createdAt,
                bookingNumber: booking.bookingNumber,
                serviceName: booking.serviceName
              });
            }

            // 3. Refunded Loyalty Points on cancellation
            if (booking.loyaltyPointsRefunded && booking.loyaltyPointsRedeemed > 0) {
              history.push({
                id: `refund-${booking._id || booking.id}`,
                type: 'refund',
                amount: booking.loyaltyPointsRedeemed,
                description: `Refunded for cancelled booking #${booking.bookingNumber}`,
                date: booking.updatedAt || booking.createdAt,
                bookingNumber: booking.bookingNumber,
                serviceName: booking.serviceName
              });
            }
          });

          // Sort by date descending
          history.sort((a, b) => new Date(b.date) - new Date(a.date));
          setLoyaltyHistory(history);
        }
      } catch (error) {
        toast.error('Failed to load wallet and loyalty details');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, []);

  const loadMoreTransactions = async () => {
    if (fetchingMore || !hasMore) return;
    setFetchingMore(true);
    try {
      const nextPage = page + 1;
      const response = await walletService.getTransactions({ page: nextPage, limit: 10 });
      if (response.success) {
        const nextTx = response.data || [];
        setTransactions(prev => [...prev, ...nextTx]);
        setPage(nextPage);
        setHasMore(nextTx.length === 10);
      } else {
        toast.error('Failed to load more transactions');
      }
    } catch (err) {
      toast.error('Failed to load more transactions');
    } finally {
      setFetchingMore(false);
    }
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setClaiming(true);
    try {
      const response = await voucherService.redeemVoucher(
        voucherCode.trim().toUpperCase()
      );

      if (response.success && response.data?.type === 'wallet') {
        toast.success(response.message || `₹${response.data.value} added to your wallet balance!`);
        setVoucherCode('');

        // Reload wallet balance and transactions
        const [balanceResponse, transactionsResponse] = await Promise.all([
          walletService.getBalance(),
          walletService.getTransactions()
        ]);
        if (balanceResponse.success) {
          setWalletBalance(balanceResponse.data.balance || 0);
          setLoyaltyPoints(balanceResponse.data.loyaltyPoints || 0);
        }
        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data || []);
        }
      } else if (response.success) {
        toast.success('Discount voucher claimed successfully! You can use it at checkout.');
        setVoucherCode('');
      } else {
        toast.error(response.message || 'Failed to redeem voucher');
      }
    } catch (error) {
      toast.error(error.message || 'Invalid or expired gift voucher code');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative bg-white">
      {/* Refined Premium Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at top, #FFFFFF 0%, #F8F9FA 100%)'
          }}
        />
        {/* Elegant Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#B33A35'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Modern Glassmorphism Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.02]"
            >
              <FiArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-xl font-extrabold text-black tracking-tight">Wallet</h1>
          </div>
          <NotificationBell />
        </header>

        <main className="px-4 py-6">
          {/* Referral Banner */}
          <div className="bg-gray-100 rounded-xl p-4 mb-4 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-black mb-1">Refer your friends and earn</h2>
              <p className="text-sm text-gray-700">They get ₹100 and you get ₹100</p>
            </div>
            {/* Gift Box Illustration */}
            <div className="absolute right-4 top-2 z-0">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-400 rounded-lg flex items-center justify-center transform rotate-12 shadow-md">
                  <div className="w-16 h-16 bg-pink-300 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">🎁</span>
                  </div>
                </div>
                {/* Sparkles */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-200 rounded-full"></div>
                <div className="absolute top-4 -left-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
                <div className="absolute bottom-4 -right-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
          </div>

          {/* Main Balance & Loyalty Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <p className="text-teal-250 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MdAccountBalanceWallet className="w-4 h-4" /> Wallet Balance
                </p>
                <h2 className="text-3xl font-extrabold text-white">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </h2>
                <p className="text-[10px] text-teal-100 mt-2 font-medium">Use for quick checkouts and refunds</p>
              </div>
            </div>

            {/* Loyalty Points Card */}
            <div
              onClick={() => setShowLoyaltyModal(true)}
              className="bg-gradient-to-r from-teal-900 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>🎁</span> Loyalty Points
                </p>
                <h2 className="text-3xl font-extrabold text-emerald-100 flex items-baseline gap-2">
                  {loyaltyPoints.toLocaleString('en-IN')} <span className="text-sm font-normal text-emerald-300">points</span>
                </h2>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                  <span className="text-[10px] text-emerald-200 font-medium">1 point = ₹1 discount at checkout</span>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-emerald-100 font-bold group-hover:bg-white/20 transition-colors">History →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Redeem Gift Card / Voucher Card */}
          <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-xs relative overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>🎁</span> Redeem Gift Card / Voucher
            </h3>
            <p className="text-xs text-gray-500 mb-3.5 leading-relaxed">
              Have a unique gift card code? Type it below to instantly credit cash to your wallet balance.
            </p>
            <form onSubmit={handleRedeemVoucher} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Code (e.g. GIFT500)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                disabled={claiming}
                className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
              />
              <button
                type="submit"
                disabled={claiming || !voucherCode.trim()}
                className="px-5 py-2.5 bg-black hover:bg-slate-800 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-sm font-bold shadow-xs transition-all shrink-0"
              >
                {claiming ? 'Claiming...' : 'Claim'}
              </button>
            </form>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Spent</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">All booking expenses through platform</p>
                </div>
              </div>
              <p className="text-xl font-black text-gray-900 font-mono">
                ₹{transactions
                  .filter(t => ['payment', 'withdrawal', 'platform_fee', 'convenience_fee', 'gst', 'worker_payment', 'cash_collected'].includes(t.type))
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div>
            <h3 className="text-base font-bold text-black mb-3">Recent Transactions</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-20">
                  <LogoLoader fullScreen={false} />
                  <p className="text-sm text-gray-500 mt-4">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">No wallet activity yet</p>
                </div>
              ) : (
                transactions.map((item, index) => {
                  const date = new Date(item.date);
                  const formattedDate = date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  // Determine styles based on transaction type
                  let typeStyle = { color: 'text-gray-600', bg: 'bg-gray-100', icon: '•', sign: '' };

                  if (['credit', 'refund', 'topup', 'referral', 'cashback', 'cash_collected'].includes(item.type)) {
                    // User requested cash_collected in GREEN
                    const signToUse = ['credit', 'refund', 'topup', 'referral', 'cashback'].includes(item.type) ? '+' : '';
                    typeStyle = { color: 'text-green-600', bg: 'bg-green-50', icon: '↓', sign: signToUse };
                  } else if (['payment', 'debit', 'withdrawal'].includes(item.type)) {
                    typeStyle = { color: 'text-red-600', bg: 'bg-red-50', icon: '↑', sign: '-' };
                  } else if (['penalty', 'fine', 'cancellation_fee'].includes(item.type)) {
                    typeStyle = { color: 'text-orange-600', bg: 'bg-orange-50', icon: '!', sign: '-' };
                  }

                  return (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${typeStyle.bg}`}
                        >
                          <span className={`text-lg font-bold ${typeStyle.color}`}>
                            {item.type === 'penalty' ? '!' : typeStyle.sign}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {item.description || item.title || 'Transaction'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{formattedDate}</p>
                            {item.type && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${typeStyle.bg} ${typeStyle.color}`}>
                                {item.type === 'refund' ? 'refunded' : item.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${typeStyle.color}`}
                        >
                          {typeStyle.sign}₹{item.amount.toLocaleString('en-IN')}
                        </p>
                        {item.balanceAfter !== undefined && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Bal: ₹{item.balanceAfter.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Load More Button */}
              {hasMore && transactions.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={loadMoreTransactions}
                    disabled={fetchingMore}
                    className="w-full py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {fetchingMore ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin text-gray-500" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Transactions</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Loyalty Points History Modal */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-900 to-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">Loyalty Points History</h3>
                  <p className="text-xs text-emerald-250 mt-0.5">Current Balance: <strong className="text-white text-sm">{loyaltyPoints}</strong> points</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiGift className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">No loyalty history found</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Complete services to earn loyalty points which can be redeemed at checkout.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loyaltyHistory.map((item) => {
                    const isCredit = item.type === 'earn' || item.type === 'refund';
                    const amountSign = isCredit ? '+' : '-';
                    const amountColor = isCredit ? 'text-green-600' : 'text-amber-600';
                    const badgeBg = isCredit ? 'bg-green-50' : 'bg-amber-50';

                    const itemDate = new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-3 hover:border-gray-250 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${badgeBg} ${amountColor}`}>
                          {item.type === 'earn' && <FiPlus className="w-4 h-4" />}
                          {item.type === 'redeem' && <FiMinus className="w-4 h-4" />}
                          {item.type === 'refund' && <FiRotateCcw className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug">
                            {item.description}
                          </p>
                          {item.serviceName && (
                            <p className="text-xs text-gray-600 mt-1 font-medium italic">
                              Service: {item.serviceName}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            {itemDate}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-extrabold ${amountColor}`}>
                            {amountSign}{item.amount}
                          </p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeBg} ${amountColor}`}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
