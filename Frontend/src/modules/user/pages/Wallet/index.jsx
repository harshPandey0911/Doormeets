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
  const [selectedTx, setSelectedTx] = useState(null);
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
    <div className="min-h-screen pb-20 relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Refined Premium Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b px-4 py-4 w-full" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
          <div className="max-w-[1360px] mx-auto px-0 md:px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Wallet</h1>
            </div>
            <NotificationBell />
          </div>
        </header>

        <main className="max-w-[1360px] mx-auto px-3 md:px-8 lg:px-12 py-3 md:py-6">
          {/* Referral Banner */}
          <div className="rounded-xl p-3 mb-3 relative overflow-hidden flex items-center justify-between border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="relative z-10 pr-16">
              <h2 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Refer your friends and earn</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>They get ₹100 and you get ₹100</p>
            </div>
            {/* Gift Box Illustration */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-0 opacity-90 scale-75 origin-right">
              <div className="relative">
                <div className="w-14 h-14 bg-purple-500/20 rounded-lg flex items-center justify-center transform rotate-12 shadow-md">
                  <div className="w-11 h-11 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Balance & Loyalty Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <p className="text-teal-250 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MdAccountBalanceWallet className="w-3.5 h-3.5" /> Wallet Balance
                </p>
                <h2 className="text-2xl font-extrabold text-white">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </h2>
                <p className="text-[9.5px] text-teal-100 mt-1 font-medium">Use for quick checkouts and refunds</p>
              </div>
            </div>

            {/* Loyalty Points Card */}
            <div
              onClick={() => setShowLoyaltyModal(true)}
              className="bg-gradient-to-r from-teal-900 to-emerald-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-emerald-300 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>🎁</span> Loyalty Points
                </p>
                <h2 className="text-2xl font-extrabold text-emerald-100 flex items-baseline gap-1.5">
                  {loyaltyPoints.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-300">points</span>
                </h2>
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/10">
                  <span className="text-[9.5px] text-emerald-200 font-medium">1 point = ₹1 discount at checkout</span>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-emerald-100 font-bold group-hover:bg-white/20 transition-colors">History →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Redeem Gift Card / Voucher Card */}
          <div className="rounded-xl p-3.5 mb-4 border shadow-xs relative overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>🎁</span> Redeem Gift Card / Voucher
            </h3>
            <p className="text-[11px] mb-2.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Have a unique gift card code? Type it below to instantly credit cash to your wallet balance.
            </p>
            <form onSubmit={handleRedeemVoucher} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Code (e.g. GIFT500)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                disabled={claiming}
                className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-xs font-semibold placeholder:text-gray-400 focus:outline-hidden transition-all uppercase"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                type="submit"
                disabled={claiming || !voucherCode.trim()}
                className="px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
              >
                {claiming ? 'Claiming...' : 'Claim Code'}
              </button>
            </form>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="p-3.5 rounded-xl border shadow-xs flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Spent</p>
                  <p className="text-[10px] leading-tight font-medium truncate" style={{ color: 'var(--text-secondary)' }}>All booking expenses through platform</p>
                </div>
              </div>
              <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                ₹{transactions
                  .filter(t => ['payment', 'withdrawal', 'platform_fee', 'convenience_fee', 'gst', 'worker_payment', 'cash_collected'].includes(t.type))
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div>
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-20">
                  <LogoLoader fullScreen={false} />
                  <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No wallet activity yet</p>
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
                  let typeStyle = { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: '•', sign: '' };

                  if (['credit', 'refund', 'topup', 'referral', 'cashback', 'cash_collected'].includes(item.type)) {
                    // User requested cash_collected in GREEN
                    const signToUse = ['credit', 'refund', 'topup', 'referral', 'cashback'].includes(item.type) ? '+' : '';
                    typeStyle = { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: '↓', sign: signToUse };
                  } else if (['payment', 'debit', 'withdrawal'].includes(item.type)) {
                    typeStyle = { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: '↑', sign: '-' };
                  } else if (['penalty', 'fine', 'cancellation_fee'].includes(item.type)) {
                    typeStyle = { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '!', sign: '-' };
                  }

                  return (
                    <div
                      key={item.id || index}
                      onClick={() => setSelectedTx(item)}
                      className="flex items-center justify-between p-3.5 border rounded-xl shadow-xs cursor-pointer active:scale-[0.99] transition-all"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${typeStyle.bg}`}
                        >
                          <span className={`text-base font-bold ${typeStyle.color}`}>
                            {item.type === 'penalty' ? '!' : typeStyle.sign}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.description || item.title || 'Transaction'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{formattedDate}</p>
                            {item.type && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold capitalize ${typeStyle.bg} ${typeStyle.color}`}>
                                {item.type === 'refund' ? 'refunded' : item.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-black ${typeStyle.color}`}
                        >
                          {typeStyle.sign}₹{item.amount.toLocaleString('en-IN')}
                        </p>
                        {item.balanceAfter !== undefined && (
                          <p className="text-[9.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
                    className="w-full py-3 rounded-xl text-xs font-bold border active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {fetchingMore ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" style={{ color: 'var(--text-secondary)' }} />
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border flex flex-col animate-slideUp" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            {/* Modal Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-900 to-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">Transaction Details</h3>
                  <p className="text-[10px] text-emerald-250 opacity-90">Full information & reference</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <FiX className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 space-y-2.5 max-h-[75vh] overflow-y-auto">
              <div className="text-center p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span className={`text-2xl font-black ${['credit', 'refund', 'topup', 'referral', 'cashback', 'cash_collected'].includes(selectedTx.type) ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {['payment', 'debit', 'withdrawal', 'penalty', 'fine'].includes(selectedTx.type) ? '-' : '+'}₹{selectedTx.amount?.toLocaleString('en-IN')}
                </span>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                    {selectedTx.type}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>Description / Title</label>
                  <p className="font-semibold leading-snug p-2.5 rounded-xl border text-[11.5px] whitespace-pre-wrap" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    {selectedTx.description || selectedTx.title || 'No description available'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                    <label className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>Date & Time</label>
                    <p className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      {new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {selectedTx.balanceAfter !== undefined && (
                    <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>Balance After</label>
                      <p className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>₹{selectedTx.balanceAfter?.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {selectedTx._id && (
                  <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                    <label className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>Transaction ID</label>
                    <p className="font-mono text-[10px] break-all font-medium" style={{ color: 'var(--text-secondary)' }}>{selectedTx._id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t flex justify-end" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 bg-brand hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
