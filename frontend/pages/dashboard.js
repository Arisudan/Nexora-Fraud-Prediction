// FILE: pages/dashboard.js
// Main Dashboard - Fraud Reporting, Risk Checking & Protection Interface
// ⚡ Real-time enabled with WebSocket

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import FraudReportForm from '../components/FraudReportForm';
import RiskChecker from '../components/RiskChecker';
import AlertPopup from '../components/AlertPopup';
import QuickCheckWidget from '../components/QuickCheckWidget';
import { actionsAPI, fraudAPI, statsAPI, alertsAPI, protectionAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  FiSearch, 
  FiAlertTriangle, 
  FiFileText, 
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiPhone,
  FiMessageSquare,
  FiMail,
  FiSettings,
  FiBell,
  FiCheck,
  FiX,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isConnected, pendingAlerts: socketAlerts, connect, acknowledgeAlert } = useSocket();
  const [activeTab, setActiveTab] = useState('check'); // 'check' | 'report' | 'history'
  const [stats, setStats] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [protectionSettings, setProtectionSettings] = useState(null);
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  // Use socket alerts for real-time, fall back to polling
  const pendingAlerts = socketAlerts;

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = sessionStorage.getItem('token');
      if (token) {
        connect(token);
      }
    }
  }, [isAuthenticated, connect]);

  // Show alert popup when new alerts arrive
  useEffect(() => {
    if (pendingAlerts.length > 0) {
      setShowAlertPopup(true);
    }
  }, [pendingAlerts]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsAPI.getOverview();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  // Fetch protection settings
  useEffect(() => {
    const fetchProtectionSettings = async () => {
      try {
        const response = await protectionAPI.getSettings();
        if (response.success) {
          setProtectionSettings(response.data.protectionSettings);
        }
      } catch (error) {
        console.error('Failed to fetch protection settings:', error);
      }
    };

    if (isAuthenticated) {
      fetchProtectionSettings();
    }
  }, [isAuthenticated]);

  // Handle alert actions (uses WebSocket)
  const handleAlertAction = async (alertId, action) => {
    try {
      await alertsAPI.acknowledge(alertId, action);
      acknowledgeAlert(alertId, action);
      
      if (pendingAlerts.length <= 1) {
        setShowAlertPopup(false);
      }
    } catch (error) {
      toast.error('Failed to process action');
    }
  };

  const handleAlertDismiss = (alertId) => {
    acknowledgeAlert(alertId, 'dismissed');
    if (pendingAlerts.length <= 1) {
      setShowAlertPopup(false);
    }
  };

  // Fetch user's reports when history tab is active
  useEffect(() => {
    const fetchMyReports = async () => {
      if (activeTab !== 'history') return;
      
      setLoadingReports(true);
      try {
        const response = await fraudAPI.getMyReports(1, 20);
        if (response.success) {
          setMyReports(response.data.reports);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };

    if (isAuthenticated) {
      fetchMyReports();
    }
  }, [activeTab, isAuthenticated]);

  // Handle block entity
  const handleBlockEntity = async (entity, entityType) => {
    try {
      const response = await actionsAPI.blockEntity(entity, entityType);
      if (response.success) {
        toast.success('Entity blocked successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to block entity');
    }
  };

  // Handle mark safe
  const handleMarkSafe = async (entity, entityType) => {
    try {
      const response = await actionsAPI.markSafe(entity, entityType);
      if (response.success) {
        toast.success('Entity marked as safe!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark entity as safe');
    }
  };

  // Handle successful report submission
  const handleReportSuccess = (report) => {
    setMyReports(prev => [report, ...prev]);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <Layout title="Dashboard">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="spinner w-12 h-12"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'check', label: 'Check Risk', icon: FiSearch },
    { id: 'report', label: 'Report Fraud', icon: FiAlertTriangle },
    { id: 'history', label: 'My Reports', icon: FiFileText },
  ];

  return (
    <Layout title="Dashboard">
      {/* Alert Popup for Real-time Protection */}
      {showAlertPopup && (
        <AlertPopup 
          alerts={pendingAlerts}
          onDismiss={handleAlertDismiss}
          onAction={handleAlertAction}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Check suspicious contacts or report fraud to protect the community.
          </p>
        </div>

        {/* Protection Status Card */}
        {protectionSettings && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl animate-pulse-glow">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full filter blur-3xl transform translate-x-20 -translate-y-20 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/10 rounded-full filter blur-3xl transform -translate-x-20 translate-y-20 animate-float" style={{ animationDelay: '-2s' }}></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <FiShield className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Protection Status</h2>
                    <p className="text-white/80 text-sm flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          <FiWifi className="w-4 h-4 text-emerald-300" />
                          <span className="text-emerald-300">Real-time active</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                          <FiWifiOff className="w-4 h-4 text-yellow-300" />
                          <span className="text-yellow-300">Connecting...</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Link href="/settings">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all text-sm font-medium hover:scale-105">
                    <FiSettings className="w-4 h-4" />
                    Manage
                  </button>
                </Link>
              </div>

              {/* Protection Items */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl backdrop-blur-sm transition-all hover:scale-105 ${
                  protectionSettings.callProtection?.enabled 
                    ? 'bg-emerald-500/30 border border-emerald-400/50 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500/30 border border-red-400/50 shadow-lg shadow-red-500/20'
                }`}>
                  <FiPhone className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">Call</p>
                    <p className={`text-xs ${protectionSettings.callProtection?.enabled ? 'text-emerald-200' : 'text-red-200'}`}>
                      {protectionSettings.callProtection?.enabled ? '✓ Active' : '✗ Inactive'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl backdrop-blur-sm transition-all hover:scale-105 ${
                  protectionSettings.smsProtection?.enabled 
                    ? 'bg-emerald-500/30 border border-emerald-400/50 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500/30 border border-red-400/50 shadow-lg shadow-red-500/20'
                }`}>
                  <FiMessageSquare className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">SMS</p>
                    <p className={`text-xs ${protectionSettings.smsProtection?.enabled ? 'text-emerald-200' : 'text-red-200'}`}>
                      {protectionSettings.smsProtection?.enabled ? '✓ Active' : '✗ Inactive'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl backdrop-blur-sm transition-all hover:scale-105 ${
                  protectionSettings.emailProtection?.enabled 
                    ? 'bg-emerald-500/30 border border-emerald-400/50 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500/30 border border-red-400/50 shadow-lg shadow-red-500/20'
                }`}>
                  <FiMail className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">Email</p>
                    <p className={`text-xs ${protectionSettings.emailProtection?.enabled ? 'text-emerald-200' : 'text-red-200'}`}>
                      {protectionSettings.emailProtection?.enabled ? '✓ Active' : '✗ Inactive'}
                    </p>
                  </div>
                </div>
              </div>

              {/* No Protection Warning */}
              {!protectionSettings.callProtection?.enabled && 
               !protectionSettings.smsProtection?.enabled &&
               !protectionSettings.emailProtection?.enabled && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 flex items-center gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-300" />
                  <p className="text-sm text-yellow-100">
                    No protection enabled. <Link href="/settings" className="underline font-medium">Enable now</Link> to get real-time alerts.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ⚡ QUICK CHECK WIDGET - Instant Protection */}
        <div className="mb-8">
          <QuickCheckWidget />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <FiFileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {loadingStats ? <span className="skeleton w-12 h-8 block rounded"></span> : stats?.totalReports?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 font-medium">Total Reports</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <FiUsers className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {loadingStats ? <span className="skeleton w-12 h-8 block rounded"></span> : stats?.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 font-medium">Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {loadingStats ? <span className="skeleton w-12 h-8 block rounded"></span> : stats?.recentReports?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 font-medium">Last 30 Days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <FiShield className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {loadingStats ? <span className="skeleton w-12 h-8 block rounded"></span> : stats?.blockedEntities?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 font-medium">Blocked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-purple-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {/* Check Risk Tab */}
          {activeTab === 'check' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RiskChecker 
                  onBlock={handleBlockEntity}
                  onMarkSafe={handleMarkSafe}
                />
              </div>
              <div className="space-y-6">
                {/* Quick Tips */}
                <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100">
                  <h3 className="font-bold text-primary-900 mb-4">💡 Quick Tips</h3>
                  <ul className="space-y-3 text-sm text-primary-800">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Always verify unknown callers before sharing personal info</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Check UPI IDs before sending money to new contacts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Report suspicious activity to help others stay safe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>High-risk entities have multiple community reports</span>
                    </li>
                  </ul>
                </div>

                {/* Top Categories */}
                {stats?.topCategories?.length > 0 && (
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4">📊 Top Fraud Categories</h3>
                    <div className="space-y-3">
                      {stats.topCategories.map((cat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{cat.category}</span>
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                            {cat.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Fraud Tab */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <FraudReportForm onSuccess={handleReportSuccess} />
              </div>
              <div className="space-y-6">
                {/* Reporting Guidelines */}
                <div className="card bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                  <h3 className="font-bold text-red-900 mb-4">⚠️ Reporting Guidelines</h3>
                  <ul className="space-y-3 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Only report genuine fraud attempts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Provide accurate phone/email/UPI details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Include as much evidence as possible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>False reports may result in account suspension</span>
                    </li>
                  </ul>
                </div>

                {/* Why Report */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">🤝 Why Report?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Your report helps protect thousands of other users from falling victim to the same scam.
                  </p>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-green-700 font-medium">
                      Together, we've prevented ₹{stats?.totalReports ? (stats.totalReports * 5000).toLocaleString() : '0'}+ in fraud losses!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Reports Tab */}
          {activeTab === 'history' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Submitted Reports</h2>
              
              {loadingReports ? (
                <div className="text-center py-12">
                  <div className="spinner w-10 h-10 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading your reports...</p>
                </div>
              ) : myReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't submitted any fraud reports yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="btn-primary"
                  >
                    Submit Your First Report
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Entity</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReports.map((report, index) => (
                        <tr key={report.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm">{report.targetEntity}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-sm text-gray-600">{report.entityType}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              report.category === 'Phishing' || report.category === 'Identity Theft'
                                ? 'badge-danger'
                                : 'badge-suspicious'
                            }`}>
                              {report.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              report.status === 'verified' ? 'badge-safe' :
                              report.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                              'badge-danger'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <FiClock className="w-4 h-4" />
                              {new Date(report.timestamp).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
