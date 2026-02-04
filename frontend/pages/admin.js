// pages/admin.js
// Admin Dashboard Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [userPagination, setUserPagination] = useState(null);
  const [reportPagination, setReportPagination] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      setError('Failed to load admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setUserPagination(data.data.pagination);
        setUserPage(page);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const fetchReports = async (page = 1) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data.reports);
        setReportPagination(data.data.pagination);
        setReportPage(page);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unlockAccount: true }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchUsers(userPage);
        fetchStats();
      }
    } catch (err) {
      console.error('Unlock user error:', err);
    }
  };

  const handleDeleteReport = async (reportId, permanent = false) => {
    if (!confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'deactivate'} this report?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/${reportId}?permanent=${permanent}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchReports(reportPage);
        fetchStats();
      }
    } catch (err) {
      console.error('Delete report error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    } else if (activeTab === 'reports' && reports.length === 0) {
      fetchReports();
    }
  }, [activeTab]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-purple-200">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-red-500/10 p-8 rounded-lg">
          <p className="text-red-400 text-lg">{error}</p>
          <Link href="/dashboard" className="text-purple-300 hover:text-white mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | Nexora Fraud Predictor</title>
        <meta name="description" content="Admin dashboard for Nexora Fraud Predictor" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-purple-300 hover:text-white">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">🛡️ Admin Panel</h1>
            </div>
            <div className="text-purple-300 text-sm">
              Logged in as: <span className="text-white">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            {['overview', 'users', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <div className="text-purple-300 text-sm mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-white">{stats.users.total}</div>
                  <div className="text-green-400 text-sm mt-2">+{stats.users.newThisMonth} this month</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <div className="text-purple-300 text-sm mb-1">Verified Users</div>
                  <div className="text-3xl font-bold text-green-400">{stats.users.verified}</div>
                  <div className="text-yellow-400 text-sm mt-2">{stats.users.unverified} unverified</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <div className="text-purple-300 text-sm mb-1">Total Reports</div>
                  <div className="text-3xl font-bold text-white">{stats.reports.total}</div>
                  <div className="text-blue-400 text-sm mt-2">{stats.reports.active} active</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <div className="text-purple-300 text-sm mb-1">Risk Checks Today</div>
                  <div className="text-3xl font-bold text-cyan-400">{stats.activity.riskChecksToday}</div>
                  <div className="text-purple-300 text-sm mt-2">queries performed</div>
                </div>
              </div>

              {/* Security Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">🔒 Security Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-300">Locked Accounts</span>
                      <span className="text-yellow-400">{stats.users.lockedAccounts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">Blacklisted Tokens</span>
                      <span className="text-red-400">{stats.security.blacklistedTokens}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Reports by Category</h3>
                  <div className="space-y-2">
                    {stats.reports.byCategory.slice(0, 5).map((cat) => (
                      <div key={cat._id} className="flex justify-between">
                        <span className="text-purple-300">{cat._id}</span>
                        <span className="text-white">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📋 Recent Activity</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          activity.actionType === 'login' ? 'bg-green-500/20 text-green-400' :
                          activity.actionType === 'register' ? 'bg-blue-500/20 text-blue-400' :
                          activity.actionType === 'check_risk' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {activity.actionType}
                        </span>
                        <span className="text-purple-300 text-sm">
                          {activity.userId?.email || activity.targetEntity || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">User</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Role</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Verified</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Status</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Joined</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="text-white">{u.name}</div>
                          <div className="text-purple-400 text-sm">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            u.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.isEmailVerified ? (
                            <span className="text-green-400">✓ Yes</span>
                          ) : (
                            <span className="text-yellow-400">✗ No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.lockUntil && new Date(u.lockUntil) > new Date() ? (
                            <span className="text-red-400">🔒 Locked</span>
                          ) : (
                            <span className="text-green-400">✓ Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.lockUntil && new Date(u.lockUntil) > new Date() && (
                            <button
                              onClick={() => handleUnlockUser(u._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                            >
                              Unlock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {userPagination && (
                <div className="flex items-center justify-between px-4 py-3 bg-black/10">
                  <div className="text-purple-300 text-sm">
                    Page {userPagination.page} of {userPagination.pages} ({userPagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchUsers(userPage - 1)}
                      disabled={userPage <= 1}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchUsers(userPage + 1)}
                      disabled={!userPagination.hasMore}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Entity</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Type</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Category</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Reporter</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Date</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Status</th>
                      <th className="px-4 py-3 text-left text-purple-300 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r._id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white font-mono text-sm">{r.targetEntity}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            {r.entityType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{r.category}</td>
                        <td className="px-4 py-3 text-purple-300 text-sm">
                          {r.reporterId?.email || 'Anonymous'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {r.isActive ? (
                            <span className="text-green-400">Active</span>
                          ) : (
                            <span className="text-gray-400">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {r.isActive && (
                            <button
                              onClick={() => handleDeleteReport(r._id, false)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(r._id, true)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {reportPagination && (
                <div className="flex items-center justify-between px-4 py-3 bg-black/10">
                  <div className="text-purple-300 text-sm">
                    Page {reportPagination.page} of {reportPagination.pages} ({reportPagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchReports(reportPage - 1)}
                      disabled={reportPage <= 1}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchReports(reportPage + 1)}
                      disabled={!reportPagination.hasMore}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
