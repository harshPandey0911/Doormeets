import React from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const BannerSlider = ({ banners = [], onCtaClick }) => {
  if (!banners.length) return null;

  return (
    <div className="px-4 pt-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3800, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        spaceBetween={14}
        slidesPerView={1}
        className="premium-banner-swiper"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <motion.div
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-[0_18px_60px_rgba(124,58,237,0.12)]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.accent || 'from-purple-600 to-fuchsia-500'} opacity-85`} />
              <div className="absolute inset-0 bg-black/10" />
              <img src={banner.image} alt={banner.title} className="absolute inset-0 h-full w-full object-cover mix-blend-soft-light opacity-90" />
              <div className="relative flex min-h-[150px] items-end p-4 md:min-h-[190px]">
                <div className="max-w-sm text-white">
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur">
                    Premium services
                  </span>
                  <h2 className="mt-1.5 text-lg font-black leading-tight md:text-2xl">{banner.title}</h2>
                  <p className="mt-0.5 text-xs text-white/85 md:text-sm">{banner.subtitle}</p>
                  <button
                    type="button"
                    onClick={() => onCtaClick?.(banner)}
                    className="mt-2.5 inline-flex rounded-2xl bg-white px-3.5 py-2 text-xs font-black text-purple-700 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]"
                  >
                    {banner.buttonText || 'Explore'}
                  </button>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        .premium-banner-swiper .swiper-pagination-bullet { background: rgba(255,255,255,0.55); opacity: 1; }
        .premium-banner-swiper .swiper-pagination-bullet-active { background: white; width: 22px; border-radius: 999px; }
        .premium-banner-swiper .swiper-pagination { bottom: 12px !important; }
      `}</style>
    </div>
  );
};

export default BannerSlider;
