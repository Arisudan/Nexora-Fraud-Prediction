// pages/verify-email.js
// Email Verification Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const { user } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, no-token
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('no-token');
      setMessage('No verification token provided. Please check your email for the verification link.');
    }
  }, [router.isReady, token]);

  const verifyEmail = async (verificationToken) => {
    try {
      setStatus('verifying');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!resendEmail) {
      setMessage('Please enter your email address.');
      return;
    }
    
    setIsResending(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setStatus('resent');
      } else {
        setMessage(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email | Nexora Fraud Predictor</title>
        <meta name="description" content="Verify your email address" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              🛡️ Nexora
            </h1>
            <p className="text-purple-300 mt-2">Fraud Predictor & Protection</p>
          </div>

          {/* Verification Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            
            {/* Verifying State */}
            {status === 'verifying' && (
              <div className="text-center">
                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-white mb-2">Verifying Your Email</h2>
                <p className="text-purple-200">Please wait while we verify your email address...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Email Verified! ✓</h2>
                <p className="text-green-300 mb-4">{message}</p>
                <p className="text-purple-200 text-sm">Redirecting to dashboard in 3 seconds...</p>
                <Link href="/dashboard" className="inline-block mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  Go to Dashboard
                </Link>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
                <p className="text-red-300 mb-6">{message}</p>
                
                {/* Resend Form */}
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <p className="text-purple-200 text-sm mb-3">Request a new verification link:</p>
                  <form onSubmit={handleResendVerification} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isResending}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
                    >
                      {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* No Token State */}
            {status === 'no-token' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No Verification Token</h2>
                <p className="text-yellow-300 mb-6">{message}</p>
                
                {/* Resend Form */}
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <p className="text-purple-200 text-sm mb-3">Request a verification link:</p>
                  <form onSubmit={handleResendVerification} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isResending}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
                    >
                      {isResending ? 'Sending...' : 'Send Verification Email'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Resent State */}
            {status === 'resent' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Email Sent!</h2>
                <p className="text-blue-300 mb-4">{message}</p>
                <p className="text-purple-200 text-sm">Please check your inbox and spam folder.</p>
              </div>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link href="/login" className="text-purple-300 hover:text-white text-sm transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
