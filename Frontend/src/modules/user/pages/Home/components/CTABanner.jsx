import React from 'react';
import { motion } from 'framer-motion';

const CTABanner = ({ ctaBanner, onNavigate }) => {
  if (!ctaBanner || !ctaBanner.title) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="px-4 py-4"
    >
      <div
        className="w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6"
        onClick={() => {
          if (ctaBanner.targetCategoryId || ctaBanner.slug) {
            onNavigate({
              targetCategoryId: ctaBanner.targetCategoryId,
              slug: ctaBanner.slug
            });
          }
        }}
      >
        {/* Glow effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 blur-2xl rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 blur-xl rounded-full" />

        <div className="relative z-10 flex-1 w-full text-left">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase mb-1.5 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-white/50 block"></span>
            Limited Offer
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">
            {ctaBanner.title}
          </h2>
          {ctaBanner.subtitle && (
            <p className="text-sm font-medium text-white/70">
              {ctaBanner.subtitle}
            </p>
          )}
        </div>

        {ctaBanner.buttonText && (
          <div className="relative z-10 shrink-0 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 bg-white text-black text-sm font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all">
              {ctaBanner.buttonText}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CTABanner;
