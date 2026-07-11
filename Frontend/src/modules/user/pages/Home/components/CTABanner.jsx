import React from 'react';
import { motion } from 'framer-motion';

const CTABanner = ({ ctaBanner, onNavigate }) => {
  if (!ctaBanner || !ctaBanner.title) return null;

  const handleBannerClick = () => {
    if (ctaBanner.targetCategoryId || ctaBanner.slug) {
      onNavigate({
        targetCategoryId: ctaBanner.targetCategoryId,
        slug: ctaBanner.slug
      });
    }
  };

  const hasBgImage = !!ctaBanner.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="px-4 py-4 w-full"
    >
      <div
        onClick={handleBannerClick}
        className="w-full min-h-[220px] md:min-h-[280px] rounded-[24px] relative overflow-hidden shadow-lg flex flex-col justify-end p-6 md:p-10 cursor-pointer group transition-all duration-300 hover:shadow-xl bg-black"
        style={
          hasBgImage
            ? {
                backgroundImage: `url(${ctaBanner.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {}
        }
      >
        {/* Black gradient overlay to ensure high readability of text on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-95" />

        {/* Dynamic Glow effects for extra depth when no image is uploaded */}
        {!hasBgImage && (
          <>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-600/30 blur-2xl rounded-full" />
          </>
        )}

        {/* Content Box */}
        <div className="relative z-20 flex flex-col items-start text-left max-w-lg md:max-w-xl">
          {/* Orange Badge */}
          <div className="bg-[#E05206] text-white text-[10.5px] md:text-[11px] font-extrabold px-3 py-1.5 rounded-[6px] tracking-wide inline-block mb-4 shadow-sm uppercase">
            Limited Offer
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-[32px] font-extrabold text-white leading-tight mb-2 tracking-tight">
            {ctaBanner.title}
          </h2>

          {/* Subtitle */}
          {ctaBanner.subtitle && (
            <p className="text-[13px] md:text-base text-gray-200/90 font-medium mb-5">
              {ctaBanner.subtitle}
            </p>
          )}

          {/* Button */}
          {ctaBanner.buttonText && (
            <button className="px-6 py-2.5 md:px-7 md:py-3 bg-white text-black text-[13px] md:text-sm font-extrabold rounded-[12px] shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              {ctaBanner.buttonText}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CTABanner;
