// FILE: pages/forgot-password.js
// Forgot Password Page

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FiMail, FiLoader, FiKey, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = new password
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        toast.success('OTP sent to your email! (Check console for demo OTP)');
        setStep(2);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp });
      
      if (response.data.success) {
        toast.success('OTP verified! Set your new password.');
        setStep(3);
      } else {
        toast.error(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/auth/reset-password', { 
        email, 
        otp, 
        newPassword 
      });
      
      if (response.data.success) {
        toast.success('Password reset successful! Please login.');
        router.push('/login');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Forgot Password">
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <FiKey className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 mt-2">
              {step === 1 && "Enter your email to receive a reset code"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
              {step === 3 && "Create your new password"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${
                  step >= s ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/30' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <FiCheck /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className={`w-full px-4 py-4 text-center text-2xl tracking-widest font-mono border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                      errors.otp 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                    }`}
                  />
                  {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
                  <p className="text-gray-500 text-sm mt-2">
                    Check your email for the verification code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-600 text-sm hover:text-purple-600 transition-colors"
                >
                  ← Back to email
                </button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                        errors.newPassword 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                        errors.confirmPassword 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-600 hover:text-purple-600 inline-flex items-center gap-1 transition-colors">
                <FiArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
