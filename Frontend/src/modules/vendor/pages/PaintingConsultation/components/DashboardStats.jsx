import React from 'react';
import { FiGrid, FiFileText, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiCheckSquare } from 'react-icons/fi';

export const DashboardStatCard = ({ title, value, description, icon: Icon, colorClass, trend }) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
      <div className="flex justify-between items-center mb-2">
        <div className={`p-2 rounded-xl ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-gray-900 mt-0.5">{value}</h3>
      <p className="text-[10px] font-semibold text-gray-400 mt-1 leading-normal truncate">{description}</p>
    </div>
  );
};

const DashboardStats = ({ consultations = [] }) => {
  // Calculations
  const activeCount = consultations.length;

  const pendingQuotesCount = consultations.filter(c => 
    c.status === 'ACCEPTED_BY_VENDOR' && (!c.quotationId || c.quotationId.status === 'DRAFT')
  ).length;

  const revisionsCount = consultations.filter(c => 
    c.quotationId && c.quotationId.status === 'REVISION_REQUESTED'
  ).length;

  const approvedCount = consultations.filter(c => 
    c.quotationId && ['ADMIN_APPROVED', 'SENT_TO_CUSTOMER', 'CUSTOMER_ACCEPTED', 'CONVERTED_TO_ORDER'].includes(c.quotationId.status)
  ).length;

  const completedCount = consultations.filter(c => 
    c.quotationId && c.quotationId.status === 'CONVERTED_TO_ORDER'
  ).length;

  const totalAccepted = consultations.filter(c => c.status !== 'PENDING').length;
  const conversionRate = totalAccepted > 0 
    ? Math.round((approvedCount / totalAccepted) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <DashboardStatCard 
        title="Active Jobs"
        value={activeCount}
        description="All active assignments"
        icon={FiGrid}
        colorClass="bg-[#E85D3F]/10 text-[#E85D3F]"
        trend="Total"
      />
      <DashboardStatCard 
        title="Pending Quotes"
        value={pendingQuotesCount}
        description="Requires quotation"
        icon={FiFileText}
        colorClass="bg-blue-50 text-blue-600"
        trend="To Do"
      />
      <DashboardStatCard 
        title="Revisions"
        value={revisionsCount}
        description="Requires adjustments"
        icon={FiAlertCircle}
        colorClass="bg-purple-50 text-purple-600"
        trend={revisionsCount > 0 ? "Urgent" : "Clean"}
      />
      <DashboardStatCard 
        title="Approved"
        value={approvedCount}
        description="Verified by customer"
        icon={FiCheckCircle}
        colorClass="bg-emerald-50 text-emerald-600"
        trend="Success"
      />
      <DashboardStatCard 
        title="Completed"
        value={completedCount}
        description="Finished orders"
        icon={FiCheckSquare}
        colorClass="bg-gray-100 text-gray-600"
        trend="Done"
      />
      <DashboardStatCard 
        title="Conversion"
        value={`${conversionRate}%`}
        description="Quote approval rate"
        icon={FiTrendingUp}
        colorClass="bg-orange-50 text-orange-600"
        trend="Efficiency"
      />
    </div>
  );
};

export default DashboardStats;
