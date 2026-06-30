import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { generateQuote } from '../../services/paintingConsultationService';
import VStep1CreateSurvey from './steps/VStep1CreateSurvey';
import VStep2RoomDetails, { ADDL_SERVICES_OPTIONS } from './steps/VStep2RoomDetails';
import VStep3UtilitiesSelection from './steps/VStep3UtilitiesSelection';
import VStep5GenerateMeasurements from './steps/VStep5GenerateMeasurements';
import VStep6PaintPackage from './steps/VStep6PaintPackage';
import VStep7Finalize from './steps/VStep7Finalize';

const STEPS = [
  { label: 'Rooms', icon: '🏠' },
  { label: 'Measure', icon: '📏' },
  { label: 'Utilities', icon: '🚪' },
  { label: 'Calc', icon: '📐' },
  { label: 'Package', icon: '🎨' },
  { label: 'Bill', icon: '📄' },
];

const VendorQuoteWizard = ({ consultation, onBack, onComplete }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quoteData, setQuoteData] = useState({
    propertyType: consultation?.propertyType || '2BHK',
    scope: 'interior',
    rooms: [],
    utilities: [],
    globalServices: [],
    measurements: {},
    paintBrand: 'Asian Paints',
    paintTier: 'standard',
    paintFinish: 'Standard Emulsion',
    finalEstimate: 0,
    upgradeCost: 0,
    painters: 2,
    startDate: new Date().toISOString().split('T')[0],
    pMode: 'assembly',
    discountPct: 0,
    estDays: 1,
    grandTotal: 0,
  });

  const updateQuoteData = (updates) => {
    setQuoteData(prev => ({ ...prev, ...updates }));
  };

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => {
    if (step === 0) {
      onBack();
    } else {
      setStep(s => s - 1);
    }
  };

  const handleFinalSubmit = async (finalData) => {
    if (!consultation?._id) return;
    try {
      setSubmitting(true);
      const payload = {
        customerName: consultation?.userId?.name || 'Customer',
        customerPhone: consultation?.userId?.phone || '',
        interiorArea: finalData.measurements?.totalArea || 0,
        exteriorArea: 0,
        timeline: `${finalData.estDays} Days`,
        finishing: finalData.paintFinish,
        vendorNotes: `P-Mode: ${finalData.pMode}`,
        rooms: (finalData.rooms || []).filter(r => r.selected).map(r => {
          const breakdown = (finalData.measurements?.roomBreakdown || []).find(b => b.name === r.name) || {};
          return {
            name: r.name,
            sqft: breakdown.netArea || 0,
            paintType: finalData.paintTier,
            paintCost: breakdown.paintCost || 0,
            laborCost: breakdown.labourCost || 0,
            subtotal: breakdown.subtotal || 0,
          };
        }),
        // Map Figma utilities + global services into one array for the backend
        additionalServices: [
          ...(finalData.utilities || []).filter(u => u.selected).map(u => ({
            name: `${u.label} (${u.enamel ? 'Enamel' : 'Basic'})`,
            quantity: 1,
            cost: (u.enamel ? 120 : 0) + (u.additionalService ? 80 : 0),
          })),
          ...(finalData.rooms || []).filter(r => r.selected).flatMap(r => 
            (r.additionalServices || []).map(svc => {
              const opt = ADDL_SERVICES_OPTIONS.find(o => o.id === svc.id);
              if (!opt) return null;
              return {
                name: `${opt.label} (${r.name})`,
                unit: opt.unit,
                quantity: svc.quantity || 1,
                cost: (svc.rate || opt.rate) * (svc.quantity || 1)
              };
            })
          ).filter(Boolean),
        ],
        calculation: {
          paintCost: finalData.measurements?.totalPaint || 0,
          labourCost: finalData.measurements?.totalLabour || 0,
          additionalServicesCost: finalData.measurements?.totalGlobalAddl || 0,
          discount: finalData.grandTotal - finalData.finalEstimate,
          gst: 0, // Included in Figma grand total
          grandTotal: finalData.grandTotal,
        },
        painterDetails: {
          name: 'Certified UrbanPaint Pro',
          rating: 4.9,
          badge: 'Verified',
        },
      };

      await generateQuote(consultation._id, payload);
      toast.success('✅ Quotation generated successfully!');
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate quote. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
              <span className="text-orange-500 font-bold text-xl">←</span>
            </button>
            <div>
              <h1 className="font-black text-gray-800 text-lg">Generate Quote</h1>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <button className="text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
            Save
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between gap-1 max-w-2xl mx-auto px-2">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center group">
              <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                idx < step ? 'bg-orange-500' : idx === step ? 'bg-orange-400 scale-y-125' : 'bg-gray-200'
              }`} />
              <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-300 ${
                idx === step ? 'text-orange-600' : 'text-gray-400'
              } hidden sm:block`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {step === 0 && <VStep1CreateSurvey quoteData={quoteData} updateQuoteData={updateQuoteData} onNext={goNext} />}
        {step === 1 && <VStep2RoomDetails quoteData={quoteData} updateQuoteData={updateQuoteData} onNext={goNext} onBack={goBack} />}
        {step === 2 && <VStep3UtilitiesSelection quoteData={quoteData} updateQuoteData={updateQuoteData} onNext={goNext} onBack={goBack} />}
        {step === 3 && <VStep5GenerateMeasurements quoteData={quoteData} updateQuoteData={updateQuoteData} onNext={goNext} onBack={goBack} />}
        {step === 4 && <VStep6PaintPackage quoteData={quoteData} updateQuoteData={updateQuoteData} onNext={goNext} onBack={goBack} />}
        {step === 5 && <VStep7Finalize quoteData={quoteData} updateQuoteData={updateQuoteData} onBack={goBack} onSubmit={handleFinalSubmit} submitting={submitting} />}
      </div>
    </div>
  );
};

export default VendorQuoteWizard;
