// FILE: pages/login.js
// User Login Page with Split-Screen Design

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiLogIn, FiShield, FiCheckCircle } from 'react-icons/fi';

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        
        // Check if user has completed KYC
        const user = result.user;
        if (user && !user.kycVerified && !user.phone) {
          // Redirect to KYC if not completed
          router.push('/kyc');
        } else {
          // Redirect to dashboard or previous page
          const redirectTo = router.query.redirect || '/dashboard';
          router.push(redirectTo);
        }
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Real-time fraud protection',
    'Community-powered intelligence',
    'Instant risk verification',
    'Secure & private'
  ];

  return (
    <Layout title="Sign In">
      <div className="min-h-screen flex pt-16">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 p-12 items-center justify-center relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/30 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          </div>
          
          <div className="relative z-10 max-w-md text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
              <FiShield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Nexora</h1>
            <p className="text-xl text-purple-200 mb-8">
              Protect yourself from fraud with our community-powered intelligence platform.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <FiShield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl transition-all duration-300 focus:ring-4 outline-none ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl transition-all duration-300 focus:ring-4 outline-none ${
                        errors.password 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <FiLogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center border-t border-gray-100 pt-6">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
