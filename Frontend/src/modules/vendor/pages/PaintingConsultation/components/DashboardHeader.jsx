import React, { useState } from 'react';
import { FiRefreshCw, FiDownload, FiBell } from 'react-icons/fi';

const DashboardHeader = ({ onRefresh, onExport, consultations = [], isRefreshing = false }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Count notifications: e.g. status PENDING or REVISION_REQUESTED in quotes
  const actionRequiredCount = consultations.filter(c => 
    c.status === 'PENDING' || 
    (c.quotationId && c.quotationId.status === 'REVISION_REQUESTED')
  ).length;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#E85D3F] mb-1 block">
          Operations Portal
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Painting Consultation Dashboard
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1.5 leading-relaxed">
          Manage consultations, quotations, revisions and project approvals.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-center">
        {/* Notifications Icon Button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E85D3F]/20"
            title="Action Items"
          >
            <FiBell className="w-5 h-5" />
            {actionRequiredCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E85D3F] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {actionRequiredCount}
              </span>
            )}
          </button>
          
          {/* Notifications Tooltip / Click Dropdown */}
          {showNotifications && actionRequiredCount > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-150 rounded-2xl p-4 shadow-xl z-50 animate-fade-in">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Attention Required</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  You have {actionRequiredCount} consultation{actionRequiredCount > 1 ? 's' : ''} requiring a quote or revision.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E85D3F]/20"
        >
          <FiDownload className="w-4 h-4 text-gray-500" />
          <span>Export</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#E85D3F]/20"
        >
          <FiRefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin text-[#E85D3F]' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
