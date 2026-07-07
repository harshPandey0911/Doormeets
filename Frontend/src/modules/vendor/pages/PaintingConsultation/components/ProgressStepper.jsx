import React from 'react';
import { FiCheck } from 'react-icons/fi';

const STAGES = [
  { label: 'Request', key: 'REQUEST' },
  { label: 'Accepted', key: 'ACCEPTED' },
  { label: 'Quote', key: 'QUOTE' },
  { label: 'Review', key: 'REVIEW' },
  { label: 'Approved', key: 'APPROVED' },
  { label: 'Job Started', key: 'STARTED' }
];

const ProgressStepper = ({ status, quotationStatus }) => {
  // Determine current active stage index
  let activeIndex = 0;

  if (status === 'PENDING') {
    activeIndex = 0;
  } else if (status === 'ACCEPTED_BY_VENDOR') {
    if (!quotationStatus || quotationStatus === 'DRAFT') {
      activeIndex = 2; // In Quote Drafting stage
    } else if (['SUBMITTED_TO_ADMIN', 'UNDER_REVIEW', 'REVISION_REQUESTED'].includes(quotationStatus)) {
      activeIndex = 3; // In Review stage
    } else if (['ADMIN_APPROVED', 'SENT_TO_CUSTOMER', 'CUSTOMER_ACCEPTED'].includes(quotationStatus)) {
      activeIndex = 4; // Approved
    } else if (quotationStatus === 'CONVERTED_TO_ORDER') {
      activeIndex = 5; // Job Started
    } else {
      activeIndex = 1; // Basic Accepted by Vendor
    }
  } else if (status === 'QUOTE_GENERATED') {
    activeIndex = 3;
  } else if (status === 'QUOTE_ACCEPTED') {
    activeIndex = 4;
  } else {
    activeIndex = 1;
  }

  return (
    <div className="py-2">
      {/* Stepper Timeline Header */}
      <div className="flex items-center justify-between relative mb-2">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 -z-10"></div>
        
        {/* Fill Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#E85D3F] -z-10 transition-all duration-500 ease-out"
          style={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          
          return (
            <div key={stage.key} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-[#E85D3F] border-[#E85D3F] text-white shadow-sm'
                    : isActive 
                      ? 'bg-white border-[#E85D3F] text-[#E85D3F] scale-110 shadow-sm ring-4 ring-[#E85D3F]/10'
                      : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  idx + 1
                )}
              </div>
              <span 
                className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider hidden sm:block ${
                  isActive ? 'text-[#E85D3F]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
