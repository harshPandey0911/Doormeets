import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiUser, FiBriefcase, FiCalendar, FiMessageSquare, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import bookingService from '../../../../services/bookingService';

const MyRating = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchRatings = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await bookingService.getRatings({ page, limit: 10 });
      if (response.success) {
        setRatings(page === 1 ? response.data : [...ratings, ...response.data]);
        setPagination(response.pagination);
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
    <div className="min-h-screen bg-light-bg pb-24">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-xl border-b border-border-color sticky top-0 z-30 w-full">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-orange-50/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-text" />
            </button>
            <h1 className="text-xl font-bold text-dark-text tracking-tight">My Reviews</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isLoading && pagination.page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="w-10 h-10 text-[#B33A35] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Fetching your reviews...</p>
          </div>
        ) : ratings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ratings.map((rating, idx) => (
              <div
                key={rating._id || idx}
                className="bg-card-bg rounded-3xl p-5 shadow-sm border border-border-color space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center overflow-hidden border border-orange-500/20">
                      {rating.vendorId?.profilePhoto ? (
                        <img src={rating.vendorId.profilePhoto} alt={rating.vendorId.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-6 h-6 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-dark-text tracking-tight">{rating.vendorId?.businessName || rating.vendorId?.name || 'Service Provider'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar
                              key={s}
                              className={`w-3 h-3 ${s <= rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200/40'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-secondary-text uppercase">{formatDate(rating.reviewedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <span className="text-[10px] font-bold text-[#B33A35] uppercase">{rating.serviceName || rating.serviceId?.title}</span>
                  </div>
                </div>

                {rating.review && (
                  <p className="text-secondary-text text-sm leading-relaxed font-medium pl-2 border-l-4 border-[#B33A35]/20">
                    "{rating.review}"
                  </p>
                )}

                {rating.reviewImages && rating.reviewImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {rating.reviewImages.map((img, i) => (
                      <img key={i} src={img} className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-border-color" alt="Review" />
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-border-color flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="w-3 h-3 text-secondary-text" />
                    <span className="text-[10px] font-bold text-secondary-text">Booking #{rating.bookingNumber}</span>
                  </div>
                  <button
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
                className="w-full py-4 bg-card-bg rounded-2xl border-2 border-border-color text-secondary-text font-bold flex items-center justify-center gap-2 hover:bg-gray-800/10 transition-colors cursor-pointer"
              >
                {isLoading ? <FiLoader className="animate-spin" /> : 'Load More Reviews'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card-bg rounded-[32px] p-8 text-center shadow-md border border-dashed border-border-color py-16">
            <div className="w-20 h-20 rounded-full bg-card-bg border border-border-color flex items-center justify-center mb-6 mx-auto">
              <FiStar className="w-12 h-12 text-secondary-text" />
            </div>
            <h3 className="text-lg font-bold text-dark-text mb-2">No Reviews Yet</h3>
            <p className="text-secondary-text text-sm font-medium">
              You haven't reviewed any services yet. After completing a booking, you can rate your experience!
            </p>
            <button
              onClick={() => navigate('/user/bookings')}
              className="mt-6 px-8 py-3 bg-[#B33A35] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-950/20 active:scale-95 transition-all cursor-pointer"
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
