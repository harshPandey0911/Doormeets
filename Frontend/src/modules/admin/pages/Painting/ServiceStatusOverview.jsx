import React, { useState, useEffect } from 'react';

// Mock data for admin dashboard - in production, fetch from API
const ServiceStatusOverview = () => {
  const [stats, setStats] = useState({
    totalConsultations: 148,
    pendingDecisions: 12,
    activeProjects: 34,
    completedThisMonth: 67,
    avgQuoteTime: '2.4h',
    totalRevenue: 847500,
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'NEW', customer: 'Anil Sharma', property: '3BHK', city: 'Mumbai', time: '15m ago', amount: null },
    { id: 2, type: 'ACCEPTED', customer: 'Priya Patel', property: '2BHK', city: 'Delhi', time: '1h ago', amount: 24500 },
    { id: 3, type: 'COMPLETED', customer: 'Raj Mehta', property: 'Villa', city: 'Bangalore', time: '2h ago', amount: 68000 },
    { id: 4, type: 'QUOTE_SENT', customer: 'Sneha Reddy', property: '1BHK', city: 'Hyderabad', time: '3h ago', amount: 12800 },
    { id: 5, type: 'DECLINED', customer: 'Vikram Singh', property: '2BHK', city: 'Pune', time: '4h ago', amount: 18500 },
  ]);

  const statCards = [
    {
      label: 'Total Consultations',
      value: stats.totalConsultations,
      trend: '+12%',
      trendUp: true,
      icon: '📋',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Pending Decisions',
      value: stats.pendingDecisions,
      trend: null,
      trendUp: false,
      icon: '⏳',
      color: 'bg-amber-50 border-amber-200',
      actionRequired: true,
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      trend: '+4%',
      trendUp: true,
      icon: '🔨',
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Avg. Quote Time',
      value: stats.avgQuoteTime,
      trend: '-8%',
      trendUp: true,
      icon: '⏱️',
      color: 'bg-purple-50 border-purple-200',
    },
  ];

  const statusColors = {
    NEW: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    QUOTE_SENT: 'bg-purple-100 text-purple-700',
    DECLINED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Admin Dashboard</span>
              <h1 className="text-2xl font-black text-gray-900 mt-1">Painting Service Overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Last updated: Just now</span>
              <button className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-orange-600 transition-colors">
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className={`${card.color} border-2 rounded-2xl p-5 relative overflow-hidden`}>
              {card.actionRequired && (
                <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Action Required
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{card.icon}</span>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{card.label}</p>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
                {card.trend && (
                  <span className={`text-xs font-bold mb-1 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? '↑' : '↓'} {card.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Total Revenue This Month</p>
            <p className="text-4xl font-black mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-60 mt-1">{stats.completedThisMonth} completed jobs</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">Month-over-month</p>
            <p className="text-2xl font-bold text-green-400 mt-1">↑ 18%</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent Activity</h3>
            <button className="text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              View All →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map(item => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                    {item.type.replace('_', ' ')}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.customer}</p>
                    <p className="text-xs text-gray-400">{item.property} • {item.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  {item.amount && (
                    <p className="font-bold text-sm text-gray-800">₹{item.amount.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusOverview;
