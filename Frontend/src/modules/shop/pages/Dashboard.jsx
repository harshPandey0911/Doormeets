import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdAccountBalanceWallet, MdPeople, MdHourglassEmpty, MdCheckCircle, MdContentCopy, MdQrCodeScanner, MdShare } from 'react-icons/md';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.get(`${API_URL}/shop/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setData(response.data.data);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopy = () => {
    if (data?.inviteLink) {
      navigator.clipboard.writeText(data.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!data?.inviteLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Doormeets as Vendor',
          text: 'Hey, register on Doormeets using my referral link and start receiving customer bookings!',
          url: data.inviteLink
        });
      } catch (err) {
        // Share sheet cancelled or failed
        if (err.name !== 'AbortError') {
          console.error('Error sharing link:', err);
        }
      }
    } else {
      const text = `Join Doormeets as Vendor! Register using my link to get customer bookings: ${data.inviteLink}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Your Invite Link</label>
            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={data?.inviteLink || ''}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none text-gray-600 truncate"
              />
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
            </div>
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
