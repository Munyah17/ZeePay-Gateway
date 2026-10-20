'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; business: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }

      const userData = localStorage.getItem('zeepay_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }

    fetchDashboardStats();
  }, [router]);

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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zeepay_authed');
      localStorage.removeItem('zeepay_user');
    }
    router.push('/');
  };

  return (
    <div>
      <main>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-sm font-semibold text-gray-900">Good afternoon, {user?.name?.split(' ')[0] || 'John'} 👋</h1>
              <p className="text-xs text-gray-600 mt-1">Here's what's happening with your payments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="border border-gray-200 rounded p-4">
                <p className="text-xs text-gray-600">Total volume</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">$12,480</p>
                <p className="text-xs text-gray-500 mt-1">↑ 12.4% vs previous period</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-xs text-gray-600">Successful payments</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">142</p>
                <p className="text-xs text-gray-500 mt-1">↑ 18.2% vs previous period</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-xs text-gray-600">Pending payments</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">5</p>
                <p className="text-xs text-gray-500 mt-1">↓ 50% vs previous period</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-xs text-gray-600">Failed payments</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">2</p>
                <p className="text-xs text-gray-500 mt-1">↓ 3.1% vs previous period</p>
              </div>
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
                      <td className="px-4 py-3 text-xs text-gray-500">2 min ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900">INV-1041</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$25.00</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-green-700">Succeeded</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">5 min ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900">INV-1040</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$20.00</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-yellow-700">Pending</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">12 min ago</td>
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
