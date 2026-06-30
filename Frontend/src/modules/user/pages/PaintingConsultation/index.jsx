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





      {/* Room configuration — direct consultation request */}
      <RoomConfiguration onSuccess={fetchConsultations} />
    </div>
  );
};

export default PaintingConsultation;
