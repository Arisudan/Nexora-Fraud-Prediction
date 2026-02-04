// FILE: components/RiskMeter.js
// Visual component for displaying fraud risk level (Safe/Suspicious/Unsafe)

import { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiAlertTriangle, 
  FiAlertOctagon, 
  FiCheckCircle,
  FiXCircle,
  FiInfo
} from 'react-icons/fi';

// Animated Gauge Component
const AnimatedGauge = ({ percentage, color }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 150 150">
        {/* Background circle */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Animated progress circle */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{Math.round(animatedPercent)}%</span>
      </div>
    </div>
  );
};

export default function RiskMeter({ riskData, loading = false, onBlock, onMarkSafe }) {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (riskData) {
      const timer = setTimeout(() => setAnimationComplete(true), 500);
      return () => clearTimeout(timer);
    }
  }, [riskData]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-700 font-semibold text-lg">Analyzing with Crowd Intelligence...</p>
        <p className="text-gray-400 text-sm mt-2">Checking fraud reports from our community</p>
        <div className="flex justify-center gap-1 mt-4">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    );
  }

  if (!riskData) {
    return null;
  }

  const { riskLevel, riskColor, riskMessage, score, totalReports, targetEntity, reportDetails } = riskData;

  // Determine styles based on risk level
  const getRiskStyles = () => {
    switch (riskLevel) {
      case 'safe':
        return {
          bgGradient: 'from-emerald-400 to-green-500',
          bgLight: 'bg-gradient-to-br from-emerald-50 to-green-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-700',
          iconBg: 'bg-emerald-100',
          glowClass: 'glow-safe',
          hexColor: '#10b981',
          icon: FiShield,
          label: 'SAFE',
          emoji: '✓'
        };
      case 'suspicious':
        return {
          bgGradient: 'from-amber-400 to-orange-500',
          bgLight: 'bg-gradient-to-br from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          iconBg: 'bg-amber-100',
          glowClass: 'glow-suspicious',
          hexColor: '#f59e0b',
          icon: FiAlertTriangle,
          label: 'SUSPICIOUS',
          emoji: '⚠'
        };
      case 'high_risk':
        return {
          bgGradient: 'from-red-500 to-rose-600',
          bgLight: 'bg-gradient-to-br from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconBg: 'bg-red-100',
          glowClass: 'glow-danger',
          hexColor: '#ef4444',
          icon: FiAlertOctagon,
          label: 'HIGH RISK',
          emoji: '🚨'
        };
      default:
        return {
          bgGradient: 'from-gray-400 to-gray-500',
          bgLight: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          glowClass: '',
          hexColor: '#6b7280',
          icon: FiInfo,
          label: 'UNKNOWN',
          emoji: '?'
        };
    }
  };

  const styles = getRiskStyles();
  const Icon = styles.icon;

  // Calculate meter fill percentage (max at 10 points for visual)
  const meterPercentage = Math.min((score / 10) * 100, 100);

  return (
    <div className={`${styles.bgLight} ${styles.borderColor} border-2 rounded-2xl shadow-xl animate-scaleIn overflow-hidden`}>
      {/* Header with Gradient and Icon */}
      <div className={`flex items-center justify-center py-8 bg-gradient-to-r ${styles.bgGradient} text-white relative overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full filter blur-2xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white rounded-full filter blur-2xl animate-float" style={{ animationDelay: '-1.5s' }} />
        </div>
        
        <div className={`relative ${animationComplete ? styles.glowClass : ''} rounded-full p-5 bg-white/20 backdrop-blur-sm transition-all duration-500`}>
          <Icon className="w-14 h-14" />
        </div>
      </div>

      <div className="p-6">
        {/* Risk Label */}
        <div className="text-center mb-6">
          <span className={`text-4xl font-bold ${styles.textColor}`}>
            {styles.emoji} {styles.label}
          </span>
          <p className="text-gray-600 mt-2 text-lg">{riskMessage}</p>
        </div>

        {/* Animated Gauge */}
        <div className="flex justify-center mb-6">
          <AnimatedGauge percentage={meterPercentage} color={styles.hexColor} />
        </div>

        {/* Target Entity Display */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Checked Entity</p>
          <p className="font-mono text-lg font-semibold text-gray-800 break-all">{targetEntity}</p>
        </div>

        {/* Score Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Risk Score</span>
            <span className={`text-2xl font-bold ${styles.textColor}`}>{score} points</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${styles.bgGradient} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${animationComplete ? meterPercentage : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Safe (0)</span>
            <span>Suspicious (1-5)</span>
            <span>High Risk (&gt;5)</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold gradient-text">{totalReports}</p>
            <p className="text-sm text-gray-500">Total Reports</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold gradient-text">{score}</p>
            <p className="text-sm text-gray-500">Crowd Score</p>
          </div>
        </div>

        {/* Report Details (if any) */}
        {reportDetails && reportDetails.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Recent Reports</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reportDetails.slice(0, 5).map((report, index) => (
                <div key={index} className="bg-white rounded-xl p-3 border border-gray-200 flex justify-between items-center text-sm hover:bg-gray-50 transition-colors">
                  <span className={`font-medium ${report.category === 'Phishing' || report.category === 'Identity Theft' ? 'text-red-600' : 'text-gray-700'}`}>
                    {report.category}
                  </span>
                  <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-full text-xs">
                    +{report.pointsAdded} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(onBlock || onMarkSafe) && (
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {onBlock && (
              <button
                onClick={() => onBlock(targetEntity)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                <FiXCircle className="w-5 h-5" />
                Block
              </button>
            )}
            {onMarkSafe && (
              <button
                onClick={() => onMarkSafe(targetEntity)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                <FiCheckCircle className="w-5 h-5" />
                Mark Safe
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Risk assessment based on community reports. Always verify independently.
        </p>
      </div>
    </div>
  );
}
