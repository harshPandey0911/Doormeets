import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdAccountBalanceWallet, MdPeople, MdHourglassEmpty, MdCheckCircle, MdContentCopy, MdQrCodeScanner, MdShare, MdEdit, MdHistory, MdArrowUpward, MdArrowDownward } from 'react-icons/md';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLinkText, setInviteLinkText] = useState('');
  const [isEditingReferral, setIsEditingReferral] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [savingReferral, setSavingReferral] = useState(false);
  const [referralError, setReferralError] = useState('');

  // Credit History state
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [showCreditHistory, setShowCreditHistory] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.get(`${API_URL}/shop/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setData(response.data.data);
        if (response.data.data?.inviteLink) {
          setInviteLinkText(response.data.data.inviteLink);
        }
        if (response.data.data?.referralCode) {
          setReferralCodeInput(response.data.data.referralCode);
        }
      } else {
        setError('Failed to fetch dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching stats.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditHistory = async () => {
    try {
      setCreditLoading(true);
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.get(`${API_URL}/shop/credit-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCreditHistory(response.data.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch credit history:', err);
    } finally {
      setCreditLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch credit history when section is expanded
  useEffect(() => {
    if (showCreditHistory && creditHistory.length === 0) {
      fetchCreditHistory();
    }
  }, [showCreditHistory]);

  const handleCopy = () => {
    if (inviteLinkText) {
      navigator.clipboard.writeText(inviteLinkText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!inviteLinkText) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Doormeets as Vendor',
          text: 'Hey, register on Doormeets using my referral link and start receiving customer bookings!',
          url: inviteLinkText
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing link:', err);
        }
      }
    } else {
      const text = `Join Doormeets as Vendor! Register using my link to get customer bookings: ${inviteLinkText}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSaveReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      setReferralError('Referral code cannot be empty.');
      return;
    }
    setSavingReferral(true);
    setReferralError('');
    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.put(
        `${API_URL}/shop/referral-code`,
        { referralCode: referralCodeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setInviteLinkText(response.data.data.inviteLink);
        setReferralCodeInput(response.data.data.referralCode);
        
        // Update localStorage for ShopLayout header
        const shopUserStr = localStorage.getItem('shopUser');
        if (shopUserStr) {
          try {
            const shopUserObj = JSON.parse(shopUserStr);
            shopUserObj.referralCode = response.data.data.referralCode;
            localStorage.setItem('shopUser', JSON.stringify(shopUserObj));
          } catch (e) {
            console.error('Error updating shopUser in localStorage:', e);
          }
        }
        
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            referralCode: response.data.data.referralCode,
            inviteLink: response.data.data.inviteLink,
            inviteQrCodeDataUrl: response.data.data.inviteQrCodeDataUrl
          };
        });
        
        setIsEditingReferral(false);
        // Reload to sync layout headers instantly
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setReferralError(err.response?.data?.message || 'Failed to update referral code.');
    } finally {
      setSavingReferral(false);
    }
  };

  const handleSaveInviteLinkDirect = async () => {
    if (!inviteLinkText.trim()) {
      setReferralError('Link cannot be empty.');
      return;
    }

    setSavingReferral(true);
    setReferralError('');
    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.put(
        `${API_URL}/shop/referral-code`,
        { inviteLink: inviteLinkText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setInviteLinkText(response.data.data.inviteLink);
        setReferralCodeInput(response.data.data.referralCode);
        
        const shopUserStr = localStorage.getItem('shopUser');
        if (shopUserStr) {
          try {
            const shopUserObj = JSON.parse(shopUserStr);
            shopUserObj.referralCode = response.data.data.referralCode;
            localStorage.setItem('shopUser', JSON.stringify(shopUserObj));
          } catch (e) {
            console.error('Error updating shopUser in localStorage:', e);
          }
        }
        
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            referralCode: response.data.data.referralCode,
            inviteLink: response.data.data.inviteLink,
            inviteQrCodeDataUrl: response.data.data.inviteQrCodeDataUrl
          };
        });
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setReferralError(err.response?.data?.message || 'Failed to update referral code.');
    } finally {
      setSavingReferral(false);
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'shop_referral_earned': return 'Referral Commission Earned';
      case 'credit': return 'Credit Added';
      case 'debit': return 'Debit';
      case 'withdrawal': return 'Withdrawal / Deducted';
      case 'refund': return 'Refund';
      default: return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Transaction';
    }
  };

  const isPositiveTransaction = (type) => {
    return ['shop_referral_earned', 'credit', 'refund', 'earnings_credit'].includes(type);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-600 font-medium">
        {error}
      </div>
    );
  }

  const stats = data?.stats || { totalReferred: 0, pendingApproval: 0, approved: 0, rejected: 0 };
  const rewards = stats.rewardsConfig || { shopOwnerReward: 100, vendorReward: 50 };

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Wallet Balance */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <MdAccountBalanceWallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Wallet Balance</p>
            <p className="text-2xl font-bold text-gray-800">₹{data?.walletBalance || 0}</p>
          </div>
        </div>

        {/* Total Referred */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <MdPeople className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Referred</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalReferred}</p>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <MdHourglassEmpty className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingApproval}</p>
          </div>
        </div>

        {/* Approved Vendors */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <MdCheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
          </div>
        </div>
      </div>

      {/* Credit History Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="p-6 border-b border-gray-50 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-blue-50/80 transition-all"
          onClick={() => setShowCreditHistory(!showCreditHistory)}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
              <MdHistory className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Credit History</h3>
              <p className="text-xs text-gray-400 mt-0.5">View all wallet transactions — where money came from and where it went</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              Balance: ₹{data?.walletBalance || 0}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showCreditHistory ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showCreditHistory && (
          <div className="p-6">
            {creditLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : creditHistory.length > 0 ? (
              <div className="space-y-3">
                {creditHistory.map((tx, idx) => {
                  const positive = isPositiveTransaction(tx.type);
                  return (
                    <div
                      key={tx._id || idx}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-sm ${
                        positive
                          ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/70'
                          : 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/70'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${positive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {positive ? <MdArrowDownward className="w-5 h-5" /> : <MdArrowUpward className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{getTransactionLabel(tx.type)}</p>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-[300px] truncate">{tx.description}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {positive ? '+' : '-'}₹{Math.abs(tx.amount)}
                        </p>
                        {(tx.balanceAfter !== undefined && tx.balanceAfter !== null) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Balance: ₹{tx.balanceAfter}</p>
                        )}
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider ${
                          tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          tx.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <MdAccountBalanceWallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold text-sm">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Your wallet credit & debit history will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR & Invite Section */}
      <div className={`grid grid-cols-1 ${data?.adminQrCodeUrl ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {/* Invite Link & Rewards Info */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Invite Vendors & Earn Commission</h3>
            <p className="text-gray-500 text-sm mb-6">
              Share your invite link with professionals. When they register and get approved by the admin, you will receive <span className="font-semibold text-emerald-600">₹{rewards.shopOwnerReward}</span> in your wallet, and they will receive <span className="font-semibold text-blue-600">₹{rewards.vendorReward}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Your Invite Link</label>
              {!isEditingReferral && (
                <button
                  onClick={() => {
                    setReferralError('');
                    setIsEditingReferral(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center space-x-1 transition cursor-pointer"
                >
                  <MdEdit className="w-3.5 h-3.5" />
                  <span>Customize Code</span>
                </button>
              )}
            </div>

            {isEditingReferral ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl text-xs font-semibold border border-gray-200 select-none">
                    .../register?ref=
                  </div>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="ENTER-CUSTOM-CODE"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold tracking-wider focus:outline-none text-gray-800 focus:border-blue-500 transition-all"
                  />
                </div>
                {referralError && (
                  <p className="text-xs font-semibold text-rose-600 px-1">{referralError}</p>
                )}
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => {
                      setIsEditingReferral(false);
                      setReferralCodeInput(data?.referralCode || '');
                      setReferralError('');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    disabled={savingReferral}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReferralCode}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    disabled={savingReferral}
                  >
                    {savingReferral ? 'Saving...' : 'Save Code'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inviteLinkText}
                    onChange={(e) => {
                      setInviteLinkText(e.target.value);
                      setReferralError('');
                    }}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none text-gray-700 font-medium focus:border-blue-500 transition-all focus:bg-white"
                    placeholder="http://localhost:5173/vendor/register?ref=YOUR_CODE"
                  />
                  {inviteLinkText === data?.inviteLink ? (
                    <>
                      <button
                        onClick={handleCopy}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-semibold flex items-center space-x-2 transition cursor-pointer active:scale-95 shrink-0"
                      >
                        <MdContentCopy className="w-5 h-5" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-semibold flex items-center space-x-2 transition cursor-pointer active:scale-95 shrink-0"
                      >
                        <MdShare className="w-5 h-5" />
                        <span>Share</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setInviteLinkText(data?.inviteLink || '');
                          setReferralError('');
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-3 rounded-2xl font-semibold transition cursor-pointer active:scale-95 shrink-0"
                        disabled={savingReferral}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveInviteLinkDirect}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-semibold transition cursor-pointer active:scale-95 shrink-0"
                        disabled={savingReferral}
                      >
                        {savingReferral ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
                {referralError && (
                  <p className="text-xs font-semibold text-rose-600 px-1">{referralError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic QR Code Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <MdQrCodeScanner className="w-5 h-5 text-blue-600" />
            <span>Scan to Join as Vendor</span>
          </h4>

          {data?.inviteQrCodeDataUrl ? (
            <img
              src={data.inviteQrCodeDataUrl}
              alt="Invite QR Code"
              className="w-44 h-44 object-contain border-4 border-gray-50 p-2 rounded-2xl shadow-inner"
            />
          ) : (
            <div className="w-44 h-44 bg-gray-50 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-semibold border border-dashed border-gray-200">
              No QR Generated
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 leading-normal">
            Show this QR code to electricians, plumbers, painters, etc., to onboard them under your referral network.
          </p>
        </div>

        {/* Admin Global QR Code Card */}
        {data?.adminQrCodeUrl && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <MdQrCodeScanner className="w-5 h-5 text-emerald-600" />
              <span>Global Referral App QR</span>
            </h4>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.adminQrCodeUrl)}`}
              alt="Admin Global QR Code"
              className="w-44 h-44 object-contain border-4 border-gray-50 p-2 rounded-2xl shadow-inner"
            />

            <p className="text-xs text-gray-400 mt-4 leading-normal">
              Scan this global QR code to download the Doormeets App directly.
            </p>
          </div>
        )}
      </div>

      {/* Referred Vendors List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">My Onboarded/Referred Vendors</h3>
          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            Total: {data?.vendors?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Vendor Details</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Onboarded Date</th>
                <th className="px-6 py-4">Police Verification</th>
                <th className="px-6 py-4">Training Status</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {data?.vendors && data.vendors.length > 0 ? (
                data.vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      <div>{vendor.name}</div>
                      {vendor.referralCode && (
                        <div className="inline-block text-[10px] text-blue-600 font-extrabold bg-blue-50/50 border border-blue-100 px-1.5 py-0.5 rounded mt-1">
                          Code: {vendor.referralCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{vendor.phone}</td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {new Date(vendor.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                        vendor.policeVerification?.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        vendor.policeVerification?.status === 'submitted' ? 'bg-blue-50 text-blue-600' :
                        vendor.policeVerification?.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {vendor.policeVerification?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                        vendor.training?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        vendor.training?.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        vendor.training?.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {vendor.training?.status || 'not started'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        vendor.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        vendor.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        vendor.approvalStatus === 'suspended' ? 'bg-gray-200 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {vendor.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400 font-medium">
                    No vendors referred yet. Onboard your first vendor to start earning commissions!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
