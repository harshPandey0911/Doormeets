import React, { useState } from 'react';
import { FiX, FiTrash, FiCamera, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import flutterBridge from '../../../../utils/flutterBridge';

const ReachedPhotoModal = ({ isOpen, onClose, onComplete, loading }) => {
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = React.useRef(null);

  const handleNativeCamera = async () => {
    try {
      setIsUploading(true);
      const file = await flutterBridge.openCamera();
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result]);
          setIsUploading(false);
          flutterBridge.hapticFeedback('success');
        };
        reader.readAsDataURL(file);
      } else {
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Native camera failed:', error);
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(uploadPromises).then(urls => {
      setPhotos(prev => [...prev, ...urls]);
      setIsUploading(false);
    });
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    flutterBridge.hapticFeedback('light');
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      toast.error('Please upload at least one photo before proceeding');
      flutterBridge.hapticFeedback('error');
      return;
    }
    onComplete(photos);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-xs sm:max-w-sm rounded-[20px] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-5 pt-5 pb-2 flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Verify Arrival</h3>
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">Safety & Checklist</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 active:scale-95"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="px-5 pb-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                {/* Safety Banner */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 flex items-start gap-2 shadow-sm">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-xs">Safety Protocol Required</h4>
                    <p className="text-[10px] font-bold text-amber-800 uppercase mt-0.5 tracking-wider">
                      Please wear gloves and mask
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 font-medium leading-normal">
                  Please upload a photo showing you at the customer's location wearing your safety gear.
                </p>

                {/* Photo Upload Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Arrival Photos <span className="text-red-500 font-bold">(Mandatory)</span></p>
                    <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                      {photos.length}/5 (Min 1)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-xl bg-gray-100 border border-gray-100 relative overflow-hidden group">
                        <img src={photo} className="w-full h-full object-cover" alt="arrival" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {photos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (flutterBridge.isFlutter) {
                            handleNativeCamera();
                          } else {
                            cameraInputRef.current?.click();
                          }
                        }}
                        className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50/30 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 cursor-pointer active:scale-95 transition-all p-1"
                      >
                        <FiCamera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-bold uppercase leading-tight text-center">Camera Only</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={cameraInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {isUploading && <p className="text-blue-500 text-[10px] font-bold mt-1.5 ml-1 animate-pulse">Uploading photos...</p>}
                </div>
              </div>

              {/* Action Buttons (Fixed at Bottom) */}
              <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={onClose}
                    className="py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || isUploading}
                    className="py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
                  >
                    {loading ? 'Confirming...' : 'Verify Arrival'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReachedPhotoModal;
