import React, { useState } from 'react';
import Step1RoomDetails from './steps/Step1RoomDetails';
import Step2SelectPaint from './steps/Step2SelectPaint';
import Step3Utilities from './steps/Step3Utilities';
import Step4Summary from './steps/Step4Summary';
import Step5Finalize from './steps/Step5Finalize';
import RoomWallMeasurements from './RoomWallMeasurements';
import AdditionalServices from './AdditionalServices';
import BrandAndUpgrades from './BrandAndUpgrades';
import QuotationSummary from './QuotationSummary';
import FinalizeBooking from './FinalizeBooking';
import BookingTypeSelector from './BookingTypeSelector';
import { requestConsultation } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const STEPS = [
  { label: 'Booking Type', icon: '⚡' },
  { label: 'Room Details', icon: '🏠' },
  { label: 'Wall Measurements', icon: '📐' },
  { label: 'Select Paint', icon: '🎨' },
  { label: 'Utilities', icon: '🔧' },
  { label: 'Add-ons', icon: '🔨' },
  { label: 'Brand', icon: '🏷️' },
  { label: 'Summary', icon: '📋' },
  { label: 'Finalize', icon: '✅' },
];

const defaultWizardData = {
  bookingType: 'INSTANT',
  scheduledSlot: { date: null, timeSlot: '' },
  projectType: 'INTERIOR',
  customAreaName: '',
  surfaceCondition: 'GOOD',
  rooms: [],
  utilities: [
    { type: 'DOORS', selected: false, enamelPainting: false, additionalService: false },
    { type: 'GRILLS', selected: false, enamelPainting: false, additionalService: false },
    { type: 'WINDOWS', selected: false, enamelPainting: false, additionalService: false },
    { type: 'PANELS', selected: false, enamelPainting: false, additionalService: false },
  ],
  additionalServices: [],
  woodEnamelServices: { woodPolish: [], enamelItems: [] },
  paintBrand: 'ASIAN_PAINTS',
  upgradeOption: 'NONE',
  estimatedTotal: 0,
  numberOfPainters: 2,
  preferredStartDate: '',
  pModeStyle: 'ASSEMBLY',
  estimatedWorkDays: 3,
  discount: 0,
  grandTotal: 0,
};

const PaintingWizard = ({ onSuccess, propertyType }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(() => {
    // Try to restore saved progress
    try {
      const saved = localStorage.getItem('paintingWizardProgress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.wizardData || defaultWizardData;
      }
    } catch (e) {}
    return defaultWizardData;
  });
  const [submitting, setSubmitting] = useState(false);

  const updateWizardData = (updates) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        propertyType: propertyType || '2BHK',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          fullAddress: 'Address on file'
        },
        wizardData
      };
      await requestConsultation(payload);
      toast.success('🎉 Quotation Generated! Vendors are being notified.');
      localStorage.removeItem('paintingWizardProgress');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate quotation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProgress = () => {
    localStorage.setItem('paintingWizardProgress', JSON.stringify({ currentStep, wizardData }));
    toast.success('Progress saved!');
  };

  const stepProps = { wizardData, updateWizardData, goNext, goBack };

  // For wall measurement, we handle room-level updates
  const handleRoomWallUpdate = (updates) => {
    if (wizardData.rooms.length > 0) {
      const updatedRooms = [...wizardData.rooms];
      updatedRooms[0] = { ...updatedRooms[0], ...updates };
      updateWizardData({ rooms: updatedRooms });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-bold text-lg">🖌️ UrbanPaint</span>
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            STEP {currentStep + 1} OF {STEPS.length}
          </span>
        </div>
        {currentStep > 0 && currentStep < STEPS.length - 1 && (
          <button
            onClick={handleSaveProgress}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            Save Progress
          </button>
        )}
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                  idx < currentStep
                    ? 'bg-orange-500 text-white'
                    : idx === currentStep
                    ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded transition-all min-w-[8px] ${idx < currentStep ? 'bg-orange-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500 font-medium">
          {STEPS[currentStep].icon} {STEPS[currentStep].label}
        </p>
      </div>

      {/* Step Content */}
      <div className="pb-28">
        {currentStep === 0 && (
          <BookingTypeSelector
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={goNext}
          />
        )}
        {currentStep === 1 && <Step1RoomDetails {...stepProps} />}
        {currentStep === 2 && (
          <RoomWallMeasurements
            room={wizardData.rooms[0] || {}}
            onUpdateRoom={handleRoomWallUpdate}
            onBack={goBack}
            onSave={goNext}
          />
        )}
        {currentStep === 3 && <Step2SelectPaint {...stepProps} />}
        {currentStep === 4 && <Step3Utilities {...stepProps} />}
        {currentStep === 5 && (
          <AdditionalServices
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onBack={goBack}
            onContinue={goNext}
          />
        )}
        {currentStep === 6 && (
          <BrandAndUpgrades
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onBack={goBack}
            onContinue={goNext}
          />
        )}
        {currentStep === 7 && (
          <QuotationSummary
            wizardData={wizardData}
            onBack={goBack}
            onContinue={goNext}
          />
        )}
        {currentStep === 8 && (
          <FinalizeBooking
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onBack={goBack}
            onSuccess={() => {
              localStorage.removeItem('paintingWizardProgress');
              if (onSuccess) onSuccess();
            }}
            propertyType={propertyType}
          />
        )}
      </div>

      {/* Bottom Dots */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === currentStep ? 'bg-orange-500 w-5' : idx < currentStep ? 'bg-orange-300 w-2' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PaintingWizard;
