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
    <div className="px-3 md:px-5 mb-4 w-full">
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
          768: { slidesPerView: 1, spaceBetween: 0 },
          1024: { slidesPerView: 1, spaceBetween: 0 }
        }}
        className="rounded-[20px] lg:rounded-[28px] overflow-hidden shadow-sm w-full offer-banner-swiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide 
            key={banner._id || banner.id || index}
            className="relative h-full cursor-pointer active:scale-[0.98] transition-transform duration-200 overflow-hidden"
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
                  className="hidden md:block w-full h-full object-cover"
                />
                {/* Mobile Video */}
                <video 
                  src={banner.mobileImageUrl || banner.imageUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="block md:hidden w-full h-full object-cover"
                />
              </>
            ) : (
              <>
                {/* Desktop Image */}
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="hidden md:block w-full h-full object-cover contrast-[1.02] brightness-[1.01]"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="lazy"
                />
                {/* Mobile Image */}
                <img 
                  src={banner.mobileImageUrl || banner.imageUrl} 
                  alt={banner.title} 
                  className="block md:hidden w-full h-full object-cover contrast-[1.02] brightness-[1.01]"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="lazy"
                />
              </>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style>{`
        .offer-banner-swiper {
          aspect-ratio: 2.5 / 1;
        }
        @media (min-width: 768px) {
          .offer-banner-swiper {
            aspect-ratio: 3.5 / 1;
          }
        }
        @media (min-width: 1024px) {
          .offer-banner-swiper {
            aspect-ratio: 4.2 / 1;
          }
        }
        .offer-banner-swiper .swiper-pagination-bullet-active {
          background: #2874f0 !important;
        }
        .offer-banner-swiper .swiper-pagination {
          bottom: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default OfferBannerSlider;
