import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiArrowRight, FiGift, FiAlertCircle, FiPieChart } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { getEarningsOverview } from '../../services/earningsService';
import LogoLoader from '../../../../components/common/LogoLoader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Earnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('monthly'); // for chart: daily, weekly, monthly
  const [filter, setFilter] = useState('all'); // for history and breakdown: all, today, week, month
  
  const [earningsData, setEarningsData] = useState({
    totals: { total: 0, today: 0, week: 0, month: 0 },
    breakdown: { totalEarnings: 0, totalDeductions: 0, totalBonuses: 0 },
    chartData: [],
    history: []
  });

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

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getEarningsOverview({ period, filter });
      if (res.success) {
        setEarningsData(res.data);
      } else {
        setError(res.message || 'Failed to load earnings data');
      }
    } catch (err) {
      console.error('Fetch earnings error:', err);
      setError('An error occurred while fetching earnings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [period, filter]);

  // Format date for chart X-axis
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const parts = tickItem.split('-');
    if (period === 'daily' && parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM
    }
    if (period === 'weekly') {
      return `W${parts[1]}`;
    }
    if (period === 'monthly' && parts.length >= 2) {
      const date = new Date(parts[0], parseInt(parts[1]) - 1, 1);
      return date.toLocaleString('default', { month: 'short' });
    }
    return tickItem;
  };

  if (loading && !earningsData.chartData.length) {
    return <LogoLoader />;
  }

  const { totals, breakdown, chartData, history } = earningsData;

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Earnings Analytics" />

      <main className="px-4 py-4 space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Top Totals Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-2.5 border border-white/40 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-teal-50 rounded-lg text-teal-600">
                <FiCalendar className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Today</p>
            </div>
            <p className="text-base font-normal text-gray-900">₹{totals.today.toLocaleString()}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-2.5 border border-white/40 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-blue-50 rounded-lg text-blue-600">
                <FiTrendingUp className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">This Week</p>
            </div>
            <p className="text-base font-normal text-gray-900">₹{totals.week.toLocaleString()}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-2.5 border border-white/40 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-purple-50 rounded-lg text-purple-600">
                <FiPieChart className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">This Month</p>
            </div>
            <p className="text-base font-normal text-gray-900">₹{totals.month.toLocaleString()}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-2.5 border border-white/40 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600">
                <FaWallet className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">All Time</p>
            </div>
            <p className="text-base font-normal text-gray-900">₹{totals.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-[2rem] p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Revenue Growth</h3>
            <div className="flex bg-gray-100 rounded-xl p-0.5 shrink-0">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-[8.5px] font-bold uppercase rounded-lg transition-all ${
                    period === p ? 'bg-white text-[#00a6a6] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a6a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00a6a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#00a6a6', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#00a6a6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                 No chart data available
               </div>
            )}
          </div>
        </div>

        {/* Breakdown Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest px-1">Breakdown</h3>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-teal-600 outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-2xl p-4 flex items-center justify-between border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-green-700 opacity-70">Earnings</p>
                  <p className="text-lg font-bold text-green-700">+₹{breakdown.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <FiGift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-700 opacity-70">Bonuses</p>
                  <p className="text-lg font-bold text-amber-700">+₹{breakdown.totalBonuses.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 flex items-center justify-between border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <FiAlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-red-700 opacity-70">Deductions</p>
                  <p className="text-lg font-bold text-red-700">-₹{breakdown.totalDeductions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Recent Activity</h3>
            <button onClick={() => navigate('/vendor/wallet')} className="text-xs font-bold text-teal-600">View Wallet</button>
          </div>
          
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-white/50 rounded-2xl p-8 text-center border border-white/40">
                <p className="text-sm font-medium text-gray-500">No recent transactions found.</p>
              </div>
            ) : (
              history.slice(0, 5).map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isDeduction ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {item.isDeduction ? <FiTrendingUp className="w-4 h-4 rotate-180" /> : <FiTrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-normal text-gray-800 capitalize">{item.description || item.type.replace('_', ' ')}</p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-normal ${item.isDeduction ? 'text-red-500' : 'text-green-500'}`}>
                      {item.isDeduction ? '-' : '+'}₹{item.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Earnings;
