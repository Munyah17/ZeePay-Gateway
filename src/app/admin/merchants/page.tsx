'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Merchant {
  name: string;
  email: string;
  status: string;
  joined: string;
  volume: number;
}

export default function AdminMerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchMerchants();
  }, [router]);

  const fetchMerchants = async () => {
    try {
      setMerchants([
        { name: 'Acme Solutions', email: 'john@acmesolutions.co.zw', status: 'Active', joined: '17 Oct 2026', volume: 12480 },
        { name: 'TechGlobal Ltd', email: 'payments@techglobal.co.zw', status: 'Active', joined: '15 Oct 2026', volume: 8350 },
        { name: 'BrightApps', email: 'finance@brightapps.co.zw', status: 'Pending review', joined: '14 Oct 2026', volume: 0 },
        { name: 'GreenTech', email: 'hello@greentech.co.zw', status: 'Active', joined: '12 Oct 2026', volume: 4270 },
        { name: 'Digital Hub', email: 'admin@digitalhub.co.zw', status: 'Suspended', joined: '10 Oct 2026', volume: 1200 },
      ]);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zeepay_authed');
    localStorage.removeItem('zeepay_user');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-700';
      case 'Pending review':
        return 'text-yellow-700';
      case 'Suspended':
        return 'text-red-700';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
              <div className="flex gap-6">
                <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-900">Platform overview</Link>
                <Link href="/admin/merchants" className="text-xs text-gray-900">Merchants</Link>
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Merchants</h1>
            <p className="text-xs text-gray-600 mt-1">Review onboarding, monitor accounts, and manage access</p>
          </div>
          <button className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
            ⇩ Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Total merchants</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">48</p>
            <p className="text-xs text-gray-500 mt-1">↑ 8 this month</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Active</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">41</p>
            <p className="text-xs text-gray-500 mt-1">85.4% of merchants</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Pending review</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">5</p>
            <p className="text-xs text-gray-500 mt-1">2 new this week</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Suspended</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">2</p>
            <p className="text-xs text-gray-500 mt-1">Review required</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {merchants.map((merchant, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium">{merchant.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{merchant.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">${merchant.volume.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getStatusColor(merchant.status)}`}>
                          {merchant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{merchant.joined}</td>
                      <td className="px-4 py-3 text-xs">
                        <button className="text-gray-600 hover:text-gray-900">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
