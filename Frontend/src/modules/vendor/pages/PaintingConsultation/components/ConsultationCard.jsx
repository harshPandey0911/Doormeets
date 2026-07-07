import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiPhone, FiCopy, FiCheck, FiMoreVertical, FiMap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Relative timestamp helper
const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const ConsultationCard = ({ consultation, onAccept, onDecline, onGenerateQuote }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const customerName = consultation.userId?.name || 'Customer';
  const customerPhone = consultation.userId?.phone || 'N/A';
  const city = consultation.address?.city || 'Location Pending';
  const fullAddress = consultation.address ? 
    `${consultation.address.street || ''}, ${consultation.address.city || ''}, ${consultation.address.zipCode || ''}` : 
    'N/A';

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(customerPhone);
    setCopied(true);
    toast.success('Phone number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (c) => {
    if (c.status === 'PENDING') return 'bg-blue-50 text-blue-600 border border-blue-100';
    
    if (c.quotationId) {
      const qStatus = c.quotationId.status;
      switch (qStatus) {
        case 'DRAFT':
          return 'bg-gray-50 text-gray-600 border border-gray-200';
        case 'SUBMITTED_TO_ADMIN':
          return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'UNDER_REVIEW':
          return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'REVISION_REQUESTED':
          return 'bg-purple-50 text-purple-700 border border-purple-200 font-extrabold animate-pulse';
        case 'ADMIN_APPROVED':
          return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold';
        case 'ADMIN_REJECTED':
          return 'bg-red-50 text-red-700 border border-red-200';
        case 'SENT_TO_CUSTOMER':
          return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
        case 'CUSTOMER_ACCEPTED':
          return 'bg-green-50 text-green-700 border border-green-200';
        case 'CUSTOMER_REJECTED':
          return 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'CONVERTED_TO_ORDER':
          return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
        default:
          break;
      }
    }

    if (c.status === 'ACCEPTED_BY_VENDOR') return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (c.status === 'QUOTE_GENERATED') return 'bg-purple-50 text-purple-600 border border-purple-200';
    if (c.status === 'QUOTE_ACCEPTED') return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    return 'bg-orange-50 text-orange-600 border border-orange-200';
  };

  const getBadgeLabel = (c) => {
    if (c.status === 'PENDING') return 'New Inquiry';
    if (c.quotationId) {
      return c.quotationId.status.replace(/_/g, ' ');
    }
    return c.status.replace(/_/g, ' ');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)' }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-150 rounded-2xl overflow-visible flex flex-col h-full shadow-sm relative"
    >
      <div className="p-4 flex flex-col h-full space-y-3.5">
        {/* Header: Status and relative timestamp */}
        <div className="flex justify-between items-start">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getBadgeStyle(consultation)}`}>
            {getBadgeLabel(consultation)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5" /> 
              {relativeTime(consultation.createdAt)}
            </span>
            
            {/* Overflow menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); handleCopyPhone(e); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FiCopy className="w-4 h-4" /> Copy Phone
                    </button>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FiMap className="w-4 h-4" /> View Map
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Customer Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {customerName}
          </h3>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
            {consultation.propertyType || 'Residential'}
          </p>
        </div>

        {/* Location Info */}
        <div className="flex items-start gap-2 text-sm text-gray-600 font-semibold">
          <FiMapPin className="w-4 h-4 text-[#E85D3F] mt-0.5 flex-shrink-0" />
          <span className="leading-tight">{city}</span>
        </div>

        {/* Dynamic Property Chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold bg-gray-50 border border-gray-150 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
            Painting
          </span>
          {consultation.wizardData?.paintBrand && (
            <span className="text-[10px] font-bold bg-gray-50 border border-gray-150 text-gray-600 px-2.5 py-1 rounded-full">
              {consultation.wizardData.paintBrand.replace(/_/g, ' ')}
            </span>
          )}
          {consultation.wizardData?.rooms?.length > 0 && (
            <span className="text-[10px] font-black bg-[#E85D3F]/5 border border-[#E85D3F]/10 text-[#E85D3F] px-2.5 py-1 rounded-full">
              {consultation.wizardData.rooms.length} Room(s)
            </span>
          )}
        </div>

        {/* Detailed Client Stats Panel */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1.5 flex-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-400 uppercase">Phone</span>
            <button 
              onClick={handleCopyPhone}
              className="font-bold text-gray-800 hover:text-[#E85D3F] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FiPhone className="w-3.5 h-3.5" />
              <span>{customerPhone}</span>
              {copied ? <FiCheck className="w-3 h-3 text-emerald-500" /> : <FiCopy className="w-3 h-3 text-gray-400" />}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-400 uppercase">Property</span>
            <span className="font-bold text-gray-800">{consultation.propertyType}</span>
          </div>
        </div>


        {/* Context CTAs */}
        <div className="flex gap-2 pt-2">
          {consultation.status === 'PENDING' && (
            <>
              <button 
                onClick={() => onAccept && onAccept(consultation._id)}
                className="flex-1 bg-[#E85D3F] hover:bg-[#E85D3F]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#E85D3F]/20 active:scale-95 cursor-pointer"
              >
                Accept Request
              </button>
              <button
                onClick={() => onDecline && onDecline(consultation._id)}
                className="px-3 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                Decline
              </button>
            </>
          )}

          {consultation.status === 'ACCEPTED_BY_VENDOR' && (
            <button 
              onClick={() => onGenerateQuote && onGenerateQuote(consultation)}
              className="flex-1 bg-[#E85D3F] hover:bg-[#E85D3F]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#E85D3F]/20 active:scale-95 cursor-pointer text-center"
            >
              {consultation.quotationId?.status === 'REVISION_REQUESTED' ? 'Revise Quote' :
               consultation.quotationId?.status === 'DRAFT' ? 'Resume Draft' :
               ['SUBMITTED_TO_ADMIN', 'UNDER_REVIEW'].includes(consultation.quotationId?.status) ? 'Review Submission' :
               consultation.quotationId ? 'View Quote' : 'Generate Quote'}
            </button>
          )}

          {consultation.status === 'QUOTE_GENERATED' && (
            <button 
              disabled
              className="flex-1 bg-gray-100 text-gray-400 font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider cursor-not-allowed text-center"
            >
              Quote Sent (Waiting)
            </button>
          )}

          {consultation.status === 'QUOTE_ACCEPTED' && (
            <button 
              className="flex-1 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#10B981]/20 active:scale-95 cursor-pointer text-center"
            >
              Quote Accepted! (Start Job)
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConsultationCard;
