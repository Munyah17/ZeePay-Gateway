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

  const StatCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
    <div className="border border-gray-200 rounded p-4">
      <p className="text-xs text-gray-600">{title}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
              <div className="flex gap-6">
                <Link href="/dashboard" className="text-xs text-gray-900">Overview</Link>
                <Link href="/dashboard/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/dashboard/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
                <Link href="/dashboard/simulator" className="text-xs text-gray-600 hover:text-gray-900">Simulator</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">merchant@example.com</span>
              <Link href="/auth/logout" className="text-xs text-gray-600 hover:text-gray-900">
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-sm font-semibold text-gray-900">Overview</h1>
              <p className="text-xs text-gray-600 mt-1">Payment activity and metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Payments"
                value={stats.totalPayments}
                subtitle="All time"
              />
              <StatCard
                title="Successful"
                value={stats.successfulPayments}
                subtitle={`${((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)}% success`}
              />
              <StatCard
                title="Pending"
                value={stats.pendingPayments}
                subtitle="Awaiting completion"
              />
              <StatCard
                title="Total Amount"
                value={`$${stats.totalAmount.toLocaleString()}`}
                subtitle="USD"
              />
            </div>

            <div className="border border-gray-200 rounded p-6 mb-8">
              <h2 className="text-xs font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/transactions"
                  className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">View Transactions</p>
                  <p className="text-xs text-gray-600 mt-1">Browse all payment transactions</p>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">API Keys</p>
                  <p className="text-xs text-gray-600 mt-1">Manage your API credentials</p>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">Webhooks</p>
                  <p className="text-xs text-gray-600 mt-1">Configure webhook endpoints</p>
                </Link>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-semibold text-gray-900">Recent Transactions</h2>
                <Link href="/dashboard/transactions" className="text-xs text-gray-600 hover:text-gray-900">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900">INV-1042</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$10.00</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-green-700">Succeeded</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">Oct 19, 2026</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900">INV-1041</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$25.00</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-yellow-700">Pending</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">Oct 19, 2026</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900">INV-1040</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$15.00</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-green-700">Succeeded</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">Oct 18, 2026</td>
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
