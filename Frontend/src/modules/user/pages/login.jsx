import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiCheckCircle, FiChevronLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../theme';
import { userAuthService } from '../../../services/authService';
import Logo from '../../../components/common/Logo';
import LogoLoader from '../../../components/common/LogoLoader';


import { z } from "zod";

// Zod schema
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
});

const Login = () => {
  const navigate = useNavigate();
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

  // Refs for focus management
  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Auto-focus logic
  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem('accessToken')) {
      navigate('/user/home', { replace: true });
      return;
    }

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
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      // Clean phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await userAuthService.sendOTP(cleanPhone);

      if (response.success) {
        setOtpToken(response.token);
        setIsLoading(false);
        setStep('otp');
        setResendTimer(120); // Start 2 min timer
        toast.success(
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            <span>OTP sent successfully!</span>
          </div>
        );
      } else {
        setIsLoading(false);
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleOtpChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    if (value.length > 1) {
      // Handle paste of full OTP
      if (index === 0 && value.length === 6) {
        const chars = value.split('');
        setOtp(chars);
        // Focus the last input or verify button
        otpInputRefs.current[5]?.focus();
        return;
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const [focusedIndex, setFocusedIndex] = useState(null);

  // Auto-verify as last digit enters
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken) {
      handleOtpSubmit();
    }
  }, [otp]);

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
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
      const response = await userAuthService.verifyLogin({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otpValue
      });

      if (response.success) {
        if (response.isNewUser) {
          toast.success('Phone verified! Please complete your registration.');
          navigate('/user/signup', {
            state: {
              phone: phoneNumber,
              verificationToken: response.verificationToken
            }
          });
        } else {
          toast.success('Welcome back!');
          navigate('/user/home', { replace: true });
        }
      } else {
        setIsLoading(false);
        toast.error(response.message || 'Verification failed');
      }

    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  // Brand Colors from theme
  const brandColor = '#B33A35';

  return (
    <div className="min-h-[100dvh] bg-[#F4F5F8] md:bg-gray-100 flex flex-col justify-start md:justify-center md:py-12 md:px-6 lg:px-8 relative overflow-x-hidden font-['Montserrat']">
      <div className="w-full max-w-md mx-auto bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0 relative animate-fade-in">
        
        {/* Top Section: Header Banner with Illustration */}
        <div className="w-full bg-[#F4F5F8] py-7 px-6 relative flex items-center justify-center select-none border-b border-gray-100">
          {/* Close X Button */}
          <button
            onClick={() => navigate('/user')}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors z-20 cursor-pointer text-base"
            aria-label="Close"
          >
            <span>✕</span>
          </button>

          {/* Inline Premium Illustration */}
          <svg width="150" height="122" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mt-3">
            {/* Background Lavender Circle */}
            <circle cx="90" cy="75" r="42" fill="#E4E2F5" />
            
            {/* Dotted Circles/Arcs */}
            <circle cx="120" cy="48" r="24" stroke="#4B4A5A" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.6"/>
            <circle cx="58" cy="98" r="20" stroke="#4B4A5A" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.6"/>

            {/* Top-Left Dots Grid */}
            <circle cx="62" cy="38" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="68" cy="38" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="74" cy="38" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="62" cy="44" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="68" cy="44" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="74" cy="44" r="1.2" fill="#4B4A5A" opacity="0.5"/>

            {/* Bottom-Right Dots Grid */}
            <circle cx="118" cy="90" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="124" cy="90" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="130" cy="90" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="118" cy="96" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="124" cy="96" r="1.2" fill="#4B4A5A" opacity="0.5"/>
            <circle cx="130" cy="96" r="1.2" fill="#4B4A5A" opacity="0.5"/>

            {/* Desk / Base Line */}
            <line x1="40" y1="110" x2="140" y2="110" stroke="#1E1C2A" strokeWidth="3" strokeLinecap="round" />

            {/* Girl Torso (Purple Sweater) */}
            <path d="M64 110 C64 92, 74 84, 90 84 C106 84, 116 92, 116 110 Z" fill="#5E4CB8" stroke="#1E1C2A" strokeWidth="1.5" />
            <rect x="80" y="80" width="20" height="6" rx="3" fill="#4C3AA3" stroke="#1E1C2A" strokeWidth="1.5" />

            {/* Neck */}
            <rect x="84" y="72" width="12" height="10" fill="#FCE1D4" />

            {/* Face */}
            <circle cx="90" cy="60" r="13" fill="#FCE1D4" stroke="#1E1C2A" strokeWidth="1.5" />

            {/* Face Details */}
            <circle cx="85" cy="58" r="1" fill="#1E1C2A" />
            <circle cx="95" cy="58" r="1" fill="#1E1C2A" />
            <path d="M87 63 C87 66, 93 66, 93 63" stroke="#1E1C2A" strokeWidth="1.2" strokeLinecap="round" fill="none" />

            {/* Hair */}
            <circle cx="90" cy="40" r="7" fill="#1E1C2A" />
            <path d="M77 58 C77 46, 103 46, 103 58 Z" fill="#1E1C2A" />
            <path d="M77 58 C77 50, 103 50, 103 58 C103 58, 102 52, 92 52 C82 52, 77 58, 77 58 Z" fill="#1E1C2A" />

            {/* Headphones */}
            <rect x="73" y="52" width="5" height="12" rx="2.5" fill="#FFFFFF" stroke="#1E1C2A" strokeWidth="1.5" />
            <rect x="102" y="52" width="5" height="12" rx="2.5" fill="#FFFFFF" stroke="#1E1C2A" strokeWidth="1.5" />
            <path d="M75 52 C75 40, 105 40, 105 52" stroke="#1E1C2A" strokeWidth="1.5" fill="none" />

            {/* Laptop Back Lid (Facing Away) */}
            <rect x="73" y="85" width="34" height="22" rx="3" fill="#FFFFFF" stroke="#1E1C2A" strokeWidth="1.5" />
            <circle cx="90" cy="96" r="1.5" fill="#1E1C2A" />
          </svg>
        </div>

        {/* Bottom Section: Form Fields */}
        <div className="flex-1 bg-white px-7 py-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {step === 'phone' ? 'Sign in' : 'Verify your phone'}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 font-normal">
              {step === 'phone'
                ? 'Please enter below details to continue.'
                : `We've sent a code to +91 ${phoneNumber}`
              }
            </p>

            <div className="mt-6">
              {step === 'phone' ? (
                <form className="space-y-6" onSubmit={handlePhoneSubmit}>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium text-sm border-r border-gray-200 pr-3">+91</span>
                      </div>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        id="phone"
                        className="block w-full pl-16 pr-4 py-3.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setPhoneNumber(val);
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || phoneNumber.length < 10}
                    className="w-full py-3.5 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                    ) : (
                      <>
                        <span>Get OTP</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleOtpSubmit}>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 text-center">
                      Enter OTP Code
                    </label>
                    <div className="flex justify-center gap-2.5 py-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onFocus={() => setFocusedIndex(index)}
                          onBlur={() => setFocusedIndex(null)}
                          placeholder={focusedIndex === index ? "_" : ""}
                          className="w-11 h-12 text-center text-xl font-semibold bg-[#FFF5F5] border border-[#FCD7D9] rounded-xl focus:bg-white focus:border-[#B33A35] focus:ring-1 focus:ring-[#B33A35] outline-none transition-all text-[#B33A35]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium">
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
                      <FiChevronLeft /> Change Number
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (isLoading || resendTimer > 0) return;
                        try {
                          setIsLoading(true);
                          const response = await userAuthService.sendOTP(phoneNumber.replace(/\D/g, ''));
                          if (response.success) {
                            setOtpToken(response.token);
                            setResendTimer(120);
                            toast.success('OTP resent!');
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
                    className="w-full py-3.5 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-5">
            {step === 'phone' && (
              <p className="text-center text-sm text-gray-500 font-medium">
                New to Doormeets?{' '}
                <Link to="/user/signup" className="text-[#B33A35] hover:text-[#9E2E2A] font-semibold transition-colors">
                  Create an account
                </Link>
              </p>
            )}
            <p className="mt-3 text-center text-xs text-gray-400 font-normal">
              &copy; {new Date().getFullYear()} Doormeets. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
