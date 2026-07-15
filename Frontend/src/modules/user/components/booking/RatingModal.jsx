import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiX, FiMessageSquare, FiArrowRight } from 'react-icons/fi';

const RatingModal = ({ isOpen, onClose, onSubmit, bookingName }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, review });
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>Rate your experience</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>How was the {bookingName} service?</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                disabled={isSubmitting}
                style={{ color: 'var(--text-muted)' }}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Stars Card */}
              <div className="rounded-2xl p-6 text-center border shadow-inner" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Tap to rate</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className="w-8 h-8 transition-colors duration-200"
                        style={{
                          fill: star <= (hover || rating) ? '#F59E0B' : 'none',
                          color: star <= (hover || rating) ? '#F59E0B' : 'var(--text-muted)'
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
                {rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xs font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {rating === 5 ? 'Excellent! 🌟' :
                      rating === 4 ? 'Good! 👍' :
                        rating === 3 ? 'Average OK' :
                          rating === 2 ? 'Disappointed' : 'Needs Improvement'}
                  </motion.p>
                )}
              </div>

              {/* Review Textarea */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  <FiMessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>Share your feedback</span>
                </div>
                <div className="relative group">
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Tell us what you liked or what could be better..."
                    className="w-full border rounded-2xl p-4 text-xs min-h-[100px] transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    style={{ 
                      backgroundColor: 'var(--background)', 
                      borderColor: 'var(--border)', 
                      color: 'var(--text-primary)' 
                    }}
                    disabled={isSubmitting}
                  />
                  <div className="absolute bottom-3 right-3 text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {review.length} characters
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                style={{ 
                  backgroundColor: rating > 0 ? 'var(--primary)' : 'var(--border)',
                  color: rating > 0 ? '#FFFFFF' : 'var(--text-muted)'
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <>
                    <span>Submit Review</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RatingModal;
