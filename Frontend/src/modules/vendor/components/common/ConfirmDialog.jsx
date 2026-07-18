import React from 'react';
import { createPortal } from 'react-dom';
import { FiAlertCircle, FiX, FiCheck, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning', // warning, danger, info, success
}) => {
  const typeConfig = {
    warning: {
      icon: <FiAlertCircle className="w-6 h-6" />,
      color: '#F59E0B',
      bg: '#FEF3C7',
    },
    danger: {
      icon: <FiAlertCircle className="w-6 h-6" />,
      color: '#EF4444',
      bg: '#FEE2E2',
    },
    info: {
      icon: <FiInfo className="w-6 h-6" />,
      color: themeColors.button,
      bg: `${themeColors.button}15`,
    },
    success: {
      icon: <FiCheck className="w-6 h-6" />,
      color: '#10B981',
      bg: '#D1FAE5',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-[300px] w-full p-5 relative z-[101] overflow-hidden"
          >
            {/* Top Shine Effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-30" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 z-[102]"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Icon Container */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 rotate-3"
              style={{
                background: config.bg,
                color: config.color,
                boxShadow: `0 6px 12px ${config.color}20`
              }}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-xs text-gray-500 leading-normal font-medium">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                className="w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition-all active:scale-[0.98]"
                style={{
                  background: type === 'danger' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : `linear-gradient(135deg, ${themeColors.button}, ${themeColors.button}dd)`,
                  boxShadow: `0 6px 12px ${type === 'danger' ? '#EF444420' : themeColors.button + '20'}`
                }}
              >
                {confirmLabel}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-semibold text-gray-400 text-xs hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmDialog;

