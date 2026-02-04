// FILE: pages/settings.js
// User Settings Page - Protection Management

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { protectionAPI, alertsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiShield, FiPhone, FiMessageSquare, FiMail,
  FiSave, FiLoader, FiCheck, FiAlertTriangle, FiBell, FiVolume2, FiVolumeX,
  FiActivity, FiClock, FiTrash2
} from 'react-icons/fi';

export default function Settings() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('protection');
  
  const [settings, setSettings] = useState({
    callProtection: { enabled: false, registeredPhone: '', alertMode: 'popup' },
    smsProtection: { enabled: false, registeredPhone: '', alertMode: 'popup' },
    emailProtection: { enabled: false, registeredEmail: '', alertMode: 'popup' }
  });
  
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchAlertHistory();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      const response = await protectionAPI.getSettings();
      if (response.success) {
        setSettings(response.data.protectionSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const response = await alertsAPI.getHistory(50);
      if (response.success) {
        setAlertHistory(response.data?.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      setAlertHistory([]);
    }
  };

  const handleToggle = (type) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  const handleInputChange = (type, field, value) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await protectionAPI.updateSettings(settings);
      if (response.success) {
        toast.success('Protection settings saved successfully!');
        // Update user context
        if (updateUser && response.data.user) {
          updateUser(response.data.user);
        }
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const protectionOptions = [
    {
      id: 'callProtection',
      icon: FiPhone,
      title: 'Call Protection',
      description: 'Receive instant alerts before spam/fraud calls reach you',
      color: 'blue',
      bgEnabled: 'bg-blue-50 border-blue-500',
      bgIcon: 'bg-blue-100',
      textIcon: 'text-blue-600',
      field: 'registeredPhone',
      placeholder: 'Phone number (e.g., 9876543210)',
      inputType: 'tel'
    },
    {
      id: 'smsProtection',
      icon: FiMessageSquare,
      title: 'SMS Protection',
      description: 'Get notified before spam/scam messages arrive',
      color: 'green',
      bgEnabled: 'bg-green-50 border-green-500',
      bgIcon: 'bg-green-100',
      textIcon: 'text-green-600',
      field: 'registeredPhone',
      placeholder: 'Phone number for SMS alerts',
      inputType: 'tel'
    },
    {
      id: 'emailProtection',
      icon: FiMail,
      title: 'Email Protection',
      description: 'Alerts before phishing emails reach your inbox',
      color: 'purple',
      bgEnabled: 'bg-purple-50 border-purple-500',
      bgIcon: 'bg-purple-100',
      textIcon: 'text-purple-600',
      field: 'registeredEmail',
      placeholder: 'Email address to protect',
      inputType: 'email'
    }
  ];

  const alertModes = [
    { value: 'popup', label: 'Popup Alert', icon: FiBell, description: 'Show popup notification' },
    { value: 'silent', label: 'Silent', icon: FiVolumeX, description: 'Log only, no popup' },
    { value: 'block', label: 'Auto Block', icon: FiShield, description: 'Automatically block' }
  ];

  const tabs = [
    { id: 'protection', label: 'Protection Settings', icon: FiShield },
    { id: 'history', label: 'Alert History', icon: FiActivity }
  ];

  const enabledCount = Object.values(settings).filter(s => s.enabled).length;

  if (authLoading || loading) {
    return (
      <Layout title="Settings">
        <div className="min-h-[60vh] flex items-center justify-center">
          <FiLoader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings - Nexora Fraud Predictor">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FiSettings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your protection preferences</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-md border border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'protection' && (
            <>
              {/* Protection Summary */}
              <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                </div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Protection Status</h2>
                    <p className="text-white/80 mt-1">
                      {enabledCount === 0 
                        ? 'No protection enabled - enable at least one to stay safe'
                        : `${enabledCount} protection${enabledCount > 1 ? 's' : ''} active`
                      }
                    </p>
                  </div>
                  <div className="text-5xl font-bold">
                    {enabledCount}/3
                  </div>
                </div>
                
                {enabledCount > 0 && (
                  <div className="relative flex gap-2 mt-4 flex-wrap">
                    {protectionOptions.filter(o => settings[o.id]?.enabled).map(option => (
                      <span key={option.id} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                        ✓ {option.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Protection Options */}
              <div className="space-y-4">
                {protectionOptions.map((option) => {
                  const Icon = option.icon;
                  const isEnabled = settings[option.id]?.enabled;
                  const fieldValue = settings[option.id]?.[option.field] || '';
                  const alertMode = settings[option.id]?.alertMode || 'popup';
                  
                  return (
                    <div
                      key={option.id}
                      className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                        isEnabled 
                          ? option.bgEnabled
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggle(option.id)}
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
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          
                          {/* Settings when enabled */}
                          {isEnabled && (
                            <div className="mt-4 space-y-4">
                              {/* Registered Entity */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Protected {option.field === 'registeredEmail' ? 'Email' : 'Phone'}
                                </label>
                                <input
                                  type={option.inputType}
                                  value={fieldValue}
                                  onChange={(e) => handleInputChange(option.id, option.field, e.target.value)}
                                  placeholder={option.placeholder}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                              
                              {/* Alert Mode */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                  Alert Mode
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {alertModes.map((mode) => {
                                    const ModeIcon = mode.icon;
                                    const isSelected = alertMode === mode.value;
                                    return (
                                      <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => handleInputChange(option.id, 'alertMode', mode.value)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                      >
                                        <ModeIcon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{mode.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900">Alert History</h2>
                <p className="text-gray-600 text-sm mt-1">Your recent fraud/spam alerts</p>
              </div>
              
              {!alertHistory || alertHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <FiShield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">No Alert History</h3>
                  <p className="text-gray-500 mt-1">You haven't received any alerts yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {alertHistory.map((alert) => {
                    const option = protectionOptions.find(o => 
                      o.id.toLowerCase().includes(alert.alertType)
                    );
                    const Icon = option?.icon || FiAlertTriangle;
                    
                    return (
                      <div key={alert._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            option?.bgIcon || 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${option?.textIcon || 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {alert.alertType.toUpperCase()} Alert
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                alert.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                                alert.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                                alert.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {alert.riskLevel.toUpperCase()}
                              </span>
                              {alert.userAction && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  alert.userAction === 'blocked' ? 'bg-red-100 text-red-700' :
                                  alert.userAction === 'allowed' ? 'bg-green-100 text-green-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {alert.userAction.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              From: <span className="font-mono">{alert.fromEntity}</span>
                              {alert.category && ` • ${alert.category}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <FiClock className="w-4 h-4" />
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
