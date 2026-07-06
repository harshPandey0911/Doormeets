import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ActiveConsultations from './ActiveConsultations';
import VendorQuoteWizard from './VendorQuoteWizard';
import { getAvailableConsultations } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const PaintingConsultations = () => {
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const consultationId = params.get('consultationId');
    if (consultationId) {
      const fetchAndSelect = async () => {
        try {
          setLoading(true);
          const res = await getAvailableConsultations();
          if (res.success && res.data) {
            const matched = res.data.find(c => 
              c._id === consultationId || 
              c.quotationId === consultationId || 
              (c.quotationId?._id && c.quotationId._id === consultationId)
            );
            if (matched) {
              setSelectedConsultation(matched);
            } else {
              toast.error('Consultation not found or not assigned to you.');
            }
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to load consultation details.');
        } finally {
          setLoading(false);
        }
      };
      fetchAndSelect();
    }
  }, [location.search]);

  const handleGenerateQuote = (consultation) => {
    setSelectedConsultation(consultation);
  };

  const handleQuoteGenerated = () => {
    setSelectedConsultation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (selectedConsultation) {
    return (
      <VendorQuoteWizard
        consultation={selectedConsultation}
        onBack={() => setSelectedConsultation(null)}
        onComplete={handleQuoteGenerated}
      />
    );
  }

  return <ActiveConsultations onGenerateQuote={handleGenerateQuote} />;
};

export default PaintingConsultations;
