import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { configService } from '../../../services/configService';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [termsText, setTermsText] = useState('Loading Terms & Conditions...');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await configService.getSettings();
        if (res.success && res.settings?.termsAndConditions) {
          setTermsText(res.settings.termsAndConditions);
        } else {
          setTermsText('Terms and Conditions details will be available soon.');
        }
      } catch (error) {
        console.error('Failed to fetch terms settings:', error);
        setTermsText('Terms and Conditions details will be available soon.');
      }
    };
    fetchSettings();
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b shadow-sm" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Terms & Conditions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Dynamic Terms Content */}
        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiFileText className="w-4 h-4 text-[#B33A35]" /> Policy & Agreement Terms
          </h3>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap" 
            style={{ color: 'var(--text-secondary)' }}
          >
            {termsText}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
