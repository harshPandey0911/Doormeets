import React, { useState, useEffect } from 'react';
import { getConsultationOverview } from '../../services/paintingService';
import { toast } from 'react-hot-toast';

const ConsultationDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getConsultationOverview();
      if (res.success) {
        setData(res);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load consultation overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load data.</div>;

  const { stats, data: consultations } = data;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Pending</span>;
      case 'ACCEPTED_BY_VENDOR': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Accepted by Vendor</span>;
      case 'QUOTE_GENERATED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Quote Generated</span>;
      case 'QUOTE_ACCEPTED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Quote Accepted</span>;
      case 'DECLINED': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Declined</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Service Status Overview</h2>
        <p className="text-gray-500 mt-1">Live tracking of active vendor-user marketplace interactions.</p>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-between h-32">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Requests</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-orange-600">{stats.total}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">↑ +12%</span>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-between h-32">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Conversion Rate</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-orange-600">{stats.conversionRate}%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">↑ +4%</span>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-between h-32">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg. Quote Time</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-orange-600">4.2h</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">↓ -15m</span>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-orange-300 flex flex-col justify-between h-32 relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Decisions</span>
            <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">Action Required</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-orange-600">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Consultations</h3>
          <button onClick={fetchData} className="text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Vendor Assigned</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">#{c._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{c.userId?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{c.userId?.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {c.propertyType}
                    <div className="text-xs text-gray-400 font-normal">{c.address?.city || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    {c.vendorId ? (
                      <div>
                        <div className="font-semibold text-gray-800">{c.vendorId.name}</div>
                        <div className="text-xs text-gray-500">{c.vendorId.phone}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {c.quotationId?.calculation?.grandTotal ? `₹${c.quotationId.calculation.grandTotal}` : '-'}
                  </td>
                </tr>
              ))}
              {consultations.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No consultations found.
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

export default ConsultationDashboard;
