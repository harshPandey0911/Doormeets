import React from 'react';
import { motion } from 'framer-motion';

const LOGO_URL = '/cleaning-expert-logo.png';

/**
 * LogoLoader Component — Doormeets branded loader
 * @param {boolean} fullScreen - If true, shows a full-screen overlay
 * @param {boolean} overlay - If true with fullScreen, uses solid background
 * @param {boolean} inline - For inline use (e.g. buttons)
 * @param {string} size - Size classes for the logo
 */
const LogoLoader = ({ fullScreen = false, overlay = false, inline = false, size = "w-20 h-20" }) => {
  const containerClasses = fullScreen
    ? overlay
      ? "fixed inset-0 flex items-center justify-center bg-white dark:bg-light-bg z-[9999]"
      : "fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-light-bg/85 backdrop-blur-sm z-[100]"
    : inline
      ? "flex items-center justify-center"
      : "flex items-center justify-center w-full min-h-[85vh] pb-20";

  return (
    <div 
      className={containerClasses}
      style={!inline ? { backgroundColor: 'var(--background)' } : {}}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{
            scale: [0.9, 1.05, 0.9],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`relative ${inline ? 'w-8 h-8' : size} flex items-center justify-center`}
        >
          <img
            src={LOGO_URL}
            alt="Doormeets"
            className="w-full h-full object-contain"
          />
          {/* Subtle ripple effect */}
          {!inline && (
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: 'rgba(255, 140, 0, 0.4)' }}
              animate={{
                scale: [1, 1.4],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.div>

        {!inline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--text-primary)',
              letterSpacing: '0.08em',
            }}
          >
            DOORMEETS
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default LogoLoader;

