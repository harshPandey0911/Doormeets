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
        if (cleanLink === 'painting' || cleanLink.toLowerCase() === 'painting') {
          navigate('/user/painting-consultation');
        } else {
          navigate(`/user/category/${cleanLink}`);
        }
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
        breakpoints={{
          1024: {
            slidesPerView: 1,
            spaceBetween: 0,
          }
        }}
        className="rounded-[24px] overflow-hidden shadow-sm lg:rounded-[32px] w-full aspect-[21/9] md:aspect-[3/1] lg:aspect-[3.2/1]"
      >
        {banners.map((banner) => (
          <SwiperSlide 
            key={banner._id}
            className="relative w-full h-full cursor-pointer active:scale-[0.98] transition-transform duration-200 overflow-hidden"
            onClick={() => handleBannerClick(banner)}
          >
            {banner.mediaType === 'video' ? (
              <video 
                src={banner.imageUrl} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="scale-[1.22] translate-y-[2px]"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img 
                src={banner.imageUrl} 
                alt={banner.title} 
                className="scale-[1.22] translate-y-[2px]"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            )}
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
