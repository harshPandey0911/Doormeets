import React from 'react';
import { FiStar } from 'react-icons/fi';

const ReviewCard = ({ booking, onWriteReview }) => {
  // Logic to determine if card should be shown
  // Show ONLY when booking is truly completed (not just work_done) AND payment is confirmed
  const isCompleted = ['completed', 'COMPLETED'].includes(booking.status);
  const isPaid = ['success', 'paid', 'collected_by_vendor', 'paid_online'].includes(booking.paymentStatus?.toLowerCase());
  const hasRating = !!booking.rating;

  // Show if already rated, OR only if fully completed + fully paid
  if (!hasRating && (!isCompleted || !isPaid)) {
    return null;
  }


  return (
    <div className="bg-card-bg rounded-md overflow-hidden shadow-xs md:shadow-lg border border-border-color relative group mb-4 md:mb-6">
      {/* Top Accent Gradient */}
      <div className="h-1 md:h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />

      <div className="p-3.5 md:p-6">
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-md bg-brand/10 flex items-center justify-center text-brand shadow-inner border border-brand/20 shrink-0">
            <FiStar className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-lg text-dark-text leading-snug">How was your experience?</h3>
            <p className="text-secondary-text text-xs md:text-sm">Your feedback helps us improve.</p>
          </div>
        </div>

        {!hasRating ? (
          <button
            onClick={onWriteReview}
            className="w-full py-2.5 md:py-3.5 text-xs md:text-sm text-white font-bold rounded-md shadow-xs md:shadow-lg shadow-orange-200 active:scale-95 transition-all hover:brightness-105"
            style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)'
            }}
          >
            Write a Review
          </button>
        ) : (
          <div className="bg-light-bg rounded-md p-3 md:p-5 border border-border-color text-center">
            <p className="text-[10px] md:text-xs font-bold text-brand uppercase tracking-widest mb-2 md:mb-3">Your Rating</p>
            <div className="flex justify-center gap-1.5 md:gap-2 mb-3 md:mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 md:w-8 md:h-8 transition-transform hover:scale-110 ${star <= (booking.rating?.rating || booking.rating)
                    ? 'fill-brand text-brand drop-shadow-xs'
                    : 'text-muted-text'
                    }`}
                />
              ))}
            </div>
            {(booking.rating?.review || booking.review) && (
              <div className="bg-card-bg rounded-md p-2.5 md:p-4 border border-border-color shadow-xs relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 md:w-4 md:h-4 bg-card-bg border-t border-l border-border-color rotate-45 transform"></div>
                <p className="text-dark-text italic font-medium text-xs md:text-sm leading-relaxed">
                  "{booking.rating?.review || booking.review}"
                </p>
              </div>
            )}

            {/* Optional: Add Date or 'Thank You' text */}
            <div className="mt-2 md:mt-3 text-[10px] md:text-xs text-brand font-semibold">
              Thank you for your feedback!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
