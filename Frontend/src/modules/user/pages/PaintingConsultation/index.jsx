import React, { useState, useEffect } from 'react';
import RoomConfiguration from './RoomConfiguration';
import QuoteApproval from './QuoteApproval';
import { getMyConsultations } from '../../services/paintingConsultationService';

const PaintingConsultation = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await getMyConsultations();
      if (data.success) {
        setConsultations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // Find consultations that need user action (quote generated)
  const pendingQuotes = consultations.filter(c => c.status === 'QUOTE_GENERATED');
  const activeConsultations = consultations.filter(c => ['PENDING', 'ACCEPTED_BY_VENDOR'].includes(c.status));
  const completedConsultations = consultations.filter(c => ['QUOTE_ACCEPTED', 'QUOTE_DECLINED', 'COMPLETED'].includes(c.status));

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] pt-16 pb-24">
      {/* Show Quote Approvals first if any vendor has sent a quote */}
      {pendingQuotes.length > 0 && (
        <div className="px-4 mb-6 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Quotes Awaiting Your Decision
          </h2>
          {pendingQuotes.map(consultation => (
            <QuoteApproval
              key={consultation._id}
              consultation={consultation}
              onActionComplete={fetchConsultations}
            />
          ))}
        </div>
      )}

      {/* Active consultations status */}
      {activeConsultations.length > 0 && (
        <div className="px-4 mb-6 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-3">Active Consultations</h2>
          <div className="space-y-3">
            {activeConsultations.map(c => (
              <div key={c._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{c.propertyType}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{c.address?.fullAddress || 'Address on file'}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  c.status === 'PENDING' 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {c.status === 'PENDING' ? '⏳ Waiting for Vendor' : '🔧 Vendor Assigned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed consultations */}
      {completedConsultations.length > 0 && (
        <div className="px-4 mb-6 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-3 text-[var(--text-secondary)]">Past Consultations</h2>
          <div className="space-y-3">
            {completedConsultations.map(c => (
              <div key={c._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between opacity-70">
                <div>
                  <p className="font-bold">{c.propertyType}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {c.vendorId?.name ? `Vendor: ${c.vendorId.name}` : 'No vendor assigned'}
                  </p>
                  {c.quotationId?.calculation?.grandTotal && (
                    <p className="text-xs text-orange-600 font-bold mt-1">₹{c.quotationId.calculation.grandTotal}</p>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  c.status === 'QUOTE_ACCEPTED' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : c.status === 'QUOTE_DECLINED'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {c.status === 'QUOTE_ACCEPTED' ? '✅ Accepted' : c.status === 'QUOTE_DECLINED' ? '❌ Declined' : '✔ Completed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room configuration — direct consultation request */}
      <RoomConfiguration onSuccess={fetchConsultations} />
    </div>
  );
};

export default PaintingConsultation;
