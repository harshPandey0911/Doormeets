import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiClock, FiLogOut, FiArrowLeft, FiX } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import { themeColors } from '../../../../theme';
import { getRegistrationStatus } from '../../services/authService';

const PendingApproval = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRejected = location.state?.status === 'REJECTED' || location.state?.status === 'rejected' || location.state?.rejected;
  const isTrainingPending = location.state?.status === 'TRAINING_PENDING' || location.state?.status === 'training_pending';
  const reason = location.state?.reason || 'Your application did not meet our requirements.';
  
  const brandColor = '#B33A35';

  useEffect(() => {
    const checkStatus = async () => {
      const vendorId = sessionStorage.getItem('pendingVendorId');
      if (!vendorId || isRejected || isTrainingPending) return;

      try {
        const response = await getRegistrationStatus(vendorId);
        if (response.success) {
          if (response.approvalStatus?.toLowerCase() === 'approved') {
            if (!response.isSubscriptionActive) {
              navigate('/vendor/subscription', { state: { vendorId } });
            } else {
              navigate('/vendor/dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Failed to check vendor status:', error);
      }
    };

    checkStatus();
  }, [navigate, isRejected, isTrainingPending]);

  const handleBackToLogin = () => {
    // Clear any temporary tokens if they exist
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
    sessionStorage.removeItem('pendingVendorId');
    navigate('/vendor/login');
  };

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col justify-center py-4 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B33A35] opacity-[0.03] rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D68F35] opacity-[0.03] rounded-full blur-3xl animate-floating" style={{ animationDelay: '2s' }} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10 text-center mb-3">
        <Logo className="h-10 w-auto mx-auto transform hover:scale-105 transition-transform duration-500" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10 my-auto">
        <div className="bg-white py-5 px-4 sm:px-5 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 relative overflow-hidden animate-slide-in-bottom">
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${isRejected ? 'from-red-500 to-orange-500' : 'from-[#B33A35] via-[#D68F35] to-[#B33A35]'}`} />
          
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-3 ${isRejected ? 'bg-red-50' : 'bg-red-50'}`}>
              {isRejected ? (
                <FiX className="h-6 w-6 text-red-500" />
              ) : (
                <FiClock className="h-6 w-6 text-[#B33A35]" />
              )}
            </div>
            
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1.5 tracking-tight">
              {isRejected ? 'Application Rejected' : isTrainingPending ? 'Training Under Review' : 'Registration Under Review'}
            </h2>
            
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {isRejected 
                ? "We regret to inform you that your application has been rejected."
                : isTrainingPending
                ? "You have completed your training. Our team is reviewing your results and will approve your account shortly."
                : "Your application is currently being verified by our team. You'll be able to access your dashboard once your account is approved."}
            </p>

            <div className="space-y-2.5">
              <div className={`p-2.5 rounded-xl border ${isRejected ? 'bg-red-50 border-red-100' : 'bg-red-50/50 border-red-100'}`}>
                <p className={`text-[11px] sm:text-xs ${isRejected ? 'text-red-700' : 'text-red-800'}`}>
                  {isRejected ? (
                    <><strong>Reason:</strong> {reason}</>
                  ) : (
                    <>Approval usually takes <strong>24-48 hours</strong>. We will notify you once it's complete.</>
                  )}
                </p>
              </div>

              <button
                onClick={handleBackToLogin}
                className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-xs sm:text-sm font-bold rounded-xl text-white transition-all transform hover:-translate-y-0.5 shadow-md overflow-hidden cursor-pointer active:scale-95"
                style={{ 
                  backgroundColor: brandColor,
                  boxShadow: `0 8px 12px -3px ${brandColor}4D` 
                }}
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-x-full transition-transform duration-700 -translate-x-full" />
                <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Need help? <a href="mailto:support@Doormeets.in" className="font-bold text-[#B33A35] hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
