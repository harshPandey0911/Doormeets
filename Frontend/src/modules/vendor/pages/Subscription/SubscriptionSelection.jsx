import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiStar, FiShield, FiZap, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Logo from '../../../../components/common/Logo';
import authService from '../../services/authService';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionSelection = () => {
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
          
          navigate('/vendor/dashboard');
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
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: "Civil Connect",
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
                toast.success('Subscription active! Welcome to Civil Connect.');
                
                // Update local storage vendor data
                const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
                vendorData.isSubscriptionActive = true;
                if (verifyRes.subscription) {
                   vendorData.subscription = verifyRes.subscription;
                }
                localStorage.setItem('vendorData', JSON.stringify(vendorData));
                
                navigate('/vendor/dashboard');
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
            color: "#347989"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#347989]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute -top-4 left-0 flex items-center gap-2 text-slate-500 hover:text-[#347989] font-bold transition-all z-20 group"
          >
            <div className="p-2 rounded-full bg-white shadow-sm border border-slate-100 group-hover:border-[#347989] transition-all">
              <FiArrowLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Back to Login</span>
          </button>

          <Logo className="h-12 mx-auto mb-8" />
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl tracking-tight">
            Choose Your Growth Plan
          </h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
            Get approved and start receiving high-quality leads from Civil Connect today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div 
              key={plan._id}
              className={`relative bg-white rounded-3xl shadow-xl p-8 border transition-all duration-300 flex flex-col ${
                index === 1 ? 'border-[#347989] scale-105 z-10' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {index === 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#347989] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                  <span className="text-slate-500 font-medium">/{plan.duration} days</span>
                </div>
                <p className="mt-4 text-slate-500 text-sm">{plan.description}</p>
              </div>

              <div className="flex-grow space-y-4 mb-10">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="bg-teal-50 rounded-full p-1 mt-0.5">
                      <FiCheck className="text-teal-600 w-4 h-4" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={processingPayment}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 ${
                  index === 1 ? 'bg-[#347989] hover:bg-[#2a626e]' : 'bg-slate-900 hover:bg-slate-800'
                } disabled:opacity-50`}
              >
                {processingPayment ? 'Processing...' : (
                  <>
                    Get Started <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl p-10 shadow-lg border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <FiShield className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Secure Payments</h4>
              <p className="text-slate-500">Your transactions are encrypted and processed securely via Razorpay.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-8 grayscale opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSelection;
