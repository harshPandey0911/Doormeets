import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import welcomePage from '../../../../assets/images/pages/welcomePage.png';
import welcomePage2 from '../../../../assets/images/pages/welcomePage2.png';

const slides = [
  {
    id: 1,
    image: welcomePage2,
    title: "Multiple services in one app",
    description: "Get it all done in one place! Our home service app offers multiple services for your convenience, from plumbing to cleaning, all under one roof.",
    bgColor: "#FFF3F0", // Soft red-orange matching welcomePage2 image background
    textColor: "#FF6B4A" // Accent red-orange for skip button
  },
  {
    id: 2,
    image: welcomePage,
    title: "Professional & Trusted Experts",
    description: "Certified professionals at your service. Your safety and satisfaction are our top priorities for every single job.",
    bgColor: "#FFEBE5", // Soft theme-matching background
    textColor: "#FF6B4A"
  }
];

const Welcome = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Eagerly preload onboarding images to prevent lag
  React.useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate('/user/login');
    }
  };

  const handleSkip = () => {
    navigate('/user/login');
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left -> Next
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      // Swiped right -> Prev
      if (currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const currentSlide = slides[currentIndex];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        
        .onboarding-root {
          position: relative;
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          overflow: hidden;
          font-family: 'Montserrat', sans-serif;
          display: flex;
          flex-direction: column;
          transition: background-color 0.5s ease;
          user-select: none;
        }

        .slide-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding-top: 90px;
        }

        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 60vh;
        }

        .skip-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: transparent;
          border: none;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          z-index: 50;
          transition: opacity 0.2s;
        }

        .skip-btn:active {
          opacity: 0.6;
        }

        .bottom-card {
          background-color: #FFFFFF;
          border-top-left-radius: 0px;
          border-top-right-radius: 0px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
          z-index: 10;
        }

        .bottom-card-title {
          color: #1C1C1E;
          font-size: clamp(16px, 4.8vw, 20px);
          font-weight: 600;
          line-height: 1.3;
          margin: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          text-align: center;
        }

        .bottom-card-desc {
          color: #5A5D75;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          margin: 0;
          min-height: 70px;
        }

        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
        }

        .pagination-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dot-wrapper {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .dot-active {
          background-color: #FF6B4A;
          width: 10px;
          height: 10px;
        }

        .dot-ring {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #FF6B4A;
          box-sizing: border-box;
        }

        .next-btn {
          width: 56px;
          height: 48px;
          border-radius: 14px;
          background-color: #FF6B4A;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #FFFFFF;
          font-size: 18px;
          transition: transform 0.2s, background-color 0.2s;
          box-shadow: 0 4px 14px rgba(255, 107, 74, 0.3);
        }

        .next-btn:active {
          transform: scale(0.95);
          background-color: #E05333;
        }

        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .bottom-card {
            padding-bottom: calc(40px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className="onboarding-root" style={{ backgroundColor: currentSlide.bgColor }}>
        {/* Skip button at top right */}
        <button 
          className="skip-btn" 
          onClick={handleSkip} 
          style={{ color: currentSlide.textColor }}
        >
          Skip
        </button>

        {/* Swipeable images area */}
        <div className="slide-container">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={handleDragEnd}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                cursor: 'grab'
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="slide-image"
                draggable="false"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom text & action area */}
        <div className="bottom-card">
          <motion.h2 
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bottom-card-title"
          >
            {currentSlide.title}
          </motion.h2>

          <motion.p 
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bottom-card-desc"
          >
            {currentSlide.description}
          </motion.p>

          <div className="controls-row">
            {/* Pagination Indicators */}
            <div className="pagination-dots">
              {slides.map((slide, idx) => (
                <div key={slide.id} className="dot-wrapper">
                  {currentIndex === idx && (
                    <motion.div 
                      layoutId="activeRing" 
                      className="dot-ring"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`dot ${currentIndex === idx ? 'dot-active' : ''}`} />
                </div>
              ))}
            </div>

            {/* Next Button */}
            <button className="next-btn" onClick={handleNext}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Welcome;
