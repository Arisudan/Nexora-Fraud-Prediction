// FILE: pages/index.js
// Landing Page - Hero section explaining the "Predict Scams Before They Happen" mission

import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiUsers, 
  FiSearch, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiTrendingUp,
  FiArrowRight,
  FiLock,
  FiZap
} from 'react-icons/fi';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: FiUsers,
      title: 'Crowd Intelligence',
      description: 'Leverage the collective knowledge of thousands of users reporting fraud in real-time.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FiSearch,
      title: 'Instant Verification',
      description: 'Check any phone number, email, or UPI ID instantly before making transactions.',
      gradient: 'from-emerald-500 to-green-500'
    },
    {
      icon: FiShield,
      title: 'Proactive Protection',
      description: 'Get alerts and warnings before you become a victim of fraud.',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: FiTrendingUp,
      title: 'Smart Scoring',
      description: 'Our algorithm weighs reports by severity, giving higher scores to phishing and identity theft.',
      gradient: 'from-orange-500 to-amber-500'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Report Fraud',
      description: 'Community members report fraudulent phone numbers, emails, and UPI IDs with evidence.'
    },
    {
      step: 2,
      title: 'AI Analysis',
      description: 'Our Crowd Intelligence algorithm analyzes reports and calculates risk scores.'
    },
    {
      step: 3,
      title: 'Check & Verify',
      description: 'Before any transaction, check the risk level of unknown contacts instantly.'
    },
    {
      step: 4,
      title: 'Stay Protected',
      description: 'Make informed decisions based on community-verified data.'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Reports Submitted', icon: FiAlertTriangle },
    { value: '100K+', label: 'Users Protected', icon: FiUsers },
    { value: '95%', label: 'Detection Rate', icon: FiCheckCircle },
    { value: '24/7', label: 'Real-time Monitoring', icon: FiZap }
  ];

  return (
    <Layout title="Home">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 text-white overflow-hidden -mt-16 pt-16">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/30 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 mb-8 border border-white/20">
              <FiZap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Powered by Crowd Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Predict Scams
              <span className="block bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">Before They Happen</span>
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto mb-12">
              Join thousands of users protecting each other from fraud. 
              Check phone numbers, emails, and UPI IDs before you transact.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold py-4 px-8 rounded-xl hover:bg-purple-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Go to Dashboard
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    Get Started Free
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all"
                  >
                    <FiLock className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-14 flex flex-wrap justify-center gap-8 text-purple-200">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Community Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-100 group">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-extrabold gradient-text text-center">{stat.value}</p>
                <p className="text-gray-600 font-medium text-center mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="gradient-text">Nexora</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines community reports with intelligent algorithms to protect you from fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple four-step process to stay protected from online fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30" />
                )}
                
                <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
                  {/* Step Number */}
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 relative z-10 shadow-lg shadow-purple-500/30">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels Explanation */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Understanding <span className="gradient-text">Risk Levels</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our Crowd Intelligence algorithm calculates risk scores based on community reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Safe */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform glow-safe">
                  <FiCheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-2">SAFE</h3>
                <p className="text-emerald-600 font-semibold mb-3">0 Points</p>
                <p className="text-gray-600">
                  No fraud reports found. This entity appears safe to interact with.
                </p>
              </div>
            </div>

            {/* Suspicious */}
            <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform glow-suspicious">
                  <FiAlertTriangle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-700 mb-2">SUSPICIOUS</h3>
                <p className="text-amber-600 font-semibold mb-3">1-5 Points</p>
                <p className="text-gray-600">
                  Some reports exist. Proceed with caution and verify independently.
                </p>
              </div>
            </div>

            {/* High Risk */}
            <div className="relative bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border-2 border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform glow-danger">
                  <FiShield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 mb-2">HIGH RISK</h3>
                <p className="text-red-600 font-semibold mb-3">&gt;5 Points</p>
                <p className="text-gray-600">
                  Multiple fraud reports! Avoid this entity and report if contacted.
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Info */}
          <div className="mt-12 max-w-2xl mx-auto bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-4 text-lg">How Scoring Works:</h4>
            <ul className="space-y-3 text-purple-800">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">1</span>
                <span><strong>+1 point</strong> for every report in the last 30 days</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">2</span>
                <span><strong>+2 additional points</strong> if the report is for Phishing or Identity Theft</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Protect Yourself?
          </h2>
          <p className="text-xl text-purple-200 mb-10">
            Join our community today and start checking suspicious contacts before it's too late.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-5 px-10 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
