import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiBriefcase, FiPhone } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';
import { getWorkers, deleteWorker } from '../../services/workerService';

const WorkersList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const response = await getWorkers();
        const mapped = (response.data || response).map(w => ({
          ...w,
          id: w._id || w.id
        }));
        setWorkers(mapped || []);
      } catch (error) {
        console.error('Error loading workers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkers();
    window.addEventListener('vendorWorkersUpdated', loadWorkers);

    return () => {
      window.removeEventListener('vendorWorkersUpdated', loadWorkers);
    };
  }, []);

  const handleDelete = async (workerId) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await deleteWorker(workerId);
        setWorkers(workers.filter(w => w.id !== workerId));
        window.dispatchEvent(new Event('vendorWorkersUpdated'));
      } catch (error) {
        console.error('Error deleting worker:', error);
        alert('Failed to delete worker');
      }
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const workerStatus = (worker.status || 'OFFLINE').toUpperCase();
    const isOnline = workerStatus === 'ONLINE';
    const isOffline = workerStatus === 'OFFLINE' || workerStatus === 'ACTIVE';

    const matchesFilter = filter === 'all' ||
      (filter === 'online' && isOnline) ||
      (filter === 'offline' && isOffline);

    const matchesSearch = searchQuery === '' ||
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Workers" />

      <main className="px-3.5 py-4">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'All Workers' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Offline' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all duration-300 ${filter === option.id
                ? 'text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-100'
                }`}
              style={
                filter === option.id
                  ? { background: themeColors.button }
                  : { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }
              }
            >
              {option.label}
              {filter === option.id && (
                <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                  {filteredWorkers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-md border border-gray-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-xs md:text-sm font-normal"
            />
          </div>
        </div>

        {/* Workers List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md p-4 border border-slate-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded-md" />
                    <div className="h-3 w-20 bg-slate-100 rounded-md" />
                    <div className="flex gap-2">
                      <div className="h-5 w-14 bg-slate-100 rounded-md" />
                      <div className="h-5 w-14 bg-slate-100 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-md p-6 text-center shadow-2xs border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-700 font-bold text-sm mb-1">No workers found</p>
            <p className="text-xs text-gray-400 font-medium">
              {searchQuery ? 'Try matching a different name or phone' : 'Click the + button below to add a worker'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkers.map((worker, index) => {
              const statusRaw = (worker.status || 'OFFLINE').toUpperCase();

              let displayStatus = 'Offline';
              let statusColor = '#94A3B8'; // Grey

              if (statusRaw === 'ONLINE') {
                statusColor = '#22C55E'; // Green
                displayStatus = 'Online';
              } else if (statusRaw === 'BUSY') {
                statusColor = '#F97316'; // Orange
                displayStatus = 'Busy';
              }

              return (
                <div
                  key={worker.id || index}
                  onClick={() => navigate(`/vendor/workers/${worker.id}/edit`)}
                  className="bg-white rounded-md p-3 shadow-2xs border border-gray-100 hover:shadow-xs transition-all active:scale-[0.99] group relative"
                >
                  <div className="flex gap-3">
                    {/* Profile Photo */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs">
                        {worker.profilePhoto ? (
                          <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <FiUser className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-md border-2 border-white shadow-2xs transition-all duration-300 ${statusRaw === 'ONLINE' ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-xs md:text-sm truncate">{worker.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider"
                                style={{ color: statusColor }}
                              >
                                {displayStatus}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 font-medium text-[11px] font-mono">{worker.phone}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/vendor/workers/${worker.id}/edit`);
                            }}
                            className="p-1 rounded-md hover:bg-teal-50 text-teal-600 transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(worker.id);
                            }}
                            className="p-1 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Skills & Stats */}
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <div className="flex flex-wrap gap-1 min-w-0 max-w-[60%]">
                          {worker.skills && worker.skills.length > 0 ? (
                            worker.skills.slice(0, 2).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gray-50 text-gray-500 border border-gray-100 whitespace-nowrap"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-gray-400 font-medium italic">No skills</span>
                          )}
                          {worker.skills?.length > 2 && (
                            <span className="text-[9px] text-gray-400 font-bold">+{worker.skills.length - 2}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <div className="flex items-center gap-0.5">
                            <span className="text-amber-400 text-[10px]">⭐</span>
                            <span className="text-[10px] font-bold text-gray-800">{worker.rating || '4.5'}</span>
                          </div>
                          <div className="h-3 w-[1px] bg-gray-200" />
                          <div className="text-[9px] font-bold text-gray-600">
                            {worker.completedJobs || 0} Jobs
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => navigate('/vendor/workers/add')}
        className="fixed bottom-20 right-4 w-9 h-9 rounded-md flex items-center justify-center text-white shadow-md active:scale-95 z-50 overflow-hidden"
        style={{
          background: themeColors.button,
          boxShadow: `0 3px 10px ${themeColors.brand.teal}35`,
          border: '1.5px solid rgba(255, 255, 255, 0.3)'
        }}
        initial={{ scale: 0, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <FiPlus className="w-4 h-4 font-bold" />
      </motion.button>

      <BottomNav />
    </div>
  );
};

export default WorkersList;
