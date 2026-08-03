import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle, FiGift } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../theme';
import { userAuthService } from '../../../services/authService';
import Logo from '../../../components/common/Logo';
import LogoLoader from '../../../components/common/LogoLoader';
import loginIllustration from '../../../assets/images/loginpage.png';
import { useTheme } from '../../../context/ThemeContext';

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
  const { isDark } = useTheme();
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
  const [referralCode, setReferralCode] = useState('');

  // Extract referral code on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('referral');
    if (code) {
      setReferralCode(code.toUpperCase());
    }
  }, [location.search]);

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

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    referralCode: ''
  });
  const [touched, setTouched] = useState({});

  const validateField = (fieldName, value, currentFormData = formData, refCode = referralCode) => {
    let errorMsg = '';

    if (fieldName === 'name') {
      const trimmed = value ? value.trim() : '';
      if (!trimmed) {
        errorMsg = 'Full name is required';
      } else if (trimmed.length < 2) {
        errorMsg = 'Name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        errorMsg = 'Name can only contain letters and spaces';
      }
    }

    if (fieldName === 'email') {
      const trimmed = value ? value.trim() : '';
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        errorMsg = 'Please enter a valid email address';
      }
    }

    if (fieldName === 'phoneNumber') {
      if (!verificationToken) {
        const trimmed = value ? value.trim() : '';
        if (!trimmed) {
          errorMsg = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(trimmed)) {
          errorMsg = 'Please enter a valid 10-digit phone number';
        }
      }
    }

    if (fieldName === 'referralCode') {
      const trimmed = refCode ? refCode.trim() : '';
      if (trimmed && !/^[A-Za-z0-9-]{4,15}$/.test(trimmed)) {
        errorMsg = 'Invalid referral code format';
      }
    }

    return errorMsg;
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    let val = formData[fieldName];
    if (fieldName === 'referralCode') val = referralCode;
    const err = validateField(fieldName, val);
    setErrors(prev => ({ ...prev, [fieldName]: err }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };
    if (name === 'name') {
      let clean = value.replace(/[^a-zA-Z\s]/g, '');
      clean = clean.replace(/  +/g, ' ');
      const formatted = clean.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
      newFormData.name = formatted;
      setFormData(newFormData);
    } else {
      newFormData[name] = value;
      setFormData(newFormData);
    }

    if (touched[name]) {
      const err = validateField(name, newFormData[name], newFormData);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleNameBlur = () => {
    handleBlur('name');
    if (formData.name) {
      const trimmed = formData.name.trim().replace(/\s+/g, ' ');
      const formatted = trimmed.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
      setFormData(prev => ({ ...prev, name: formatted }));
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateField('name', formData.name);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phoneNumber', formData.phoneNumber);
    const refErr = validateField('referralCode', referralCode);

    const newErrors = {
      name: nameErr,
      email: emailErr,
      phoneNumber: phoneErr,
      referralCode: refErr
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, phoneNumber: true, referralCode: true });

    if (nameErr || emailErr || phoneErr || refErr) {
      const firstError = nameErr || phoneErr || emailErr || refErr;
      toast.error(firstError);
      return;
    }

    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await userAuthService.register({
          name: formData.name,
          email: formData.email || null,
          verificationToken,
          referralCode: referralCode || undefined
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
        token: otpToken,
        referralCode: referralCode || undefined
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
            alt="Signup Illustration Light"
            className={`w-full h-full object-cover scale-105 transition-all duration-300 ${isDark ? 'hidden' : 'block'}`}
            style={{ transform: 'scale(1.05)' }}
          />
          <img
            src="/loginpageDark.png"
            alt="Signup Illustration Dark"
            className={`w-full h-full object-cover scale-105 transition-all duration-300 ${isDark ? 'block' : 'hidden'}`}
            style={{ transform: 'scale(1.05)' }}
          />
        </div>

        {/* Bottom Section: Form Fields */}
        <div className={`flex-1 px-7 py-6 flex flex-col justify-between transition-colors ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'}`}>
          <div>
            <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {step === 'details' ? 'Sign up' : 'Verify phone'}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400 font-normal">
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
                      className="flex items-center text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-[#B33A35] dark:hover:text-red-400 transition-colors mb-3 cursor-pointer"
                    >
                      <FiChevronLeft className="mr-0.5" /> Back to Login
                    </button>
                  )}

                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                      Full Name
                    </label>
                    <div className={`relative rounded-2xl border overflow-hidden transition-all ${
                      errors.name && touched.name 
                        ? 'border-red-500 bg-red-50/20 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' 
                        : 'border-gray-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-800/40 focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]'
                    }`}>
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${errors.name && touched.name ? 'text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                        <FiUser />
                      </div>
                      <input
                        ref={nameInputRef}
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        autoCapitalize="words"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={handleNameBlur}
                        className={`block w-full pl-10 pr-4 py-3 border-0 text-sm focus:outline-none focus:ring-0 focus:border-0 ${isDark ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                        style={{
                          WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #ffffff inset',
                          WebkitTextFillColor: isDark ? '#ffffff' : '#111827',
                          caretColor: isDark ? '#ffffff' : '#111827'
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && touched.name && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <span>•</span> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                      Email <span className="text-gray-400 dark:text-zinc-500 text-[10px] font-normal normal-case ml-1">(Optional)</span>
                    </label>
                    <div className={`relative rounded-2xl border overflow-hidden transition-all ${
                      errors.email && touched.email 
                        ? 'border-red-500 bg-red-50/20 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' 
                        : 'border-gray-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-800/40 focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]'
                    }`}>
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${errors.email && touched.email ? 'text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                        <FiMail />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        className={`block w-full pl-10 pr-4 py-3 border-0 text-sm focus:outline-none focus:ring-0 focus:border-0 ${isDark ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                        style={{
                          WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #ffffff inset',
                          WebkitTextFillColor: isDark ? '#ffffff' : '#111827',
                          caretColor: isDark ? '#ffffff' : '#111827'
                        }}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <span>•</span> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  {!verificationToken && (
                    <div>
                      <label htmlFor="phoneNumber" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                        Phone Number
                      </label>
                      <div className={`relative rounded-2xl border overflow-hidden transition-all ${
                        errors.phoneNumber && touched.phoneNumber 
                          ? 'border-red-500 bg-red-50/20 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' 
                          : 'border-gray-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-800/40 focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]'
                      }`}>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className={`font-medium text-sm border-r pr-3 ${errors.phoneNumber && touched.phoneNumber ? 'text-red-500 border-red-200' : 'text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'}`}>+91</span>
                        </div>
                        <input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          value={formData.phoneNumber}
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
                            const updatedVal = /^[6-9]/.test(digits) ? digits.slice(0, 10) : '';
                            setFormData(prev => ({ ...prev, phoneNumber: updatedVal }));
                            if (touched.phoneNumber) {
                              const err = validateField('phoneNumber', updatedVal, { ...formData, phoneNumber: updatedVal });
                              setErrors(prev => ({ ...prev, phoneNumber: err }));
                            }
                          }}
                          onBlur={() => handleBlur('phoneNumber')}
                          className={`block w-full pl-16 pr-4 py-3 border-0 text-sm focus:outline-none focus:ring-0 focus:border-0 ${isDark ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                          style={{
                            WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #ffffff inset',
                            WebkitTextFillColor: isDark ? '#ffffff' : '#111827',
                            caretColor: isDark ? '#ffffff' : '#111827'
                          }}
                          placeholder="9876543210"
                        />
                      </div>
                      {errors.phoneNumber && touched.phoneNumber && (
                        <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                          <span>•</span> {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Referral Code */}
                  <div>
                    <label htmlFor="referralCode" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                      Referral Code <span className="text-gray-400 dark:text-zinc-500 text-[10px] font-normal normal-case ml-1">(Optional)</span>
                    </label>
                    <div className={`relative rounded-2xl border overflow-hidden transition-all ${
                      errors.referralCode && touched.referralCode 
                        ? 'border-red-500 bg-red-50/20 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' 
                        : 'border-gray-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-800/40 focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35]'
                    }`}>
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${errors.referralCode && touched.referralCode ? 'text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                        <FiGift />
                      </div>
                      <input
                        id="referralCode"
                        name="referralCode"
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setReferralCode(val);
                          if (touched.referralCode) {
                            const err = validateField('referralCode', val, formData, val);
                            setErrors(prev => ({ ...prev, referralCode: err }));
                          }
                        }}
                        onBlur={() => handleBlur('referralCode')}
                        className={`block w-full pl-10 pr-4 py-3 border-0 text-sm focus:outline-none focus:ring-0 focus:border-0 ${isDark ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                        style={{
                          WebkitBoxShadow: isDark ? '0 0 0 30px #27272a inset' : '0 0 0 30px #ffffff inset',
                          WebkitTextFillColor: isDark ? '#ffffff' : '#111827',
                          caretColor: isDark ? '#ffffff' : '#111827'
                        }}
                        placeholder="DM-XXXXXX"
                      />
                    </div>
                    {errors.referralCode && touched.referralCode && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <span>•</span> {errors.referralCode}
                      </p>
                    )}
                  </div>

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
                    className="flex items-center text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-[#B33A35] dark:hover:text-red-400 transition-colors mb-3 cursor-pointer"
                  >
                    <FiChevronLeft className="mr-0.5" /> Edit details
                  </button>

                  <form onSubmit={handleOtpSubmit} className="space-y-5">
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
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
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
                        className="text-xs font-semibold text-[#B33A35] dark:text-red-400 hover:text-[#9E2E2A] dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            <p className="text-center text-sm text-gray-500 dark:text-zinc-400 font-medium">
              Already have an account?{' '}
              <Link to="/user/login" className="text-[#B33A35] dark:text-red-400 hover:text-[#9E2E2A] dark:hover:text-red-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
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

export default Signup;
