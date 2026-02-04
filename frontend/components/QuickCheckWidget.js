// FILE: components/QuickCheckWidget.js
// Instant Protection Check Widget - Check before you answer/open!

import { useState, useRef, useEffect } from 'react';
import { riskAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  FiPhone, FiMail, FiMessageSquare, FiSearch, FiShield,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader,
  FiX, FiCopy, FiAlertCircle
} from 'react-icons/fi';

export default function QuickCheckWidget() {
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear result when input changes
  useEffect(() => {
    if (result) {
      setResult(null);
      setShowPopup(false);
    }
  }, [input]);

  // Detect input type
  const detectType = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { type: 'email', icon: FiMail, label: 'Email', color: 'purple' };
    }
    
    // Phone pattern (10-15 digits)
    if (/^[\d\s\-\+\(\)]{10,}$/.test(trimmed)) {
      return { type: 'phone', icon: FiPhone, label: 'Phone', color: 'blue' };
    }
    
    // Default to phone if mostly numbers
    if (/^\d+$/.test(trimmed.replace(/[\s\-\+\(\)]/g, ''))) {
      return { type: 'phone', icon: FiPhone, label: 'Phone', color: 'blue' };
    }
    
    // Could be SMS sender name
    return { type: 'phone', icon: FiMessageSquare, label: 'SMS/Other', color: 'green' };
  };

  const detectedType = detectType(input);

  const handleCheck = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) {
      toast.error('Please enter a phone number or email');
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const response = await riskAPI.checkRisk(input.trim());
      
      if (response.success) {
        // Store the checked entity along with result
        const resultWithEntity = {
          ...response.data,
          checkedEntity: input.trim()
        };
        setResult(resultWithEntity);
        
        // Show popup for risky entities (medium, high, critical)
        if (response.data.riskLevel === 'critical' || 
            response.data.riskLevel === 'high' || 
            response.data.riskLevel === 'medium') {
          setShowPopup(true);
        } else {
          // Safe or low risk entity - show toast
          toast.success('✅ This appears to be safe!', { duration: 3000 });
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to check');
    } finally {
      setChecking(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setShowPopup(false);
    inputRef.current?.focus();
  };

  const getRiskConfig = (level) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-600',
          bgLight: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          icon: FiXCircle,
          emoji: '🔴',
          message: 'DANGEROUS - Do NOT interact!'
        };
      case 'high':
        return {
          bg: 'bg-orange-500',
          bgLight: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-700',
          icon: FiAlertTriangle,
          emoji: '🟠',
          message: 'HIGH RISK - Be very careful!'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          icon: FiAlertCircle,
          emoji: '🟡',
          message: 'SUSPICIOUS - Proceed with caution'
        };
      case 'low':
        return {
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: FiShield,
          emoji: '🔵',
          message: 'Low risk - Some reports exist'
        };
      default:
        return {
          bg: 'bg-green-500',
          bgLight: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-700',
          icon: FiCheckCircle,
          emoji: '🟢',
          message: 'SAFE - No reports found'
        };
    }
  };

  return (
    <>
      {/* Quick Check Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-1 shadow-2xl">
        <div className="bg-white rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Protection Check</h2>
              <p className="text-sm text-gray-500">Check before you answer or open!</p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {detectedType ? (
                  <detectedType.icon className={`w-5 h-5 text-${detectedType.color}-500`} />
                ) : (
                  <FiSearch className="w-5 h-5" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste phone number or email here..."
                className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              />
              {input && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Type indicator */}
            {detectedType && (
              <div className={`flex items-center gap-2 text-sm text-${detectedType.color}-600`}>
                <detectedType.icon className="w-4 h-4" />
                <span>Detected as: <strong>{detectedType.label}</strong></span>
              </div>
            )}

            <button
              type="submit"
              disabled={checking || !input.trim()}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {checking ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <FiShield className="w-5 h-5" />
                  Check Now - Is It Safe?
                </>
              )}
            </button>
          </form>

          {/* Quick Result Badge (inline) */}
          {result && !showPopup && (
            <div className={`mt-4 p-4 rounded-xl ${getRiskConfig(result.riskLevel).bgLight} border-2 ${getRiskConfig(result.riskLevel).border}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRiskConfig(result.riskLevel).emoji}</span>
                <div>
                  <p className={`font-bold ${getRiskConfig(result.riskLevel).text}`}>
                    {result.riskLevel?.toUpperCase()} - Score: {result.score}
                  </p>
                  <p className="text-sm text-gray-600">
                    {result.totalReports} community reports
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Usage hints */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
              <FiPhone className="w-3 h-3" /> Incoming Call?
            </span>
            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
              <FiMessageSquare className="w-3 h-3" /> Suspicious SMS?
            </span>
            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
              <FiMail className="w-3 h-3" /> Unknown Email?
            </span>
          </div>
        </div>
      </div>

      {/* Alert Popup Modal */}
      {showPopup && result && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowPopup(false)}
          />
          
          {/* Popup */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-scaleIn">
            <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 ${getRiskConfig(result.riskLevel).border}`}>
              {/* Header */}
              <div className={`${getRiskConfig(result.riskLevel).bg} px-6 py-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                      <FiAlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">⚠️ WARNING!</h3>
                      <p className="text-white/90">
                        {result.riskLevel?.toUpperCase()} RISK DETECTED
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Entity Info */}
                <div className={`${getRiskConfig(result.riskLevel).bgLight} rounded-xl p-4 mb-4 border ${getRiskConfig(result.riskLevel).border}`}>
                  <p className="text-sm text-gray-500 mb-1">Checking:</p>
                  <p className="font-mono font-bold text-lg text-gray-900 break-all">
                    {result.checkedEntity}
                  </p>
                </div>

                {/* Risk Score */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{result.score}</p>
                    <p className="text-sm text-gray-500">Risk Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{result.totalReports}</p>
                    <p className="text-sm text-gray-500">Reports</p>
                  </div>
                </div>

                {/* Warning Message */}
                <div className={`p-4 rounded-xl ${getRiskConfig(result.riskLevel).bgLight} border ${getRiskConfig(result.riskLevel).border}`}>
                  <p className={`font-bold ${getRiskConfig(result.riskLevel).text} flex items-center gap-2`}>
                    {result.totalReports > 0 
                      ? `${getRiskConfig(result.riskLevel).emoji} ${result.totalReports} fraud report(s) found!`
                      : `${getRiskConfig(result.riskLevel).emoji} ${getRiskConfig(result.riskLevel).message}`
                    }
                  </p>
                </div>

                {/* Top Reports */}
                {result.reportDetails?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Reports:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {result.reportDetails.slice(0, 3).map((report, idx) => (
                        <div key={idx} className="text-sm bg-gray-50 rounded-lg p-2 flex justify-between">
                          <span className="text-gray-600">{report.category}</span>
                          <span className="text-red-600 font-medium">{report.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (result.checkedEntity) {
                        navigator.clipboard?.writeText(result.checkedEntity);
                        toast.success('Copied to clipboard!');
                      }
                    }}
                    className="py-3 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy & Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
