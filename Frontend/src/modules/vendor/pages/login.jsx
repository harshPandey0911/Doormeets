import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiChevronLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { sendOTP, verifyLogin } from '../services/authService';
import Logo from '../../../components/common/Logo';
import LogoLoader from '../../../components/common/LogoLoader';
import loginIllustration from '../../../assets/images/loginpage.png';

import { z } from "zod";

// Zod schema
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
});

const VendorLogin = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    const workerToken = localStorage.getItem('workerAccessToken') || sessionStorage.getItem('workerAccessToken');
    const vendorToken = localStorage.getItem('vendorAccessToken') || sessionStorage.getItem('vendorAccessToken');
    return !!(workerToken || vendorToken);
  });
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Refs for auto-focus
  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Auto-focus and session restore logic
  useEffect(() => {
    // If already logged in, redirect immediately to dashboard instead of asking for credentials again
    const workerToken = localStorage.getItem('workerAccessToken') || sessionStorage.getItem('workerAccessToken');
    const vendorToken = localStorage.getItem('vendorAccessToken') || sessionStorage.getItem('vendorAccessToken');
    
    if (workerToken) {
      navigate('/worker/dashboard', { replace: true });
      return;
    }
    if (vendorToken) {
      navigate('/vendor/dashboard', { replace: true });
      return;
    }

    setIsCheckingAuth(false);

    if (step === 'phone' && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current.focus(), 100);
    } else if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0].focus(), 100);
    }
  }, [step, navigate]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    // Zod Validation
    const validationResult = phoneSchema.safeParse({ phone: phoneNumber });
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    setIsLoading(true);
    try {
      const response = await sendOTP(cleanPhone);
      if (response.success) {
        // Speculative check: If backend sends vendor info at this stage
        if (response.vendor?.adminApproval?.toLowerCase() === 'pending') {
          navigate('/vendor/pending-approval');
          return;
        }

        setOtpToken(response.token);
        setIsLoading(false);
        setStep('otp');
        setResendTimer(120); // Start timer
        toast.success('OTP sent successfully');

        // PREFETCH: speculatively load vendor dashboard chunk while user enters OTP
        // This means by the time they verify, the chunk is already in browser cache
        import('./Dashboard/index.jsx').catch(() => {});
        import('../routes/index.jsx').catch(() => {});
      } else {
        setIsLoading(false);
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
      
      // Auto-redirect to signup if user not found (404)
      if (error.response?.status === 404) {
        setTimeout(() => {
          navigate('/vendor/signup', { state: { phone: cleanPhone } });
        }, 1500);
      }
    }
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-verify as last digit enters
  // Note: Using ref to hold latest handleOtpSubmit to avoid stale closure issues
  const handleOtpSubmitRef = useRef(null);
  useEffect(() => {
    handleOtpSubmitRef.current = handleOtpSubmit;
  });
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken) {
      handleOtpSubmitRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleOtpSubmit = async (e, directOtpValue = null) => {
    if (e) e.preventDefault();
    const otpValue = directOtpValue || otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!otpToken) {
      toast.error('Please request OTP first');
      return;
    }
    setIsLoading(true);
    try {
      const response = await verifyLogin({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otpValue
      });

      if (response.success) {
        // DO NOT call setIsLoading(false) here — navigating away immediately,
        // so the extra React re-render would just flash the un-spun button for one frame

        if (response.isNewUser) {
          navigate('/vendor/signup', {
            state: { phone: phoneNumber.replace(/\D/g, ''), verificationToken: response.verificationToken }
          });
          toast.success('Phone verified! Please complete registration.');
        } else {
          if (response.isWorker) {
            localStorage.setItem('workerAccessToken', response.accessToken);
            localStorage.setItem('workerRefreshToken', response.refreshToken);
            localStorage.setItem('workerData', JSON.stringify(response.worker));
            localStorage.setItem('role', 'worker');
            // Navigate FIRST — then show toast (toast appears on the next page)
            navigate('/worker', { replace: true });
            toast.success('Welcome Back! Logged into worker account.');
            return;
          }

          // Check for rejected status
          if (response.vendor?.adminApproval === 'rejected' || response.vendor?.adminApproval === 'REJECTED' || response.vendor?.approvalStatus === 'REJECTED') {
            setIsLoading(false);
            toast.error('Your application has been rejected.');
            return;
          }

          // Check for pending approval status (New Verification Flow)
          const isPending = response.vendor?.approvalStatus?.toLowerCase() === 'pending' || response.vendor?.adminApproval?.toLowerCase() === 'pending';
          if (isPending) {
            localStorage.setItem('vendorAccessToken', response.accessToken);
            localStorage.setItem('vendorRefreshToken', response.refreshToken);
            localStorage.setItem('vendorData', JSON.stringify(response.vendor));
            navigate('/vendor/verification');
            toast.success('Please complete your training and subscription.');
            return;
          }

          localStorage.setItem('vendorAccessToken', response.accessToken);
          localStorage.setItem('vendorRefreshToken', response.refreshToken);
          localStorage.setItem('vendorData', JSON.stringify(response.vendor));

          // Navigate FIRST — dashboard is already prefetched, so it loads instantly
          navigate('/vendor', { replace: true });
          // Toast fires after navigation (appears on dashboard)
          toast.success('Welcome Back! Logged in successfully.');
        }
      } else {
        setIsLoading(false);
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (isCheckingAuth) {
    return <LogoLoader />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F4F5F8] md:bg-gray-100 flex flex-col justify-start md:justify-center md:py-12 md:px-6 lg:px-8 relative overflow-x-hidden font-['Montserrat']">
      <div className="w-full max-w-md mx-auto bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0 relative animate-fade-in">
        
        {/* Top Section: Header Banner with Logo */}
        <div className="w-full bg-[#F4F5F8] py-4 px-6 relative flex items-center justify-center select-none border-b border-gray-100">

          {/* Illustration */}
          <img
            src={loginIllustration}
            alt="Login Illustration"
            className="mx-auto mt-2 h-[140px] w-auto object-contain"
            fetchPriority="high"
          />
        </div>

        {/* Bottom Section: Form Fields */}
        <div className="flex-1 bg-white px-7 py-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {step === 'phone' ? 'Vendor Sign In' : 'Verify Identity'}
            </h2>
            <p className="mt-1 text-xs text-gray-500 font-normal">
              {step === 'phone'
                ? 'Manage your services and bookings'
                : `We've sent a 6-digit code to ${phoneNumber}`
              }
            </p>

            <div className="mt-4">
              {step === 'phone' ? (
                <form className="space-y-4" onSubmit={handlePhoneSubmit}>
                  <div>
                    <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium text-sm border-r border-gray-200 pr-3">+91</span>
                      </div>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        name="phone"
                        id="phone"
                        className="block w-full pl-16 pr-4 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => {
                          let raw = e.target.value;
                          let digits = raw.replace(/\D/g, '');
                          if (digits.length > 10 && digits.startsWith('91')) {
                            digits = digits.slice(2);
                          } else if (digits.length > 10 && digits.startsWith('0')) {
                            digits = digits.slice(1);
                          } else if (digits.length === 11 && digits.startsWith('0')) {
                            digits = digits.slice(1);
                          }
                          if (digits.length > 10) {
                            digits = digits.slice(-10);
                          }
                          if (digits.length === 0) {
                            setPhoneNumber('');
                            return;
                          }
                          if (/^[6-9]/.test(digits)) {
                            setPhoneNumber(digits.slice(0, 10));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || phoneNumber.length < 10}
                    className="w-full py-3 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Get Started</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleOtpSubmit}>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 text-center">
                      Enter OTP Code
                    </label>
                    <div className="flex justify-between gap-2.5 py-1">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-full h-11 text-center text-lg font-semibold bg-[#FFF5F5] border border-[#FCD7D9] rounded-xl focus:bg-white focus:border-[#B33A35] focus:ring-1 focus:ring-[#B33A35] outline-none transition-all text-[#B33A35]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setOtp(['', '', '', '', '', '']);
                        setOtpToken('');
                        setStep('phone');
                        setResendTimer(0);
                      }}
                      className="flex items-center text-gray-500 hover:text-[#B33A35] transition-colors gap-0.5 cursor-pointer"
                    >
                      <FiChevronLeft /> Edit number
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (isLoading || resendTimer > 0) return;
                        try {
                          setIsLoading(true);
                          const response = await sendOTP(phoneNumber.replace(/\D/g, ''));
                          if (response.success) {
                            setOtpToken(response.token);
                            setResendTimer(120);
                            toast.success('New code sent!');
                          }
                        } catch (err) {
                          toast.error('Error sending OTP');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading || resendTimer > 0}
                      className="text-[#B33A35] hover:text-[#9E2E2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {resendTimer > 0
                        ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                        : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 6}
                    className="w-full py-3 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Login to Dashboard</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-4">
            {step === 'phone' && (
              <p className="text-center text-xs text-gray-500 font-medium">
                Don't have a vendor account?{' '}
                <Link to="/vendor/signup" className="text-[#B33A35] hover:text-[#9E2E2A] font-semibold transition-colors">
                  Register Now
                </Link>
              </p>
            )}
            <p className="mt-2 text-center text-[10px] text-gray-400 font-normal">
              By continuing, you agree to Doormeets' <Link to="/vendor/terms-and-conditions" className="text-gray-500 hover:text-gray-700 underline font-medium">Terms & Conditions</Link> & <Link to="/vendor/privacy-policy" className="text-gray-500 hover:text-gray-700 underline font-medium">Privacy Policy</Link>
            </p>
            <p className="mt-1 text-center text-[10px] text-gray-400 font-normal">
              &copy; {new Date().getFullYear()} Doormeets. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorLogin;
