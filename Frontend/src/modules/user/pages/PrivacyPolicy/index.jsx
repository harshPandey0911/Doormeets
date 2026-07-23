import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiInfo } from 'react-icons/fi';
import { configService } from '../../../../services/configService';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [privacyText, setPrivacyText] = useState('Loading Privacy Policy...');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await configService.getSettings();
        if (res.success && res.settings?.privacyPolicy) {
          setPrivacyText(res.settings.privacyPolicy);
        } else {
          setPrivacyText('Your data security and privacy is our top priority. We only collect essential name, address and phone data to match you with verified service partners. We never sell or share your personal details with third-party advertising companies.');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setPrivacyText('Your data security and privacy is our top priority. We only collect essential name, address and phone data to match you with verified service partners. We never sell or share your personal details with third-party advertising companies.');
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
          <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Privacy & Data</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Dynamic Privacy Content */}
        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Policy Details</h3>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap" 
            style={{ color: 'var(--text-secondary)' }}
          >
            {privacyText}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
