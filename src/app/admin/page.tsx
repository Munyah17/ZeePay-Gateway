'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('zeepay_authed');
    localStorage.removeItem('zeepay_user');
    router.push('/');
  };

  const StatCard = ({ title, value, subtitle, down = false }: { title: string; value: string | number; subtitle?: string; down?: boolean }) => (
    <div className="border border-gray-200 rounded p-4">
      <p className="text-xs text-gray-600">{title}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${down ? 'text-red-600' : 'text-green-600'}`}>{subtitle}</p>}
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
                <Link href="/admin" className="text-xs text-gray-900">Platform overview</Link>
                <Link href="/admin/merchants" className="text-xs text-gray-600 hover:text-gray-900">Merchants</Link>
                <Link href="/admin/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">Providers</Link>
                <Link href="/admin/settlements" className="text-xs text-gray-600 hover:text-gray-900">Settlements</Link>
                <Link href="/admin/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">admin@zeepay.co.zw</span>
              <button onClick={handleLogout} className="text-xs text-gray-600 hover:text-gray-900">
                Sign out
              </button>
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
              <h1 className="text-sm font-semibold text-gray-900">Platform overview</h1>
              <p className="text-xs text-gray-600 mt-1">Monitor payment activity, merchants, and provider health</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total volume"
                value="$248,030"
                subtitle="↑ 12.4% vs previous period"
              />
              <StatCard
                title="Active merchants"
                value="48"
                subtitle="↑ 8 this month"
              />
              <StatCard
                title="Payment success rate"
                value="98.7%"
                subtitle="↑ 0.8 percentage points"
              />
              <StatCard
                title="Open issues"
                value="12"
                subtitle="4 require attention"
                down
              />
            </div>

            <div className="border border-gray-200 rounded p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-semibold text-gray-900">Provider health</h2>
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'EcoCash', status: 'Connected', success: '98.6%' },
                  { name: 'InnBucks', status: 'Connected', success: '97.8%' },
                  { name: 'Omari', status: 'Connected', success: '96.9%' },
                  { name: 'Visa & Mastercard', status: 'Sandbox', success: '99.1%' },
                ].map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-700">
                        {provider.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{provider.name}</p>
                        <p className="text-xs text-gray-500">{provider.success} successful</p>
                      </div>
                    </div>
                    <span className={`text-xs ${provider.status === 'Connected' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {provider.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-semibold text-gray-900">Recent platform transactions</h2>
                <Link href="/admin/transactions" className="text-xs text-gray-600 hover:text-gray-900">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">pay_8x2k91</td>
                      <td className="px-4 py-3 text-xs text-gray-900">Acme Solutions</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$10.00</td>
                      <td className="px-4 py-3"><span className="text-xs text-green-700">Succeeded</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">2 min ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">pay_7m4422</td>
                      <td className="px-4 py-3 text-xs text-gray-900">Acme Solutions</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$50.00</td>
                      <td className="px-4 py-3"><span className="text-xs text-green-700">Succeeded</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">5 min ago</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">pay_9q0678</td>
                      <td className="px-4 py-3 text-xs text-gray-900">TechGlobal Ltd</td>
                      <td className="px-4 py-3 text-xs text-gray-900">$15.00</td>
                      <td className="px-4 py-3"><span className="text-xs text-red-700">Failed</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">32 min ago</td>
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
