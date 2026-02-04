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
      <div className="card text-center py-12">
        <div className="spinner w-16 h-16 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Analyzing with Crowd Intelligence...</p>
        <p className="text-gray-400 text-sm mt-2">Checking fraud reports from our community</p>
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
          bgGradient: 'from-green-400 to-green-600',
          bgLight: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconBg: 'bg-green-100',
          shadow: 'shadow-glow-green',
          icon: FiShield,
          label: 'SAFE',
          emoji: '✓'
        };
      case 'suspicious':
        return {
          bgGradient: 'from-yellow-400 to-yellow-600',
          bgLight: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconBg: 'bg-yellow-100',
          shadow: 'shadow-glow-yellow',
          icon: FiAlertTriangle,
          label: 'SUSPICIOUS',
          emoji: '⚠'
        };
      case 'high_risk':
        return {
          bgGradient: 'from-red-400 to-red-600',
          bgLight: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconBg: 'bg-red-100',
          shadow: 'shadow-glow-red',
          icon: FiAlertOctagon,
          label: 'HIGH RISK / UNSAFE',
          emoji: '🚨'
        };
      default:
        return {
          bgGradient: 'from-gray-400 to-gray-600',
          bgLight: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          shadow: '',
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
    <div className={`card ${styles.bgLight} ${styles.borderColor} border-2 animate-scaleIn overflow-hidden`}>
      {/* Header with Icon */}
      <div className={`flex items-center justify-center py-6 -mx-6 -mt-6 mb-6 bg-gradient-to-r ${styles.bgGradient} text-white`}>
        <div className={`${animationComplete ? styles.shadow : ''} rounded-full p-4 bg-white/20 backdrop-blur`}>
          <Icon className="w-12 h-12" />
        </div>
      </div>

      {/* Risk Label */}
      <div className="text-center mb-6">
        <span className={`text-4xl font-bold ${styles.textColor}`}>
          {styles.emoji} {styles.label}
        </span>
        <p className="text-gray-600 mt-2 text-lg">{riskMessage}</p>
      </div>

      {/* Target Entity Display */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <p className="text-sm text-gray-500 mb-1">Checked Entity</p>
        <p className="font-mono text-lg font-semibold text-gray-800 break-all">{targetEntity}</p>
      </div>

      {/* Score Meter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Risk Score</span>
          <span className={`text-2xl font-bold ${styles.textColor}`}>{score} points</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${styles.bgGradient} transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${animationComplete ? meterPercentage : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Safe (0)</span>
          <span>Suspicious (1-5)</span>
          <span>High Risk (&gt;5)</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <p className="text-3xl font-bold text-gray-800">{totalReports}</p>
          <p className="text-sm text-gray-500">Total Reports</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <p className="text-3xl font-bold text-gray-800">{score}</p>
          <p className="text-sm text-gray-500">Crowd Score</p>
        </div>
      </div>

      {/* Report Details (if any) */}
      {reportDetails && reportDetails.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Recent Reports</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {reportDetails.slice(0, 5).map((report, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex justify-between items-center text-sm">
                <span className={`font-medium ${report.category === 'Phishing' || report.category === 'Identity Theft' ? 'text-red-600' : 'text-gray-700'}`}>
                  {report.category}
                </span>
                <span className="text-gray-400">
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
              className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              <FiXCircle className="w-5 h-5" />
              Block
            </button>
          )}
          {onMarkSafe && (
            <button
              onClick={() => onMarkSafe(targetEntity)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-3 px-4 rounded-lg transition-colors"
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
  );
}
