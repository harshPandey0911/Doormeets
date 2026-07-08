import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MdPhone, MdLock, MdStore, MdOutlineVpnKey } from 'react-icons/md';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password flow states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/shop/auth/login`, {
        phone,
        password
      });

      if (response.data.success) {
        localStorage.setItem('shopAccessToken', response.data.accessToken);
        localStorage.setItem('shopUser', JSON.stringify(response.data.data));
        navigate('/shop/dashboard');
      } else {
        setError(response.data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const response = await axios.post(`${API_URL}/shop/auth/forgot-password/send-otp`, {
        phone: forgotPhone
      });

      if (response.data.success) {
        setOtpSent(true);
        setForgotMessage('OTP sent successfully. (Default OTP: 123456)');
      } else {
        setForgotError(response.data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setForgotError(err.response?.data?.message || 'Phone number not registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const response = await axios.post(`${API_URL}/shop/auth/forgot-password/reset`, {
        phone: forgotPhone,
        otp,
        newPassword
      });

      if (response.data.success) {
        setForgotMessage('Password reset successfully. Redirecting to login...');
        setTimeout(() => {
          setShowForgot(false);
          setOtpSent(false);
          setForgotPhone('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotMessage('');
        }, 2000);
      } else {
        setForgotError(response.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset Password error:', err);
      setForgotError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients for rich aesthetics */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <MdStore className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">Doormeets Shop Panel</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to manage your referrals and view rewards
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 py-8 px-4 shadow-2xl rounded-3xl sm:px-10">
          
          {!showForgot ? (
            <>
              {error && (
                <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <MdPhone className="w-5 h-5" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      required
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <MdLock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotPhone(phone); setForgotError(''); setForgotMessage(''); }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer shadow-blue-500/20 active:scale-98"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-4">Forgot Password</h3>
              
              {forgotError && (
                <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400 text-sm font-medium">
                  {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-medium">
                  {forgotMessage}
                </div>
              )}

              {!otpSent ? (
                <form className="space-y-6" onSubmit={handleSendOtp}>
                  <div>
                    <label htmlFor="forgotPhone" className="block text-sm font-medium text-slate-300">
                      Phone Number
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <MdPhone className="w-5 h-5" />
                      </div>
                      <input
                        id="forgotPhone"
                        type="text"
                        required
                        placeholder="Enter registered 10-digit number"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="w-1/2 flex justify-center py-3 px-4 border border-slate-800 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-1/2 flex justify-center py-3 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleResetPassword}>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      One Time Password (OTP)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <MdOutlineVpnKey className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Default OTP: 123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      New Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <MdLock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <MdLock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/2 flex justify-center py-3 px-4 border border-slate-800 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-1/2 flex justify-center py-3 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              New merchant?{' '}
              <Link to="/shop/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
