import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiArrowLeft, FiUser, FiCalendar, FiMessageSquare, FiFilter, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { getRatings } from '../../services/bookingService';
import Header from '../../components/layout/Header';

const MyRatings = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchRatings = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getRatings({ page, limit: 10 });
      if (response.success) {
        setRatings(response.data);
        setStats(response.stats);
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

  const RatingBar = ({ star, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 w-8">
          <span className="text-xs font-bold text-gray-600">{star}</span>
          <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        </div>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-400 w-8 text-right">{count}</span>
      </div>
    );
  };

  if (isLoading && pagination.page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Ratings" />

      <main className="px-3.5 py-4 space-y-4">
        {/* Overall Rating Stats */}
        {stats && (
          <div className="bg-white rounded-md p-3.5 shadow-2xs border border-gray-100">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 flex flex-col items-center justify-center border-r border-gray-100 pr-2">
                <h2 className="text-3xl font-black text-gray-900 mb-0.5">
                  {stats.averageRating?.toFixed(1) || '0.0'}
                </h2>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar
                      key={s}
                      className={`w-3 h-3 ${s <= Math.round(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {stats.totalReviews} Reviews
                </p>
              </div>
              <div className="col-span-3 space-y-1 py-0.5">
                <RatingBar star={5} count={stats.star5} total={stats.totalReviews} />
                <RatingBar star={4} count={stats.star4} total={stats.totalReviews} />
                <RatingBar star={3} count={stats.star3} total={stats.totalReviews} />
                <RatingBar star={2} count={stats.star2} total={stats.totalReviews} />
                <RatingBar star={1} count={stats.star1} total={stats.totalReviews} />
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          <div className="px-1">
            <h3 className="text-sm md:text-base font-bold text-gray-950">Recent Feedback</h3>
          </div>

          {ratings.length > 0 ? (
            ratings.map((rating, idx) => (
              <div key={idx} className="bg-white rounded-md p-3 shadow-2xs border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-md bg-teal-50 flex items-center justify-center overflow-hidden border border-teal-100/50 shrink-0">
                      {rating.userId?.profilePhoto ? (
                        <img src={rating.userId.profilePhoto} alt={rating.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-4 h-4 text-teal-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-gray-900 leading-snug">{rating.userId?.name || 'Customer'}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar
                              key={s}
                              className={`w-2.5 h-2.5 ${s <= rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{formatDate(rating.reviewedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 shrink-0">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">{rating.serviceId?.title || rating.serviceName}</span>
                  </div>
                </div>

                {rating.review && (
                  <p className="text-gray-600 text-xs leading-relaxed font-medium pl-1.5 border-l-2 border-teal-500/20">
                    "{rating.review}"
                  </p>
                )}

                {rating.reviewImages && rating.reviewImages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {rating.reviewImages.map((img, i) => (
                      <img key={i} src={img} className="w-14 h-14 rounded-md object-cover shrink-0 border border-gray-100" alt="Review" />
                    ))}
                  </div>
                )}

                {rating.workerId && (
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Service by:</span>
                      <span className="text-[10px] font-bold text-teal-600">{rating.workerId.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-300">#{rating.bookingNumber}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare className="w-6 h-6 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No ratings yet</p>
            </div>
          )}

          {/* Load More */}
          {pagination.total > ratings.length && (
            <button
              onClick={() => fetchRatings(pagination.page + 1)}
              className="w-full py-2.5 bg-white rounded-md border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              {isLoading ? <FiLoader className="animate-spin" /> : 'Load More Reviews'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRatings;
