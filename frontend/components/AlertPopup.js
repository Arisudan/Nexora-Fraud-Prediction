// FILE: components/AlertPopup.js
// Real-time Alert Popup Component for Fraud/Spam Detection

import { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, FiPhone, FiMessageSquare, FiMail, FiCreditCard,
  FiX, FiShield, FiAlertCircle, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { alertsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const AlertPopup = ({ alerts, onDismiss, onAction }) => {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setCurrentAlert(alerts[0]);
      // Trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 300);
    }
  }, [alerts]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'call': return FiPhone;
      case 'sms': return FiMessageSquare;
      case 'email': return FiMail;
      case 'upi': return FiCreditCard;
      default: return FiAlertTriangle;
    }
  };

  const getAlertColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return {
          bg: 'bg-red-600',
          bgLight: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          icon: 'text-red-600'
        };
      case 'high':
        return {
          bg: 'bg-orange-600',
          bgLight: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-700',
          icon: 'text-orange-600'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          icon: 'text-yellow-600'
        };
      default:
        return {
          bg: 'bg-blue-600',
          bgLight: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: 'text-blue-600'
        };
    }
  };

  const handleAction = async (action) => {
    if (!currentAlert) return;
    
    try {
      await alertsAPI.acknowledge(currentAlert._id, action);
      if (onAction) {
        onAction(currentAlert._id, action);
      }
      toast.success(
        action === 'blocked' ? '🚫 Blocked successfully' :
        action === 'allowed' ? '✓ Allowed through' :
        action === 'reported' ? '📝 Reported for review' :
        'Alert acknowledged'
      );
    } catch (error) {
      toast.error('Failed to process action');
    }
  };

  if (!currentAlert) return null;

  const Icon = getAlertIcon(currentAlert.alertType);
  const colors = getAlertColor(currentAlert.riskLevel);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onDismiss && onDismiss(currentAlert._id)}
      />
      
      {/* Alert Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 ${colors.border}`}>
          {/* Alert Header */}
          <div className={`${colors.bg} px-6 py-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {currentAlert.alertType === 'call' && '⚠️ Incoming Call Alert'}
                    {currentAlert.alertType === 'sms' && '⚠️ SMS Alert'}
                    {currentAlert.alertType === 'email' && '⚠️ Email Alert'}
                    {currentAlert.alertType === 'upi' && '⚠️ UPI Payment Alert'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {currentAlert.riskLevel.toUpperCase()} RISK DETECTED
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDismiss && onDismiss(currentAlert._id)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

              {/* Alert Body */}
              <div className="p-6">
                {/* Risk Indicator */}
                <div className={`${colors.bgLight} rounded-xl p-4 mb-4 border ${colors.border}`}>
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className={`w-6 h-6 ${colors.icon}`} />
                    <div className="flex-1">
                      <p className={`font-semibold ${colors.text}`}>
                        Risk Score: {currentAlert.riskScore || 0}%
                      </p>
                      <p className="text-gray-600 text-sm">
                        Flagged as potentially dangerous
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${colors.bg} text-white text-sm font-bold`}>
                      {(currentAlert.riskLevel || 'medium').toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Entity Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">From</span>
                    <span className="font-mono font-semibold text-gray-900">{currentAlert.fromEntity}</span>
                  </div>
                  {currentAlert.category && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Category</span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        {currentAlert.category}
                      </span>
                    </div>
                  )}
                  {currentAlert.message && (
                    <div className="py-2">
                      <span className="text-gray-500 text-sm block mb-1">Details</span>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        {currentAlert.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ Warning:</strong> This {currentAlert.alertType} has been flagged as potentially fraudulent. 
                    Exercise caution before proceeding.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleAction('blocked')}
                    className="flex flex-col items-center gap-1 py-3 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                  >
                    <FiXCircle className="w-6 h-6" />
                    <span className="text-sm font-medium">Block</span>
                  </button>
                  <button
                    onClick={() => handleAction('allowed')}
                    className="flex flex-col items-center gap-1 py-3 px-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
                  >
                    <FiCheckCircle className="w-6 h-6" />
                    <span className="text-sm font-medium">Allow</span>
                  </button>
                  <button
                    onClick={() => handleAction('reported')}
                    className="flex flex-col items-center gap-1 py-3 px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                  >
                    <FiShield className="w-6 h-6" />
                    <span className="text-sm font-medium">Report</span>
                  </button>
                </div>
              </div>

              {/* Alert Counter */}
              {alerts && alerts.length > 1 && (
                <div className="px-6 pb-4">
                  <p className="text-center text-gray-500 text-sm">
                    {alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''} pending
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
  );
};

export default AlertPopup;
