import React, { useState, useEffect } from 'react';
import { getMyConsultations } from '../../services/paintingConsultationService';

const CreateSurveyOverview = ({ onStartNewSurvey, onResumeDraft }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyConsultations();
        if (data.success) setConsultations(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const drafts = consultations.filter(c => c.status === 'PENDING');
  const completed = consultations.filter(c => ['QUOTE_ACCEPTED', 'COMPLETED'].includes(c.status));

  // Check for localStorage draft
  const hasSavedProgress = !!localStorage.getItem('paintingWizardProgress');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-lg">🖌️</span>
          <span className="font-bold text-orange-600 text-lg tracking-tight">UrbanPaint</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            🔍
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            🔔
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">New Estimate Survey</h1>
          <p className="text-sm text-gray-500 mt-1">Start a fresh project assessment or continue a draft.</p>
        </div>

        {/* Hero Card - Start New Survey */}
        <div
          onClick={onStartNewSurvey}
          className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden cursor-pointer group hover:border-orange-300 hover:shadow-xl transition-all mb-6"
        >
          <div className="flex flex-col md:flex-row">
            <div className="p-6 flex flex-col justify-center md:w-1/2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-orange-500 text-2xl">➕</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">Start New Survey</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Create a detailed room-by-room painting estimate, calculate materials, and generate a professional quote.
              </p>
              <button className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl w-fit hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                Begin Assessment
              </button>
            </div>
            <div className="hidden md:block md:w-1/2 h-64 bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🏠</div>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Drafts */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Active Drafts</h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
                {hasSavedProgress ? drafts.length + 1 : drafts.length}
              </span>
            </div>

            {hasSavedProgress && (
              <div
                onClick={onResumeDraft}
                className="flex items-center justify-between group cursor-pointer py-3 border-b border-gray-100"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-orange-500 transition-colors">
                    Saved Draft (Local)
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">Resume where you left off</p>
                </div>
                <span className="text-gray-300 group-hover:text-orange-500 transition-colors">→</span>
              </div>
            )}

            {drafts.length === 0 && !hasSavedProgress && (
              <p className="text-xs text-gray-400 py-4 text-center">No active drafts.</p>
            )}

            {drafts.slice(0, 3).map(d => (
              <div key={d._id} className="flex items-center justify-between group cursor-pointer py-3 border-b border-gray-50 last:border-0">
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-orange-500 transition-colors">
                    {d.propertyType} - {d.wizardData?.rooms?.[0]?.name || 'Untitled'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-orange-500 transition-colors">→</span>
              </div>
            ))}

            {(drafts.length > 0 || hasSavedProgress) && (
              <button className="text-orange-500 font-bold text-sm w-full text-center mt-4 py-2 border border-gray-200 rounded-xl hover:bg-orange-50 transition-colors">
                View All Drafts
              </button>
            )}
          </div>

          {/* Recently Completed */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recently Completed</h3>
              <span className="text-gray-400 text-sm">📜</span>
            </div>

            {completed.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No completed surveys yet.</p>
            ) : (
              <div className="space-y-4">
                {completed.slice(0, 3).map(c => (
                  <div key={c._id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400">✔</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-gray-800">
                          {c.propertyType}
                        </h4>
                        {c.quotationId?.calculation?.grandTotal && (
                          <span className="text-xs font-bold text-orange-500">
                            ₹{c.quotationId.calculation.grandTotal.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Completed: {new Date(c.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSurveyOverview;
