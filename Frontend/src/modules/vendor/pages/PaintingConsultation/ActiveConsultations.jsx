import React, { useState, useEffect, useMemo } from 'react';
import { getAvailableConsultations, acceptConsultation, declineConsultation } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiPlus } from 'react-icons/fi';

// Modular Redesigned Components
import DashboardHeader from './components/DashboardHeader';
import DashboardStats from './components/DashboardStats';
import SearchToolbar from './components/SearchToolbar';
import ConsultationCard from './components/ConsultationCard';
import SkeletonLoader from './components/SkeletonLoader';

const ActiveConsultations = ({ onGenerateQuote }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PENDING', 'DRAFTS', 'REVIEW', 'REVISION', 'APPROVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [declinedIds, setDeclinedIds] = useState([]);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const data = await getAvailableConsultations();
      if (data.success) {
        setConsultations(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load consultations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptConsultation(id);
      toast.success('Consultation Accepted!');
      fetchConsultations(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept consultation');
    }
  };

  const handleDecline = async (id) => {
    try {
      if (declineConsultation) {
        await declineConsultation(id);
      }
      setDeclinedIds(prev => [...prev, id]);
      toast.success('Consultation Declined');
      fetchConsultations(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to decline');
    }
  };

  // Export consultations client-side CSV download
  const handleExport = () => {
    if (consultations.length === 0) {
      toast.error('No consultations to export.');
      return;
    }

    const headers = ['ID', 'Customer Name', 'Phone', 'Property Type', 'City', 'Brand', 'Status', 'Quotation Status', 'Created At'];
    const rows = consultations.map(c => [
      c._id,
      c.userId?.name || 'N/A',
      c.userId?.phone || 'N/A',
      c.propertyType || 'N/A',
      c.address?.city || 'N/A',
      c.wizardData?.paintBrand || 'N/A',
      c.status || 'N/A',
      c.quotationId?.status || 'N/A',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Doormeets_Consultations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV file download started!');
  };

  // Dynamic filter selections: unique brands
  const uniqueBrands = useMemo(() => {
    const brandsSet = new Set();
    consultations.forEach(c => {
      if (c.wizardData?.paintBrand) {
        brandsSet.add(c.wizardData.paintBrand);
      }
    });
    return Array.from(brandsSet);
  }, [consultations]);

  // Priority Queue: PENDING or REVISION_REQUESTED
  const priorityConsultations = useMemo(() => {
    return consultations.filter(c => 
      !declinedIds.includes(c._id) && (
        c.status === 'PENDING' || 
        (c.quotationId && c.quotationId.status === 'REVISION_REQUESTED')
      )
    );
  }, [consultations, declinedIds]);

  // Standard main list filtering & sorting
  const filteredAndSortedConsultations = useMemo(() => {
    let list = consultations.filter(c => !declinedIds.includes(c._id));

    // 1. Filter by status tabs
    list = list.filter(c => {
      if (filter === 'PENDING') return c.status === 'PENDING';
      if (filter === 'DRAFTS') return c.status === 'ACCEPTED_BY_VENDOR' && (!c.quotationId || c.quotationId.status === 'DRAFT');
      if (filter === 'REVIEW') return c.quotationId && (c.quotationId.status === 'SUBMITTED_TO_ADMIN' || c.quotationId.status === 'UNDER_REVIEW');
      if (filter === 'REVISION') return c.quotationId && c.quotationId.status === 'REVISION_REQUESTED';
      if (filter === 'APPROVED') return c.quotationId && ['ADMIN_APPROVED', 'SENT_TO_CUSTOMER', 'CUSTOMER_ACCEPTED', 'CONVERTED_TO_ORDER'].includes(c.quotationId.status);
      return true;
    });

    // 2. Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        (c.userId?.name || '').toLowerCase().includes(q) ||
        (c.userId?.phone || '').toLowerCase().includes(q) ||
        (c.address?.city || '').toLowerCase().includes(q) ||
        (c.address?.street || '').toLowerCase().includes(q) ||
        (c.propertyType || '').toLowerCase().includes(q) ||
        (c.wizardData?.paintBrand || '').toLowerCase().includes(q)
      );
    }

    // 3. Filter by Brand
    if (brandFilter !== 'ALL') {
      list = list.filter(c => c.wizardData?.paintBrand === brandFilter);
    }

    // 4. Sort logic
    list = [...list].sort((a, b) => {
      if (sortOption === 'NEWEST') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOption === 'OLDEST') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortOption === 'AREA_DESC') {
        const areaA = a.wizardData?.totalPaintableArea || 0;
        const areaB = b.wizardData?.totalPaintableArea || 0;
        return areaB - areaA;
      }
      if (sortOption === 'AREA_ASC') {
        const areaA = a.wizardData?.totalPaintableArea || 0;
        const areaB = b.wizardData?.totalPaintableArea || 0;
        return areaA - areaB;
      }
      return 0;
    });

    return list;
  }, [consultations, filter, searchQuery, brandFilter, sortOption, declinedIds]);

  if (loading) {
    return (
      <div className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full bg-[#FAFAFA]">
        <div className="h-20 bg-gray-150 animate-pulse rounded-3xl mb-8"></div>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full bg-[#FAFAFA] font-sans selection:bg-[#E85D3F]/15 selection:text-[#E85D3F]">
      
      {/* Header Panel */}
      <DashboardHeader 
        onRefresh={() => fetchConsultations(true)}
        onExport={handleExport}
        consultations={consultations}
        isRefreshing={refreshing}
      />

      {/* KPI Stats overview panel */}
      <DashboardStats consultations={consultations} />

      {/* Smart search & filters toolbar */}
      <SearchToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={filter}
        onFilterChange={setFilter}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        brands={uniqueBrands}
      />

      {/* Priority Queue Needs attention */}
      {priorityConsultations.length > 0 && filter === 'ALL' && searchQuery === '' && (
        <div className="mb-8 p-6 bg-amber-50/40 border border-amber-200/50 rounded-3xl animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
              Needs Immediate Attention
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">
                {priorityConsultations.length} Action Needed
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priorityConsultations.map(c => (
              <ConsultationCard 
                key={c._id}
                consultation={c}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onGenerateQuote={onGenerateQuote}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Listing section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">
            {filter === 'ALL' ? 'All Active Consultations' : `${filter} Consultations`}
            <span className="text-xs bg-gray-100 text-gray-500 ml-2 px-2 py-0.5 rounded-full font-bold normal-case">
              {filteredAndSortedConsultations.length} shown
            </span>
          </h2>
        </div>

        {filteredAndSortedConsultations.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-[#E85D3F]/5 text-[#E85D3F] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Consultations Found</h3>
            <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
              Try adjusting your search query, status tab selector, or paint brand options to locate active consults.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setBrandFilter('ALL'); setFilter('ALL'); }}
              className="mt-6 px-5 py-3 bg-[#E85D3F] hover:bg-[#E85D3F]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedConsultations.map((consultation) => (
                <ConsultationCard 
                  key={consultation._id}
                  consultation={consultation}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onGenerateQuote={onGenerateQuote}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating quick actions widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <button 
          onClick={() => fetchConsultations(true)}
          className="p-4 bg-[#E85D3F] hover:bg-[#E85D3F]/95 text-white rounded-full shadow-lg shadow-[#E85D3F]/30 hover:shadow-xl active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#E85D3F]/20"
          title="Sync Now"
        >
          <FiPlus className="w-6 h-6 rotate-45" />
        </button>
      </div>
    </div>
  );
};

export default ActiveConsultations;
