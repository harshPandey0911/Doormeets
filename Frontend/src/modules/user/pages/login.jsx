import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiCheckCircle, FiChevronLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../theme';
import { userAuthService } from '../../../services/authService';
import Logo from '../../../components/common/Logo';
import LogoLoader from '../../../components/common/LogoLoader';
import loginIllustration from '../../../assets/images/loginpage.png';
import { useTheme } from '../../../context/ThemeContext';

import { z } from "zod";

// Zod schema
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
});

const Login = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
    <div className={`min-h-[100dvh] flex flex-col justify-start md:justify-center md:py-12 md:px-6 lg:px-8 relative overflow-x-hidden font-['Montserrat'] transition-colors ${isDark ? 'bg-zinc-950 text-white' : 'bg-[#F4F5F8] md:bg-gray-100 text-gray-900'}`}>
      <div className={`w-full max-w-md mx-auto md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0 relative animate-fade-in transition-colors ${isDark ? 'bg-zinc-900 border-0 md:border md:border-zinc-800' : 'bg-white border-0 md:border md:border-gray-100'}`}>
        
        {/* Top Section: Header Banner with Illustration */}
        <div className={`w-full h-[220px] relative flex items-center justify-center select-none border-b overflow-hidden transition-colors ${isDark ? 'bg-zinc-800/80 border-zinc-800' : 'bg-[#F4F5F8] border-gray-100'}`}>
          {/* Close X Button */}
          <button
            onClick={() => navigate('/user')}
            className={`absolute top-4 right-4 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-colors z-20 cursor-pointer text-base ${isDark ? 'bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-white/90 text-gray-500 hover:text-gray-800'}`}
            aria-label="Close"
          >
            <span>✕</span>
          </button>

          {/* Preloaded Dual Illustrations for 0ms instant theme switching */}
          <img
            src={loginIllustration}
            alt="Login Illustration Light"
            className={`w-full h-full object-cover scale-105 transition-all duration-300 ${isDark ? 'hidden' : 'block'}`}
            style={{ transform: 'scale(1.05)' }}
          />
          <img
            src="/loginpageDark.png"
            alt="Login Illustration Dark"
            className={`w-full h-full object-cover scale-105 transition-all duration-300 ${isDark ? 'block' : 'hidden'}`}
            style={{ transform: 'scale(1.05)' }}
          />
        </div>

        {/* Bottom Section: Form Fields */}
        <div className={`flex-1 px-7 py-6 flex flex-col justify-between transition-colors ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'}`}>
          <div>
            <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {step === 'phone' ? 'Sign in' : 'Verify your phone'}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400 font-normal">
              {step === 'phone'
                ? 'Please enter below details to continue.'
                : `We've sent a code to +91 ${phoneNumber}`
              }
            </p>

            <div className="mt-6">
              {step === 'phone' ? (
                <form className="space-y-6" onSubmit={handlePhoneSubmit}>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                      Mobile Number
                    </label>
                    <div className={`relative rounded-2xl border overflow-hidden transition-all ${isDark ? 'border-zinc-700 bg-zinc-800 focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]' : 'border-gray-200 bg-white focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]'}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <span className={`font-medium text-sm border-r pr-3 ${isDark ? 'text-zinc-400 border-zinc-700' : 'text-gray-500 border-gray-200'}`}>+91</span>
                      </div>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        name="phone"
                        id="phone"
                        className={`block w-full pl-16 pr-4 py-3.5 border-0 text-sm focus:outline-none focus:ring-0 focus:border-0 ${isDark ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                        style={{
                          WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #ffffff inset',
                          WebkitTextFillColor: isDark ? '#ffffff' : '#111827',
                          caretColor: isDark ? '#ffffff' : '#111827'
                        }}
                        placeholder="Enter 10-digit number"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3 text-center">
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
                          className={`w-11 h-12 text-center text-xl font-semibold border rounded-xl outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-800 border-zinc-700 text-red-400 focus:bg-zinc-800 focus:border-[#B33A35] focus:ring-1 focus:ring-[#B33A35]' 
                              : 'bg-[#FFF5F5] border-[#FCD7D9] text-[#B33A35] focus:bg-white focus:border-[#B33A35] focus:ring-1 focus:ring-[#B33A35]'
                          }`}
                          style={{
                            WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #fff5f5 inset',
                            WebkitTextFillColor: isDark ? '#f87171' : '#B33A35',
                            caretColor: isDark ? '#f87171' : '#B33A35'
                          }}
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
                      className="flex items-center text-gray-500 dark:text-zinc-400 hover:text-[#B33A35] dark:hover:text-red-400 transition-colors gap-0.5 cursor-pointer"
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
                      className="text-[#B33A35] dark:text-red-400 hover:text-[#9E2E2A] dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <p className="text-center text-sm text-gray-500 dark:text-zinc-400 font-medium">
                New to Doormeets?{' '}
                <Link to="/user/signup" className="text-[#B33A35] dark:text-red-400 hover:text-[#9E2E2A] dark:hover:text-red-300 font-semibold transition-colors">
                  Create an account
                </Link>
              </p>
            )}
            <p className="mt-2 text-center text-xs text-gray-400 dark:text-zinc-500 font-normal">
              By continuing, you agree to Doormeets' <Link to="/user/terms-and-conditions" className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 underline font-medium">Terms & Conditions</Link> & <Link to="/user/privacy-policy" className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 underline font-medium">Privacy Policy</Link>
            </p>
            <p className="mt-1.5 text-center text-xs text-gray-400 dark:text-zinc-500 font-normal">
              &copy; {new Date().getFullYear()} Doormeets. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
