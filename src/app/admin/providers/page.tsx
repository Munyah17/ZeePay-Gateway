'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Provider {
  name: string;
  category: string;
  status: string;
  success: number;
  volume: number;
}

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchProviders();
  }, [router]);

  const fetchProviders = async () => {
    try {
      setProviders([
        { name: 'EcoCash', category: 'Mobile money', status: 'Connected', success: 98.6, volume: 18420 },
        { name: 'InnBucks', category: 'Mobile money', status: 'Connected', success: 97.8, volume: 12640 },
        { name: 'Omari', category: 'Mobile money', status: 'Connected', success: 96.9, volume: 8350 },
        { name: 'Visa & Mastercard', category: 'Cards', status: 'Sandbox', success: 99.1, volume: 24780 },
        { name: 'American Express', category: 'Cards', status: 'Not configured', success: 0, volume: 0 },
        { name: 'UnionPay', category: 'Cards', status: 'Not configured', success: 0, volume: 0 },
        { name: 'M-Pesa', category: 'Mobile money', status: 'Roadmap', success: 0, volume: 0 },
        { name: 'MTN MoMo', category: 'Mobile money', status: 'Roadmap', success: 0, volume: 0 },
      ]);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
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
      case 'Connected':
        return 'text-green-700';
      case 'Sandbox':
        return 'text-yellow-700';
      case 'Not configured':
        return 'text-gray-500';
      case 'Roadmap':
        return 'text-blue-700';
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
                <Link href="/admin/merchants" className="text-xs text-gray-600 hover:text-gray-900">Merchants</Link>
                <Link href="/admin/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/admin/providers" className="text-xs text-gray-900">Providers</Link>
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
            <h1 className="text-sm font-semibold text-gray-900">Payment providers</h1>
            <p className="text-xs text-gray-600 mt-1">Configure adapters, inspect readiness, and monitor provider health</p>
          </div>
          <div className="flex gap-3">
            <button className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
              ↻ Run health checks
            </button>
            <button className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800">
              ＋ Add provider
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-xs text-yellow-800">
            <strong>Mock provider registry.</strong> Provider status and metrics are demonstration data. A provider must have valid credentials, commercial authorization, and successful end-to-end testing before live activation.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
              <div key={index} className="border border-gray-200 rounded p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-sm font-semibold text-gray-700">
                      {provider.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-500">{provider.category}</p>
                    </div>
                  </div>
                  <span className={`text-xs ${getStatusColor(provider.status)}`}>
                    {provider.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Success rate</span>
                    <span className="text-xs font-semibold text-gray-900">{provider.success ? provider.success + '%' : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Volume (demo)</span>
                    <span className="text-xs font-semibold text-gray-900">${provider.volume.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                    Configure
                  </button>
                  <button className="flex-1 text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
