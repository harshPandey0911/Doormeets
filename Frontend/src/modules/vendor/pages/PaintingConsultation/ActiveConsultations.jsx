import React, { useState, useEffect } from 'react';
import { getAvailableConsultations, acceptConsultation, declineConsultation } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';
import { FiClock, FiMapPin } from 'react-icons/fi';

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

const ActiveConsultations = ({ onGenerateQuote }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'PENDING'

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await getAvailableConsultations();
      if (data.success) {
        setConsultations(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptConsultation(id);
      toast.success('Consultation Accepted!');
      fetchConsultations();
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
      toast.success('Consultation Declined');
      fetchConsultations();
    } catch (error) {
      console.error(error);
      toast.error('Failed to decline');
    }
  };

  const filteredConsultations = filter === 'PENDING' 
    ? consultations.filter(c => c.status === 'PENDING')
    : consultations;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:pb-8 bg-background font-body-lg">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Consultation Portal</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">Active Consultations</h2>
        </div>
        <div className="flex gap-2 bg-surface-container p-1 rounded-lg self-start">
          <button 
            className={`px-4 py-2 rounded-md font-bold text-sm shadow-sm transition-colors ${filter === 'ALL' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-orange-50'}`}
            onClick={() => setFilter('ALL')}
          >
            All Tasks
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-bold text-sm shadow-sm transition-colors ${filter === 'PENDING' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-orange-50'}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending Only
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : filteredConsultations.length === 0 ? (
        <div className="text-center text-secondary py-12">No active consultations found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {filteredConsultations.map((consultation) => (
            <div key={consultation._id} className="bg-white border border-orange-200 rounded-xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-orange-400">
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    consultation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' 
                    : consultation.status === 'ACCEPTED_BY_VENDOR' ? 'bg-blue-100 text-blue-600'
                    : consultation.status === 'QUOTE_GENERATED' ? 'bg-purple-100 text-purple-600'
                    : consultation.status === 'QUOTE_ACCEPTED' ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-orange-100 text-orange-600'
                  }`}>
                    {consultation.status === 'PENDING' ? 'New Inquiry' : consultation.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold">
                    <FiClock className="text-sm" /> 
                    {relativeTime(consultation.createdAt)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {consultation.userId?.name || 'Customer'} - {consultation.propertyType}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-2 font-semibold">
                  <FiMapPin className="text-sm text-orange-500" />
                  {consultation.address?.city || 'Location Pending'}
                </p>
                {/* Service type badge */}
                <div className="flex gap-1 mb-4 flex-wrap items-center">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                      <path d="M12 6v12M6 12h12"/>
                    </svg>
                    Painting
                  </span>
                  {consultation.wizardData?.paintBrand && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {consultation.wizardData.paintBrand.replace('_', ' ')}
                    </span>
                  )}
                  {consultation.wizardData?.rooms?.length > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                      {consultation.wizardData.rooms.length} Room(s)
                    </span>
                  )}
                </div>
                
                <div className="bg-slate-50/80 rounded-xl p-4 mb-6 border border-slate-100 flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                    <p className="text-sm font-bold text-slate-800">{consultation.userId?.phone || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Property</p>
                    <p className="text-sm font-bold text-slate-800">{consultation.propertyType}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  {consultation.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleAccept(consultation._id)}
                        className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform hover:bg-orange-600 shadow-md"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleDecline(consultation._id)}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {consultation.status === 'ACCEPTED_BY_VENDOR' && (
                    <button 
                      onClick={() => onGenerateQuote && onGenerateQuote(consultation)}
                      className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform hover:bg-orange-600 shadow-md"
                    >
                      Generate Quote
                    </button>
                  )}
                  {consultation.status === 'QUOTE_GENERATED' && (
                    <button 
                       disabled
                       className="flex-1 bg-gray-200 text-gray-500 font-bold py-3 rounded-lg"
                    >
                      Quote Sent (Waiting)
                    </button>
                  )}
                  {consultation.status === 'QUOTE_ACCEPTED' && (
                     <button 
                        className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-600"
                     >
                       Quote Accepted! (Start Job)
                     </button>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default ActiveConsultations;
