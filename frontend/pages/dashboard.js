// FILE: pages/dashboard.js
// Main Dashboard - Fraud Reporting and Risk Checking Interface

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import FraudReportForm from '../components/FraudReportForm';
import RiskChecker from '../components/RiskChecker';
import { actionsAPI, fraudAPI, statsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  FiSearch, 
  FiAlertTriangle, 
  FiFileText, 
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiClock
} from 'react-icons/fi';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('check'); // 'check' | 'report' | 'history'
  const [stats, setStats] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);

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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '-' : stats?.totalReports?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500">Total Reports</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '-' : stats?.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500">Users</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '-' : stats?.recentReports?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500">Last 30 Days</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.kycCompleted ? '✓' : '!'}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.kycCompleted ? 'Verified' : 'Unverified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
