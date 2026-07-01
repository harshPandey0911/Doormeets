import React, { useState } from 'react';
import ActiveConsultations from './ActiveConsultations';
import VendorQuoteWizard from './VendorQuoteWizard';

const PaintingConsultations = () => {
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const handleGenerateQuote = (consultation) => {
    setSelectedConsultation(consultation);
  };

  const handleQuoteGenerated = () => {
    setSelectedConsultation(null);
  };

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
