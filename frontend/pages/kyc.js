// FILE: pages/kyc.js
// KYC (Know Your Customer) / Personal Info Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { kycAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { FiPhone, FiMapPin, FiCreditCard, FiLoader, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function KYC() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    idNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // If user already completed KYC, redirect to dashboard
  useEffect(() => {
    if (user?.kycCompleted) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <Layout title="KYC Verification">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="spinner w-12 h-12"></div>
        </div>
      </Layout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePhoneForm = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    
    if (!validatePhoneForm()) return;

    setLoading(true);
    try {
      // Submit KYC info
      const response = await kycAPI.submit(
        formData.phone.replace(/\D/g, ''),
        formData.address,
        formData.idNumber
      );
      
      if (response.success) {
        // Send OTP
        await kycAPI.sendOTP();
        toast.success('OTP sent to your phone number');
        setStep(2);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit KYC information');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length < 4) {
      setErrors({ otp: 'Please enter a valid OTP' });
      return;
    }

    setLoading(true);
    try {
      const response = await kycAPI.verifyOTP(otp);
      
      if (response.success) {
        toast.success('Phone verified successfully!');
        updateUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await kycAPI.sendOTP();
      if (response.success) {
        toast.success('OTP resent successfully');
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="KYC Verification">
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <FiCheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Personal Info</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Verification</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Complete Your Profile' : 'Verify Your Phone'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 1 
                ? 'We need a few more details to verify your identity'
                : 'Enter the OTP sent to your phone number'
              }
            </p>
          </div>

          {/* Form Card */}
          <div className="card">
            {step === 1 ? (
              <form onSubmit={handleSubmitInfo} className="space-y-5">
                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={`input-field pl-10 ${errors.phone ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* Address Field */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter your address"
                      className="input-field pl-10 resize-none"
                    />
                  </div>
                </div>

                {/* ID Number Field */}
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number (Optional)
                  </label>
                  <div className="relative">
                    <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="idNumber"
                      name="idNumber"
                      type="text"
                      value={formData.idNumber}
                      onChange={handleChange}
                      placeholder="Aadhaar / PAN / Passport Number"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Continue
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* Phone Display */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">OTP sent to</p>
                  <p className="text-lg font-semibold text-gray-900">+91 {formData.phone}</p>
                </div>

                {/* OTP Input */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setErrors({});
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className={`input-field text-center text-2xl tracking-widest font-mono ${errors.otp ? 'input-error' : ''}`}
                  />
                  {errors.otp && <p className="text-red-500 text-sm mt-1 text-center">{errors.otp}</p>}
                </div>

                {/* Mock OTP Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-800">
                    <strong>Demo Mode:</strong> Use OTP <code className="bg-blue-100 px-2 py-0.5 rounded">123456</code> to verify
                  </p>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-primary-600 hover:underline text-sm font-medium"
                  >
                    Didn't receive OTP? Resend
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-5 h-5" />
                      Verify & Continue
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary w-full"
                >
                  Back to Edit Phone
                </button>
              </form>
            )}

            {/* Skip Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip for now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
