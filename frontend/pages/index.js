// FILE: pages/index.js
// Landing Page - Hero section explaining the "Predict Scams Before They Happen" mission

import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
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

  const features = [
    {
      icon: FiUsers,
      title: 'Crowd Intelligence',
      description: 'Leverage the collective knowledge of thousands of users reporting fraud in real-time.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: FiSearch,
      title: 'Instant Verification',
      description: 'Check any phone number, email, or UPI ID instantly before making transactions.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FiShield,
      title: 'Proactive Protection',
      description: 'Get alerts and warnings before you become a victim of fraud.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: FiTrendingUp,
      title: 'Smart Scoring',
      description: 'Our algorithm weighs reports by severity, giving higher scores to phishing and identity theft.',
      color: 'bg-orange-100 text-orange-600'
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
    { value: '50K+', label: 'Reports Submitted' },
    { value: '100K+', label: 'Users Protected' },
    { value: '95%', label: 'Detection Rate' },
    { value: '24/7', label: 'Real-time Monitoring' }
  ];

  return (
    <Layout title="Home">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 mb-8">
              <FiZap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Powered by Crowd Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Predict Scams
              <span className="block text-yellow-400">Before They Happen</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-10">
              Join thousands of users protecting each other from fraud. 
              Check phone numbers, emails, and UPI IDs before you transact.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-4 px-8 rounded-lg hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-4 px-8 rounded-lg hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <FiLock className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-200">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                <span>Community Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-extrabold text-primary-600">{stat.value}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Nexora?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines community reports with intelligent algorithms to protect you from fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover text-center group">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
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
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-primary-200" />
                )}
                
                <div className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  {/* Step Number */}
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels Explanation */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Understanding Risk Levels
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our Crowd Intelligence algorithm calculates risk scores based on community reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Safe */}
            <div className="card border-2 border-green-200 bg-green-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 mb-2">SAFE</h3>
                <p className="text-green-600 font-medium mb-2">0 Points</p>
                <p className="text-gray-600 text-sm">
                  No fraud reports found. This entity appears safe to interact with.
                </p>
              </div>
            </div>

            {/* Suspicious */}
            <div className="card border-2 border-yellow-200 bg-yellow-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-700 mb-2">SUSPICIOUS</h3>
                <p className="text-yellow-600 font-medium mb-2">1-5 Points</p>
                <p className="text-gray-600 text-sm">
                  Some reports exist. Proceed with caution and verify independently.
                </p>
              </div>
            </div>

            {/* High Risk */}
            <div className="card border-2 border-red-200 bg-red-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 mb-2">HIGH RISK</h3>
                <p className="text-red-600 font-medium mb-2">&gt;5 Points</p>
                <p className="text-gray-600 text-sm">
                  Multiple fraud reports! Avoid this entity and report if contacted.
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Info */}
          <div className="mt-12 max-w-2xl mx-auto bg-primary-50 rounded-xl p-6">
            <h4 className="font-bold text-primary-900 mb-3">How Scoring Works:</h4>
            <ul className="space-y-2 text-primary-800">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span><strong>+1 point</strong> for every report in the last 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span><strong>+2 additional points</strong> if the report is for Phishing or Identity Theft</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Protect Yourself?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our community today and start checking suspicious contacts before it's too late.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-4 px-8 rounded-lg hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl text-lg"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
