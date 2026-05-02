import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle, FiTool } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import api from '../../../services/api';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const BRAND = '#347989';

const LabourLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const phoneRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (localStorage.getItem('labourAccessToken')) {
      navigate('/labour/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (step === 'phone') setTimeout(() => phoneRef.current?.focus(), 100);
    else setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const result = phoneSchema.safeParse({ phone: phoneNumber });
    if (!result.success) { toast.error(result.error.issues[0].message); return; }

    setIsLoading(true);
    try {
      const res = await api.post('/workers/auth/send-otp', { phone: phoneNumber });
      if (res.data.success) {
        setStep('otp');
        setResendTimer(120);
        toast.success('OTP sent successfully');
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);
    if (clean && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  useEffect(() => {
    const val = otp.join('');
    if (val.length === 6 && !isLoading) handleOtpSubmit();
  }, [otp]);

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { toast.error('Please enter complete OTP'); return; }

    setIsLoading(true);
    try {
      const res = await api.post('/workers/auth/verify-login', {
        phone: phoneNumber,
        otp: otpValue
      });

      if (res.data.success) {
        setIsLoading(false);
        if (res.data.isNewUser) {
          // New labour → go to register
          navigate('/labour/register', {
            state: { phone: phoneNumber, verificationToken: res.data.verificationToken }
          });
        } else {
          // Existing labour → store tokens and go to dashboard
          localStorage.setItem('labourAccessToken', res.data.accessToken);
          localStorage.setItem('labourRefreshToken', res.data.refreshToken);
          localStorage.setItem('labourData', JSON.stringify(res.data.worker || res.data.vendor || {}));
          toast.success('Welcome back!');
          navigate('/labour/dashboard', { replace: true });
        }
      } else {
        setIsLoading(false);
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex flex-col justify-center py-12 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-amber-400 opacity-[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-400 opacity-[0.05] rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-orange-200">
            <FiTool className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {step === 'phone' ? (isRegisterMode ? 'Register as Labour' : 'Labour Sign In') : 'Verify OTP'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === 'phone' 
              ? (isRegisterMode ? 'Enter your number to create an account' : 'Login to start receiving booking requests') 
              : `Code sent to +91 ${phoneNumber}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 rounded-t-[2rem]" />

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.18em] mb-2 block">Phone Number</label>
                <div className="relative rounded-xl shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium border-r border-gray-300 pr-2">+91</span>
                  </div>
                  <input
                    ref={phoneRef}
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="block w-full pl-24 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || phoneNumber.length < 10}
                className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Sending OTP...' : (<>Get Started <FiArrowRight /></>)}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => { setOtp(['','','','','','']); setStep('phone'); }}
                className="flex items-center text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                <FiChevronLeft className="mr-1" /> Edit number
              </button>
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-full h-14 text-center text-xl font-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                      style={{ backgroundColor: digit ? '#FFF7ED' : 'white' }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (resendTimer > 0) return;
                      try {
                        const res = await api.post('/workers/auth/send-otp', { phone: phoneNumber });
                        if (res.data.success) { setResendTimer(120); toast.success('Code resent!'); }
                      } catch { toast.error('Failed to resend'); }
                    }}
                    disabled={resendTimer > 0}
                    className="text-sm font-bold text-orange-500 disabled:opacity-50"
                  >
                    {resendTimer > 0 ? `Resend in ${Math.floor(resendTimer/60)}:${String(resendTimer%60).padStart(2,'0')}` : 'Resend code'}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Verifying...' : (<>Login <FiArrowRight /></>)}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Back to vendor login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Are you a vendor?{' '}
          <Link to="/vendor/login" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
            Vendor Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LabourLogin;
