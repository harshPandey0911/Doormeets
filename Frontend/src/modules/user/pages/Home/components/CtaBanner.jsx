import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const CtaBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-6 max-w-7xl mx-auto w-full">
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-[#FF6B4A]/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-[#FF6B4A]/10 blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <h3 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">
            Need help choosing a service?
          </h3>
          <p className="text-xs font-medium text-slate-300 max-w-md leading-relaxed">
            Browse our verified network of trusted professionals to find the perfect match for your home needs.
          </p>
        </div>

        <button
          onClick={() => navigate('/user/categories')}
          className="relative z-10 shrink-0 self-start md:self-auto px-6 py-3.5 bg-[#FF6B4A] hover:bg-[#E05333] text-white rounded-2xl font-extrabold text-xs tracking-wider uppercase transition-all duration-300 hover:shadow-[0_8px_25px_rgba(255,107,74,0.35)] active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <span>Find Experts</span>
          <FiArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};

export default CtaBanner;
