import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = ({ title = 'How it works', steps = [] }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full px-4 mt-6 mb-8">
      {title && (
        <h2 className="text-[15.5px] md:text-[22px] font-medium md:font-extrabold tracking-tight leading-[1.2] text-[#1A1A1A] dark:text-white mb-4 px-1">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id || index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 text-lg">
              {step.icon || (index + 1)}
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-[11px] font-extrabold text-gray-800 tracking-tight">
                {index + 1}. {step.title}
              </span>
              {step.description && (
                <span className="text-[9.5px] font-semibold text-gray-500 mt-0.5 leading-snug">
                  {step.description}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksSection;
