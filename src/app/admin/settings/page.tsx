'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
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
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">Providers</Link>
                <Link href="/admin/settlements" className="text-xs text-gray-600 hover:text-gray-900">Settlements</Link>
                <Link href="/admin/settings" className="text-xs text-gray-900">Settings</Link>
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
            <h1 className="text-sm font-semibold text-gray-900">Platform settings</h1>
            <p className="text-xs text-gray-600 mt-1">Configure platform-wide defaults and operational controls</p>
          </div>
          <button className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800">
            Save changes
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-xs font-semibold text-gray-900 mb-6">Platform configuration</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Platform name</label>
                  <input
                    type="text"
                    defaultValue="ZeePay"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact email</label>
                  <input
                    type="email"
                    defaultValue="support@zeepay.co.zw"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    defaultValue="https://zeepay.co.zw"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default currency</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500">
                    <option>USD</option>
                    <option>ZAR</option>
                    <option>EUR</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-xs font-semibold text-gray-900 mb-6">Security & preferences</h2>
              <div className="space-y-4">
                {[
                  'Two-factor authentication for admins',
                  'Platform-wide webhook failure alerts',
                  'Daily settlement reconciliation',
                  'Merchant onboarding notifications',
                ].map((setting, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{setting}</p>
                      <p className="text-xs text-gray-500">Configure security and notification settings</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={index !== 0}
                      className="h-3 w-3 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-xs font-semibold text-gray-900 mb-6">Fee configuration</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Mobile money fee</p>
                    <p className="text-xs text-gray-500">EcoCash, InnBucks, Omari</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue="1.5"
                      step="0.1"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-500"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Card fee</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue="2.0"
                      step="0.1"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-500"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Bank transfer fee</p>
                    <p className="text-xs text-gray-500">Zimbabwean banks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue="0.8"
                      step="0.1"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-500"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-xs font-semibold text-gray-900 mb-6">Settlement configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default settlement schedule</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minimum settlement amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">$</span>
                    <input
                      type="number"
                      defaultValue="50"
                      className="w-24 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
