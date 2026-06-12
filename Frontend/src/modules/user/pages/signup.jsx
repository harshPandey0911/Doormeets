import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../theme';
import { userAuthService } from '../../../services/authService';
import Logo from '../../../components/common/Logo';
import LogoLoader from '../../../components/common/LogoLoader';

import { z } from "zod";

// Zod schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name can only contain letters"),
  email: z.string().optional().refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
});

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
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
  const nameInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Pre-fill from navigation state (Unified Flow)
  useEffect(() => {
    if (location.state?.phone && location.state?.verificationToken) {
      setFormData(prev => ({ ...prev, phoneNumber: location.state.phone }));
      setVerificationToken(location.state.verificationToken);
    }
  }, [location.state]);

  // Auto-focus logic
  useEffect(() => {
    if (step === 'details' && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    } else if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0].focus(), 100);
    }
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();

    // Zod Validation
    const validationResult = signupSchema.safeParse(formData);

    if (!validationResult.success) {
      validationResult.error.errors.forEach(err => toast.error(err.message));
      return;
    }

    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await userAuthService.register({
          name: formData.name,
          email: formData.email || null,
          verificationToken
        });
        if (response.success) {
          try {
            const { registerFCMToken } = await import('../../../services/pushNotificationService');
            await registerFCMToken('user', true);
          } catch (e) { console.error(e); }

          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Welcome to Doormeets!</span>
              <span className="text-xs">Your account has been created successfully.</span>
            </div>,
            { icon: <FiCheckCircle className="text-green-500" /> }
          );
          navigate('/user/home');
        } else {
          toast.error(response.message || 'Registration failed');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await userAuthService.sendOTP(formData.phoneNumber, formData.email || null);
      if (response.success) {
        setOtpToken(response.token);
        setIsLoading(false);
        setStep('otp');
        setResendTimer(120); // Start timer
        toast.success('OTP sent successfully');
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
      const response = await userAuthService.register({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phoneNumber,
        otp: otpValue,
        token: otpToken
      });
      if (response.success) {
        setIsLoading(false);
        try {
          const { registerFCMToken } = await import('../../../services/pushNotificationService');
          await registerFCMToken('user', true);
        } catch (fcmError) {
          console.error('FCM Registration failed on signup:', fcmError);
        }

        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">Welcome to Doormeets!</span>
            <span className="text-xs">Account created successfully.</span>
          </div>,
          { icon: <FiCheckCircle className="text-green-500" /> }
        );
        navigate('/user/home');
      } else {
        setIsLoading(false);
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
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
              {step === 'details' ? 'Sign up' : 'Verify phone'}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 font-normal">
              {step === 'details'
                ? 'Join Doormeets to start booking services'
                : `We've sent a 6-digit code to +91 ${formData.phoneNumber}`
              }
            </p>

            <div className="mt-6">
              {step === 'details' ? (
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  {verificationToken && (
                    <button
                      type="button"
                      onClick={() => navigate('/user/login')}
                      className="flex items-center text-xs font-semibold text-gray-500 hover:text-[#B33A35] transition-colors mb-3 cursor-pointer"
                    >
                      <FiChevronLeft className="mr-0.5" /> Back to Login
                    </button>
                  )}

                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Full Name
                    </label>
                    <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <FiUser />
                      </div>
                      <input
                        ref={nameInputRef}
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Email <span className="text-gray-400 text-[10px] font-normal normal-case ml-1">(Optional)</span>
                    </label>
                    <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <FiMail />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  {!verificationToken && (
                    <div>
                      <label htmlFor="phoneNumber" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Phone Number
                      </label>
                      <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium text-sm border-r border-gray-200 pr-3">+91</span>
                        </div>
                        <input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          className="block w-full pl-16 pr-4 py-3 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 mt-2 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                    ) : (
                      <>
                        <span>{verificationToken ? 'Complete Registration' : 'Send OTP'}</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="flex items-center text-xs font-semibold text-gray-500 hover:text-[#B33A35] transition-colors mb-3 cursor-pointer"
                  >
                    <FiChevronLeft className="mr-0.5" /> Edit details
                  </button>

                  <form onSubmit={handleOtpSubmit} className="space-y-5">
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
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-11 h-12 text-center text-xl font-semibold bg-[#FFF5F5] border border-[#FCD7D9] rounded-xl focus:bg-white focus:border-[#B33A35] focus:ring-1 focus:ring-[#B33A35] outline-none transition-all text-[#B33A35]"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          if (resendTimer > 0) return;
                          try {
                            const response = await userAuthService.sendOTP(formData.phoneNumber, formData.email || null);
                            if (response.success) {
                              setOtpToken(response.token);
                              setResendTimer(120);
                              toast.success('New code sent!');
                            }
                          } catch (error) {
                            toast.error('Failed to resend code');
                          }
                        }}
                        disabled={resendTimer > 0}
                        className="text-xs font-semibold text-[#B33A35] hover:text-[#9E2E2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {resendTimer > 0
                          ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                          : 'Resend code'}
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
                          <span>Create Account</span>
                          <FiArrowRight />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-5">
            <p className="text-center text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/user/login" className="text-[#B33A35] hover:text-[#9E2E2A] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-gray-400 font-normal">
              &copy; {new Date().getFullYear()} Doormeets. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
