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
          navigate('/user/painting');
        } else {
          navigate(`/user/category/${cleanLink}`);
        }
      }
    }
  };

  return (
    <div className="px-5 mb-5 w-full">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        autoplay={{
          delay: 3500,
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
        className="rounded-[28px] overflow-hidden shadow-md lg:rounded-[36px] w-full aspect-[16/9] md:aspect-[3.2/1] lg:aspect-[3.6/1] border border-border/40"
      >
        {banners.map((banner, index) => (
          <SwiperSlide 
            key={banner.id || banner._id || index}
            className="relative w-full h-full cursor-pointer overflow-hidden group"
            onClick={() => handleBannerClick(banner)}
          >
            {banner.mediaType === 'video' ? (
              <>
                {/* Desktop Video */}
                <video 
                  src={banner.imageUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="hidden md:block w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                {/* Mobile Video */}
                <video 
                  src={banner.mobileImageUrl || banner.imageUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="block md:hidden w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
              </>
            ) : (
              <>
                {/* Desktop Image */}
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="hidden md:block w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  loading="lazy"
                />
                {/* Mobile Image */}
                <img 
                  src={banner.mobileImageUrl || banner.imageUrl} 
                  alt={banner.title} 
                  className="block md:hidden w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  loading="lazy"
                />
              </>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style>{`
        .swiper-pagination-bullet-active {
          background: #FF6B4A !important;
        }
        .swiper-pagination {
          bottom: 15px !important;
        }
      `}</style>
    </div>
  );
};

export default OfferBannerSlider;
