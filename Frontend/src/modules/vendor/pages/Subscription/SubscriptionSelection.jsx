import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiStar, FiShield, FiZap, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Logo from '../../../../components/common/Logo';
import authService from '../../services/authService';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionSelection = ({ isVerificationFlow = false, onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId 
    || sessionStorage.getItem('pendingVendorId')
    || (() => { try { return JSON.parse(localStorage.getItem('vendorData') || '{}')?.id; } catch { return null; } })();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionService.getActivePlans();
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();

    // Redirect if already active
    const checkActive = async () => {
      if (!vendorId) return;
      
      try {
        const statusRes = await authService.getRegistrationStatus(vendorId);
        if (statusRes.success && statusRes.vendor?.isSubscriptionActive) {
          // Update local storage to keep it in sync
          const currentData = JSON.parse(localStorage.getItem('vendorData') || '{}');
          localStorage.setItem('vendorData', JSON.stringify({ ...currentData, ...statusRes.vendor }));
          
          navigate('/vendor/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Error checking active status:', err);
      }
    };
    checkActive();

    // 1. Push a dummy state to history to intercept the NEXT back button press
    window.history.pushState(null, "", window.location.href);

    // 2. Handle browser back button (hardware or browser)
    const handlePopState = (event) => {
      // Clear vendor tokens so they land on login page as guest
      localStorage.removeItem('vendorAccessToken');
      localStorage.removeItem('vendorRefreshToken');
      localStorage.removeItem('vendorData');
      sessionStorage.removeItem('vendorAccessToken');
      sessionStorage.removeItem('vendorRefreshToken');
      sessionStorage.removeItem('vendorData');
      
      // Force navigation to login
      navigate('/vendor/login', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [navigate, vendorId]);

  const handleBackToLogin = () => {
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
    sessionStorage.removeItem('vendorAccessToken');
    sessionStorage.removeItem('vendorRefreshToken');
    sessionStorage.removeItem('vendorData');
    navigate('/vendor/login', { replace: true });
  };

  const handleSubscribe = async (plan) => {
    if (!vendorId) {
      toast.error('Session expired. Please login again.');
      navigate('/vendor/login');
      return;
    }

    setProcessingPayment(true);
    try {
      const orderRes = await subscriptionService.createOrder(plan._id, vendorId);
      if (orderRes.success) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: "Doormeets",
          description: `Subscription: ${plan.name}`,
          order_id: orderRes.order.id,
          handler: async (response) => {
            try {
              const verifyRes = await subscriptionService.verifyPayment({
                ...response,
                vendorId,
                planId: plan._id
              });
              if (verifyRes.success) {
                toast.success('Subscription active! Welcome to Doormeets.');
                
                // Update local storage vendor data
                const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
                vendorData.isSubscriptionActive = true;
                vendorData.approvalStatus = 'approved';
                if (verifyRes.subscription) {
                   vendorData.subscription = verifyRes.subscription;
                }
                localStorage.setItem('vendorData', JSON.stringify(vendorData));
                
                if (onComplete) {
                  onComplete();
                } else {
                  navigate('/vendor/dashboard', { replace: true });
                }
              }
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: "",
            email: "",
            contact: ""
          },
          theme: {
            color: "#9634f7"
          },
          modal: {
            ondismiss: () => setProcessingPayment(false)
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to initiate payment';
      toast.error(msg);
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9634f7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center relative max-w-xl mx-auto mb-6">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute top-0 left-0 flex items-center gap-1.5 text-slate-500 hover:text-[#B33A35] font-bold transition-all z-20 group"
          >
            <div className="p-1.5 rounded-full bg-white shadow-sm border border-slate-100 group-hover:border-[#B33A35] transition-all">
              <FiArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs">Back to Login</span>
          </button>

          <Logo className="h-10 mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Choose Your Growth Plan
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Get approved and start receiving high-quality leads from Doormeets today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={plan._id}
              className={`relative bg-white rounded-2xl shadow-lg p-4 sm:p-5 border transition-all duration-300 flex flex-col ${
                plan.isPopular ? 'border-[#B33A35] scale-102 z-10' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#B33A35] text-white px-3 py-0.5 rounded-full text-[11px] font-bold shadow-md uppercase tracking-wider">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{plan.price}</span>
                  <span className="text-slate-500 font-medium text-xs">/{plan.duration} days</span>
                </div>
                {plan.description && (
                  <p className="mt-2 text-slate-500 text-xs leading-normal">{plan.description}</p>
                )}
              </div>

              <div className="flex-grow space-y-2 mb-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="bg-red-50 rounded-full p-1 mt-0.5 shrink-0">
                      <FiCheck className="text-[#B33A35] w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 text-xs leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={processingPayment}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-white text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 cursor-pointer active:scale-95 text-center"
              >
                {processingPayment ? 'Processing...' : (
                  <>
                    Get Started <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-xl">
              <FiShield className="w-6 h-6 text-[#B33A35]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Secure Payments</h4>
              <p className="text-xs text-slate-500">Your transactions are encrypted and processed securely via Razorpay.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6 grayscale opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSelection;
