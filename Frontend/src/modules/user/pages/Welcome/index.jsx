import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { configService } from '../../../../services/configService';

import bgVideo from '../../../../assets/images/pages/Home/HomeRepairSection/welcome.mp4.mp4';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const Welcome = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [settings, setSettings] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await configService.getSettings();
        if (data?.success) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch welcome page settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const supportPhones = settings?.supportPhone
    ? settings.supportPhone.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const handlePhoneClick = (e) => {
    e.preventDefault();
    if (supportPhones.length > 1) {
      setIsPhoneModalOpen(true);
    } else if (supportPhones.length === 1) {
      window.location.href = `tel:${supportPhones[0]}`;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; }

        .welcome-root {
          position: relative;
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          overflow: hidden;
          font-family: 'Montserrat', sans-serif;
          display: flex;
          flex-direction: column;
          background: #111;
        }

        /* ---------- VIDEO / BG ---------- */
        .bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 0;
        }
        .bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.30) 0%,
            rgba(0,0,0,0.10) 40%,
            rgba(0,0,0,0.65) 75%,
            rgba(0,0,0,0.90) 100%
          );
          z-index: 1;
        }

        /* ---------- TOP NAV ---------- */
        .top-nav {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 16px 20px 0;
          gap: 10px;
        }
        .top-nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .nav-btn {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.03em;
          padding: 8px 22px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-btn:active { transform: scale(0.95); }
        .nav-btn-login {
          background: rgba(255,255,255,0.18);
          color: #fff;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.35);
        }
        .nav-btn-login:hover { background: rgba(255,255,255,0.28); }
        .nav-btn-signup {
          background: #fff;
          color: #1c1c1e;
        }
        .nav-btn-signup:hover { background: #f0f0f0; }

        /* ---------- BOTTOM CONTENT ---------- */
        .bottom-content {
          position: relative;
          z-index: 10;
          margin-top: auto;
          padding: 0 24px 48px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Logo Circle */
        .logo-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        .logo-inner {
          position: relative;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-line {
          position: absolute;
          background: #1c1c1e;
          border-radius: 4px;
        }
        .logo-line-v  { width: 3px; height: 42px; }
        .logo-line-h  { width: 42px; height: 3px; }
        .logo-line-d1 { width: 3px; height: 42px; transform: rotate(45deg); }
        .logo-line-d2 { width: 42px; height: 3px; transform: rotate(45deg); }
        .logo-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #1c1c1e;
          z-index: 2;
        }

        /* Brand Name */
        .brand-name {
          font-size: clamp(32px, 9vw, 44px);
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.06em;
          line-height: 1;
          margin-bottom: 6px;
        }

        /* Welcome text */
        .welcome-label {
          font-size: clamp(20px, 5vw, 26px);
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.12em;
          margin-bottom: 10px;
        }
        .tagline {
          font-size: clamp(12px, 3.2vw, 15px);
          font-weight: 500;
          color: rgba(255,255,255,0.78);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        /* CTA Buttons */
        .cta-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
        }
        .cta-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 16px;
          font-weight: 700;
          padding: 15px 24px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          letter-spacing: 0.02em;
          -webkit-tap-highlight-color: transparent;
        }
        .cta-btn:active { transform: scale(0.97); }
        .cta-btn-primary {
          background: #1c1c1e;
          color: #fff;
          box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }
        .cta-btn-primary:hover { background: #2c2c2e; }
        .cta-btn-secondary {
          background: rgba(255,255,255,0.12);
          color: #fff;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255,255,255,0.3);
        }
        .cta-btn-secondary:hover { background: rgba(255,255,255,0.22); }

        @media (max-width: 767px) {
          .top-nav {
            padding: 14px 14px 0;
          }
          .bottom-content {
            display: none;
          }
          .nav-btn {
            padding: 8px 16px;
            font-size: 12px;
          }
        }

        /* Safe area for notch phones */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .bottom-content {
            padding-bottom: calc(48px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className="welcome-root">

        {/* ===== BACKGROUND VIDEO ===== */}
        {/*
          STEP TO ADD VIDEO:
          1. Rename your video file to "video.mp4"
          2. Place it in: src/assets/images/video.mp4
          3. Uncomment the import at the top: import bgVideo from '../../assets/images/video.mp4';
          4. Change src below from the placeholder image to: src={bgVideo}
        */}
        <video
          ref={videoRef}
          className="bg-video"
          src={settings?.welcomeVideoUrl ? toAssetUrl(settings.welcomeVideoUrl) : bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Background image fallback removed — video is now active */}
        <div className="bg-overlay" />

        {/* ===== TOP NAV: Speaker + Login + Sign Up ===== */}
        <motion.div
          className="top-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="top-nav-left" style={{ display: 'flex', gap: '8px' }}>
            {/* Speaker icon — left */}
            <button
              onClick={toggleMute}
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>
                {isMuted ? '🔇' : '🔊'}
              </span>
            </button>

            {/* Dynamic Phone Support call button configured by super admin */}
            {supportPhones.length > 0 && (
              <button
                onClick={handlePhoneClick}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                  borderStyle: 'solid',
                  outline: 'none',
                }}
                aria-label="Call Support"
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>
                  📞
                </span>
              </button>
            )}
          </div>

          {/* Login + Signup — right */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="nav-btn nav-btn-login" onClick={() => navigate('/user/login')}>
              Login
            </button>
            <button className="nav-btn nav-btn-signup" onClick={() => navigate('/user/signup')}>
              Sign Up
            </button>
          </div>
        </motion.div>

        {/* ===== BOTTOM CONTENT ===== */}
        <div className="bottom-content">

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img
              src="/cleaning-expert-logo.png"
              alt="Doormeets"
              style={{
                width: '160px',
                height: '160px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '50%',
                padding: '12px',
              }}
            />
          </motion.div>

          {/* Welcome */}
          <motion.p
            className="welcome-label"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            WELCOME
          </motion.p>

          {/* Tagline */}
          <motion.p
            className="tagline"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Find your next space, feel at home<br />
            Where comfort meets convenience
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="cta-group"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <button className="cta-btn cta-btn-primary" onClick={() => navigate('/user/login')}>
              Login
            </button>
            <button className="cta-btn cta-btn-secondary" onClick={() => navigate('/user/signup')}>
              Sign Up
            </button>
          </motion.div>

        </div>

        {/* Support Call Selector Modal */}
        <AnimatePresence>
          {isPhoneModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhoneModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '16px'
              }}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '30px',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1c1c1e', letterSpacing: '-0.02em' }}>
                    Call Support Helpline
                  </h3>
                  <button 
                    onClick={() => setIsPhoneModalOpen(false)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {supportPhones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      onClick={() => setIsPhoneModalOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '15px',
                        transition: 'transform 0.2s',
                        border: '1px solid rgba(59, 130, 246, 0.15)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                    >
                      <span style={{ fontSize: '16px' }}>📞</span>
                      <span>Call Helpline {idx + 1} ({phone})</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default Welcome;
