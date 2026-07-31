import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiNavigation, FiX, FiCheckCircle, FiShield, FiSettings } from 'react-icons/fi';
import { themeColors } from '../../theme';
import { toast } from 'react-hot-toast';
import flutterBridge from '../../utils/flutterBridge';

const LocationAccessModal = ({
  isOpen,
  onClose,
  onSuccess,
  onManualSearch,
  initialLocationDisabled = false,
  userType = 'user' // 'user' | 'vendor' | 'worker'
}) => {
  const [requesting, setRequesting] = useState(false);
  const [locationDisabled, setLocationDisabled] = useState(initialLocationDisabled);

  const getTheme = () => {
    switch (userType) {
      case 'vendor': return themeColors.vendor || themeColors;
      case 'worker': return themeColors.worker || themeColors;
      default: return themeColors.user || themeColors;
    }
  };

  const currentTheme = getTheme();
  const themeColor = currentTheme.button || '#00A6A6';

  const getContent = () => {
    if (locationDisabled) {
      return {
        title: "LOCATION IS OFF",
        subtitle: "Please turn on your GPS to continue using Doormeets features.",
        icon: FiSettings
      };
    }
    return {
      title: "ALLOW GPS LOCATION",
      subtitle: "Doormeets needs your location to show available services and vendors near you.",
      icon: FiNavigation
    };
  };

  const content = getContent();

  const handleRequestLocation = async () => {
    setRequesting(true);
    setLocationDisabled(false);
    try {
      const location = await flutterBridge.getCurrentLocation();
      setRequesting(false);
      toast.success("Location access granted!");
      if (onSuccess) onSuccess(location);
      if (onClose) onClose();
    } catch (error) {
      setRequesting(false);
      let errorMsg = "Failed to get location";

      // HTML5 Geolocation API error codes
      // 1: PERMISSION_DENIED
      // 2: POSITION_UNAVAILABLE (often means GPS is off)
      // 3: TIMEOUT
      if (error.code === 1) {
        errorMsg = "Location permission denied. Please allow it.";
        setLocationDisabled(true);
      } else if (error.code === 2) {
        errorMsg = "Location information is unavailable. Is your GPS on?";
        setLocationDisabled(true);
      } else if (error.code === 3) {
        errorMsg = "Request timed out. Please try again.";
      }
      toast.error(errorMsg);
    }
  };

  const handleOpenSettings = () => {
    if (flutterBridge.isFlutter) {
      flutterBridge.openAppSettings();
      onClose();
    } else {
      toast("Please open your browser settings to allow location access.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative bg-white w-full max-w-[310px] sm:max-w-[330px] rounded-2xl p-5 shadow-2xl border border-gray-100/80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Sleek Compact Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm border border-gray-100"
              style={{
                backgroundColor: locationDisabled ? '#fff7ed' : `${themeColor}12`,
                color: locationDisabled ? '#f97316' : themeColor,
                borderColor: locationDisabled ? '#ffedd5' : `${themeColor}30`
              }}
            >
              <content.icon className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-gray-900 mb-1 leading-tight">{content.title}</h3>
            <p className="text-xs text-gray-500 mb-4 leading-normal font-medium px-1">{content.subtitle}</p>

            {/* Actions */}
            <div className="w-full space-y-2">
              {locationDisabled ? (
                <button
                  onClick={handleOpenSettings}
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <FiSettings className="w-3.5 h-3.5" />
                  OPEN SETTINGS
                </button>
              ) : (
                <button
                  onClick={handleRequestLocation}
                  disabled={requesting}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: themeColor,
                    boxShadow: `0 4px 12px ${themeColor}35`
                  }}
                >
                  {requesting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      ALLOW LOCATION ACCESS
                      <FiNavigation className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}

              {onManualSearch && (
                <button
                  onClick={onManualSearch}
                  className="w-full py-1.5 text-[11px] text-gray-400 hover:text-gray-600 font-semibold transition-colors"
                >
                  Enter Location Manually
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LocationAccessModal;
