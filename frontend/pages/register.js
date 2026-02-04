// FILE: pages/register.js
// User Registration Page with Protection Settings - Industrial Grade

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiUserPlus,
  FiPhone, FiMessageSquare, FiShield, FiCheck, FiArrowRight
} from 'react-icons/fi';

export default function Register() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Protection Settings
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [protectionSettings, setProtectionSettings] = useState({
    callProtection: { enabled: false, phone: '' },
    smsProtection: { enabled: false, phone: '' },
    emailProtection: { enabled: false, email: '' }
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

  const handleProtectionToggle = (type) => {
    setProtectionSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled,
        // Auto-fill with user's data
        ...(type === 'callProtection' || type === 'smsProtection' 
          ? { phone: formData.phone || prev[type].phone || '' }
          : type === 'emailProtection' 
            ? { email: formData.email || prev[type].email || '' }
            : {})
      }
    }));
  };

  const handleProtectionChange = (type, field, value) => {
    setProtectionSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      // Auto-fill protection settings with user's data
      setProtectionSettings(prev => ({
        ...prev,
        callProtection: { ...prev.callProtection, phone: formData.phone || prev.callProtection.phone },
        smsProtection: { ...prev.smsProtection, phone: formData.phone || prev.smsProtection.phone },
        emailProtection: { ...prev.emailProtection, email: formData.email || prev.emailProtection.email }
      }));
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Build protection settings object for API
      const apiProtectionSettings = {
        callProtection: {
          enabled: protectionSettings.callProtection.enabled,
          registeredPhone: protectionSettings.callProtection.phone,
          alertMode: 'popup'
        },
        smsProtection: {
          enabled: protectionSettings.smsProtection.enabled,
          registeredPhone: protectionSettings.smsProtection.phone,
          alertMode: 'popup'
        },
        emailProtection: {
          enabled: protectionSettings.emailProtection.enabled,
          registeredEmail: protectionSettings.emailProtection.email,
          alertMode: 'popup'
        }
      };

      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        protectionSettings: apiProtectionSettings
      };
      
      const result = await register(registrationData);
      
      if (result.success) {
        const enabledCount = Object.values(protectionSettings).filter(p => p.enabled).length;
        toast.success(`Registration successful! ${enabledCount} protection(s) enabled.`);
        router.push('/login');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const protectionOptions = [
    {
      id: 'callProtection',
      icon: FiPhone,
      title: 'Call Protection',
      description: 'Get instant popup alerts before spam/fraud calls reach you',
      color: 'blue',
      bgEnabled: 'bg-blue-50 border-blue-500',
      bgIcon: 'bg-blue-100',
      textIcon: 'text-blue-600',
      field: 'phone',
      placeholder: 'Phone number (e.g., 9876543210)'
    },
    {
      id: 'smsProtection',
      icon: FiMessageSquare,
      title: 'SMS Protection',
      description: 'Receive alerts before spam/scam messages arrive',
      color: 'green',
      bgEnabled: 'bg-green-50 border-green-500',
      bgIcon: 'bg-green-100',
      textIcon: 'text-green-600',
      field: 'phone',
      placeholder: 'Phone number for SMS protection'
    },
    {
      id: 'emailProtection',
      icon: FiMail,
      title: 'Email Protection',
      description: 'Get notified before phishing emails reach your inbox',
      color: 'purple',
      bgEnabled: 'bg-purple-50 border-purple-500',
      bgIcon: 'bg-purple-100',
      textIcon: 'text-purple-600',
      field: 'email',
      placeholder: 'Email address to protect'
    }
  ];

  const enabledProtections = Object.entries(protectionSettings).filter(([_, v]) => v.enabled);

  return (
    <Layout title="Sign Up - Nexora Fraud Predictor">
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiShield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Create Your Account' : 'Choose Your Protection'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 1 
                ? 'Join Nexora Fraud Predictor and stay protected' 
                : 'Select the protection services you need'}
            </p>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center mt-6 gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                step === 1 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                {step > 1 ? <FiCheck className="w-4 h-4" /> : <span className="w-4 h-4 text-sm font-bold">1</span>}
                <span className="text-sm font-medium">Account Info</span>
              </div>
              
              <div className={`w-8 h-1 rounded ${step > 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                step === 2 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="w-4 h-4 text-sm font-bold">2</span>
                <span className="text-sm font-medium">Protection</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {step === 1 ? (
              /* Step 1: Basic Information */
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`input-field pl-10 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400 font-normal">(recommended for call/SMS protection)</span>
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
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
                >
                  Next: Choose Protection
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </form>
            ) : (
              /* Step 2: Protection Settings */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Tip:</strong> Select the protection services you need. You can enable one, some, or all protections. 
                    Each enabled protection will give you <strong>instant popup alerts</strong> before spam/fraud reaches you.
                  </p>
                </div>

                {/* Protection Options */}
                <div className="space-y-4">
                  {protectionOptions.map((option) => {
                    const Icon = option.icon;
                    const isEnabled = protectionSettings[option.id]?.enabled;
                    const fieldValue = protectionSettings[option.id]?.[option.field] || '';
                    
                    return (
                      <div
                        key={option.id}
                        className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                          isEnabled 
                            ? option.bgEnabled
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => handleProtectionToggle(option.id)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ${
                              isEnabled 
                                ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                                : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                              isEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                          
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isEnabled ? option.bgIcon : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-7 h-7 ${
                              isEnabled ? option.textIcon : 'text-gray-400'
                            }`} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{option.title}</h3>
                              {isEnabled && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  ENABLED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            
                            {/* Input field when enabled */}
                            {isEnabled && (
                              <div className="mt-3">
                                <input
                                  type={option.field === 'email' ? 'email' : 'text'}
                                  value={fieldValue}
                                  onChange={(e) => handleProtectionChange(option.id, option.field, e.target.value)}
                                  placeholder={option.placeholder}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                  required={isEnabled}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Your Protection Summary</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {enabledProtections.length === 0 
                          ? 'No protection selected yet - you can add later in settings'
                          : `${enabledProtections.length} protection${enabledProtections.length > 1 ? 's' : ''} will be activated`
                        }
                      </p>
                    </div>
                    <div className="text-4xl font-bold text-primary-400">
                      {enabledProtections.length}
                    </div>
                  </div>
                  
                  {enabledProtections.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {enabledProtections.map(([key]) => {
                        const option = protectionOptions.find(o => o.id === key);
                        return (
                          <span key={key} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm font-medium flex items-center gap-2">
                            <FiCheck className="w-4 h-4 text-green-400" />
                            {option?.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-lg"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-5 h-5" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>

                {/* Terms */}
                <p className="text-sm text-gray-500 text-center">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
                </p>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center border-t border-gray-200 pt-6">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
