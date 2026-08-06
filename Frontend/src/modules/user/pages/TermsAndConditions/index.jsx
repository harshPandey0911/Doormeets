import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiFileText } from 'react-icons/fi';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [termsText, setTermsText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTermsPolicy = async () => {
      try {
        const res = await api.get('/public/config');
        if (res.data?.success && res.data?.settings?.termsAndConditions) {
          setTermsText(res.data.settings.termsAndConditions);
        } else {
          setTermsText('Terms and Conditions details will be available soon.');
        }
      } catch (err) {
        console.error('Error fetching terms & conditions:', err);
        setTermsText('Failed to load Terms and Conditions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-['Montserrat']">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Terms & Conditions</h1>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#B33A35]/10 text-[#B33A35] flex items-center justify-center">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Doormeets Terms & Conditions</h2>
              <p className="text-xs text-gray-500">Legal agreement and usage terms</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <LogoLoader fullScreen={false} inline={true} size="w-8 h-8" />
            </div>
          ) : (
            <div className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {termsText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
