import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiUser, FiBriefcase, FiCalendar, FiMessageSquare, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import bookingService from '../../../../services/bookingService';
import { apiCache } from '../../../../utils/apiCache';

const RATINGS_CACHE_KEY = 'user:ratings:page1';

const MyRating = () => {
  const navigate = useNavigate();

  // Initialize from cache instantly — no spinner on revisit
  const [ratings, setRatings] = useState(() => {
    const cached = apiCache.getStale(RATINGS_CACHE_KEY);
    return cached?.data || [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = apiCache.getStale(RATINGS_CACHE_KEY);
    return !cached?.data?.length;
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchRatings = async (page = 1) => {
    try {
      if (page === 1) {
        // SWR: show stale instantly, refresh in background if expired
        const stale = apiCache.getStale(RATINGS_CACHE_KEY);
        if (stale) {
          setRatings(stale.data || []);
          if (stale.pagination) setPagination(stale.pagination);
          if (!apiCache.isExpired(RATINGS_CACHE_KEY)) {
            setIsLoading(false);
            return; // Cache still valid, skip fetch
          }
          // Expired — silent background refresh
          setIsLoading(false);
          const res = await bookingService.getRatings({ page, limit: 10 });
          if (res.success) {
            setRatings(res.data);
            setPagination(res.pagination);
            apiCache.set(RATINGS_CACHE_KEY, res, 60);
          }
          return;
        }
      }
      setIsLoading(true);
      const response = await bookingService.getRatings({ page, limit: 10 });
      if (response.success) {
        const newRatings = page === 1 ? response.data : [...ratings, ...response.data];
        setRatings(newRatings);
        setPagination(response.pagination);
        if (page === 1) apiCache.set(RATINGS_CACHE_KEY, response, 60);
      } else {
        toast.error(response.message || 'Failed to fetch ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl w-full" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 pt-3.5 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>My Reviews</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {isLoading && pagination.page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="w-10 h-10 text-[#B33A35] animate-spin mb-4" />
            <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Fetching your reviews...</p>
          </div>
        ) : ratings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {ratings.map((rating, idx) => (
              <div
                key={rating._id || idx}
                className="rounded-xl p-3.5 shadow-xs border space-y-2.5 hover:shadow-md transition-all"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-orange-500/20">
                      {rating.vendorId?.profilePhoto ? (
                        <img src={rating.vendorId.profilePhoto} alt={rating.vendorId.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>{rating.vendorId?.businessName || rating.vendorId?.name || 'Service Provider'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar
                              key={s}
                              className={`w-3 h-3 ${s <= rating.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-400/30'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase truncate" style={{ color: 'var(--text-muted)' }}>{formatDate(rating.reviewedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20 max-w-[140px] shrink-0">
                    <span className="text-[9.5px] font-bold text-[#B33A35] uppercase tracking-wider block truncate">{rating.serviceName || rating.serviceId?.title}</span>
                  </div>
                </div>

                {rating.review && (
                  <p className="text-xs sm:text-xs leading-relaxed font-medium pl-2.5 border-l-3 border-[#B33A35]/30 italic" style={{ color: 'var(--text-secondary)' }}>
                    "{rating.review}"
                  </p>
                )}

                {rating.reviewImages && rating.reviewImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {rating.reviewImages.map((img, i) => (
                      <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover shrink-0 border" style={{ borderColor: 'var(--border)' }} alt="Review" />
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5">
                    <FiBriefcase className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Booking #{rating.bookingNumber || rating.bookingId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/user/booking/${rating._id}`)}
                    className="text-[11px] font-bold text-[#B33A35] hover:underline cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {/* Load More */}
            {pagination.total > ratings.length && (
              <button
                onClick={() => fetchRatings(pagination.page + 1)}
                className="w-full py-3.5 bg-card-bg rounded-md border border-border-color text-secondary-text font-bold flex items-center justify-center gap-2 hover:bg-gray-800/10 transition-colors cursor-pointer"
              >
                {isLoading ? <FiLoader className="animate-spin" /> : 'Load More Reviews'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card-bg rounded-md p-6 sm:p-8 text-center shadow-md border border-dashed border-border-color py-12 sm:py-16">
            <div className="w-16 h-16 rounded-full bg-card-bg border border-border-color flex items-center justify-center mb-4 mx-auto">
              <FiStar className="w-10 h-10 text-secondary-text" />
            </div>
            <h3 className="text-lg font-bold text-dark-text mb-2">No Reviews Yet</h3>
            <p className="text-secondary-text text-xs sm:text-sm font-medium max-w-sm mx-auto">
              You haven't reviewed any services yet. After completing a booking, you can rate your experience!
            </p>
            <button
              onClick={() => navigate('/user/my-bookings')}
              className="mt-5 px-6 py-2.5 bg-[#B33A35] text-white rounded-md font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Go to My Bookings
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRating;
