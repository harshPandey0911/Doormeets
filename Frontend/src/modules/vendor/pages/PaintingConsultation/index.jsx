import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ActiveConsultations from './ActiveConsultations';
import VendorQuoteWizard from './VendorQuoteWizard';
import InspectionTracker from './InspectionTracker';
import { getAvailableConsultations } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

// Statuses that should show InspectionTracker instead of directly opening the quote wizard
const TRACKING_STATUSES = ['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE', 'INSPECTION_IN_PROGRESS'];

const PaintingConsultations = () => {
  const [view, setView] = useState('list'); // 'list' | 'tracker' | 'wizard'
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
              handleGenerateQuote(matched);
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
    // If consultation is in a tracking status, show tracker first
    if (TRACKING_STATUSES.includes(consultation.status)) {
      setView('tracker');
    } else {
      setView('wizard');
    }
  };

  const handleBack = () => {
    setSelectedConsultation(null);
    setView('list');
  };

  const handleQuoteGenerated = () => {
    setSelectedConsultation(null);
    setView('list');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (view === 'tracker' && selectedConsultation) {
    return (
      <InspectionTracker
        consultation={selectedConsultation}
        onStartQuote={() => setView('wizard')}
        onSubmitDone={handleQuoteGenerated}
      />
    );
  }

  if (view === 'wizard' && selectedConsultation) {
    return (
      <VendorQuoteWizard
        consultation={selectedConsultation}
        onBack={() => {
          // If still in tracking status, go back to tracker
          if (TRACKING_STATUSES.includes(selectedConsultation.status)) {
            setView('tracker');
          } else {
            handleBack();
          }
        }}
        onComplete={handleQuoteGenerated}
      />
    );
  }

  return <ActiveConsultations onGenerateQuote={handleGenerateQuote} />;
};

export default PaintingConsultations;
