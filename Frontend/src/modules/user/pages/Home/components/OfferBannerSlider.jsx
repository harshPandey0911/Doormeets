import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';

const OfferBannerSlider = ({ banners }) => {
  const navigate = useNavigate();

  if (!banners || banners.length === 0) return null;

  const handleBannerClick = (banner) => {
    if (banner.link) {
      const cleanLink = banner.link.trim();
      if (cleanLink.startsWith('http')) {
        window.open(cleanLink, '_blank');
      } else if (cleanLink.startsWith('/')) {
        navigate(cleanLink);
      } else if (cleanLink.startsWith('user/')) {
        navigate('/' + cleanLink);
      } else if (cleanLink.includes('/')) {
        navigate('/' + cleanLink);
      } else {
        // It's a simple category/service slug, route to category page
        navigate(`/user/category/${cleanLink}`);
      }
    }
  };

  return (
    <div className="px-5 mb-4 w-full">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={12}
        slidesPerView={1}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className="rounded-[24px] overflow-hidden shadow-sm lg:rounded-[32px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div 
              className="relative aspect-[21/9] md:aspect-[3/1] lg:aspect-[4/1] cursor-pointer active:scale-[0.98] transition-transform duration-200 overflow-hidden rounded-[24px]"
              onClick={() => handleBannerClick(banner)}
            >
              {banner.mediaType === 'video' ? (
                <video 
                  src={banner.imageUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover scale-[1.08] translate-y-[2px]"
                />
              ) : (
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover scale-[1.08] translate-y-[2px]"
                  loading="lazy"
                />
              )}
              {/* Optional: Add a subtle overlay or text if needed */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style>{`
        .swiper-pagination-bullet-active {
          background: #2874f0 !important;
        }
        .swiper-pagination {
          bottom: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default OfferBannerSlider;
