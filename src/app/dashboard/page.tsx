'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Mock data for now - in production, this would fetch from the API
      setStats({
        totalPayments: 150,
        successfulPayments: 142,
        pendingPayments: 5,
        failedPayments: 3,
        totalAmount: 15250.00,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ZeePay Dashboard</h1>
              <p className="text-gray-600 text-sm">Manage your payments</p>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="text-blue-600 font-medium">Overview</Link>
              <Link href="/dashboard/transactions" className="text-gray-600 hover:text-gray-900">Transactions</Link>
              <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
              <Link href="/dashboard/simulator" className="text-gray-600 hover:text-gray-900">Simulator</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Payments"
                value={stats.totalPayments}
                subtitle="All time"
                color="text-gray-900"
              />
              <StatCard
                title="Successful"
                value={stats.successfulPayments}
                subtitle={`${((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)}% success rate`}
                color="text-green-600"
              />
              <StatCard
                title="Pending"
                value={stats.pendingPayments}
                subtitle="Awaiting completion"
                color="text-yellow-600"
              />
              <StatCard
                title="Total Amount"
                value={`$${stats.totalAmount.toLocaleString()}`}
                subtitle="USD"
                color="text-blue-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/transactions"
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-medium text-blue-900">View Transactions</h3>
                  <p className="text-sm text-blue-700 mt-1">Browse all payment transactions</p>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
                >
                  <h3 className="font-medium text-green-900">API Keys</h3>
                  <p className="text-sm text-green-700 mt-1">Manage your API credentials</p>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                >
                  <h3 className="font-medium text-purple-900">Webhooks</h3>
                  <p className="text-sm text-purple-700 mt-1">Configure webhook endpoints</p>
                </Link>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <Link href="/dashboard/transactions" className="text-blue-600 hover:text-blue-700 text-sm">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">INV-1042</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$10.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Succeeded
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 19, 2026</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">INV-1041</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$25.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 19, 2026</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">INV-1040</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$15.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Succeeded
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oct 18, 2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
