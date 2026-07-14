import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = ({ title = 'How it works', steps = [] }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full px-4 mt-6 mb-8">
      {title && (
        <h2 className="text-[15.5px] md:text-[22px] font-medium md:font-extrabold tracking-tight leading-[1.2] mb-4 px-1" style={{ color: 'var(--text-primary)' }}>
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
            className="flex items-start gap-3 p-3 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)', color: '#B33A35' }}>
              {step.icon || (index + 1)}
            </div>
            <div className="flex flex-col mt-0.5 min-w-0">
              <span className="text-[11px] font-extrabold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {index + 1}. {step.title}
              </span>
              {step.description && (
                <span className="text-[9.5px] font-semibold mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
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
