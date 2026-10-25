'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ToastProvider, toast } from '@/components/ui';

const defaultSettings = {
  platformName: 'ZeePay',
  contactEmail: 'support@zeepay.co.zw',
  website: 'https://zeepay.co.zw',
  currency: 'USD',
  toggles: [false, true, true, true],
  fees: { mobileMoney: 1.5, card: 2.0, bankTransfer: 0.8 },
  settlementSchedule: 'Daily',
  minSettlement: 50,
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }
    try {
      const stored = localStorage.getItem('zeepay_admin_settings');
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    } catch { /* noop */ }
    setLoading(false);
  }, [router]);

  const save = () => {
    try { localStorage.setItem('zeepay_admin_settings', JSON.stringify(settings)); } catch { /* noop */ }
    setSaved(true);
    toast('Platform settings saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('zeepay_authed');
    localStorage.removeItem('zeepay_user');
    router.push('/');
  };

  return (
    <ToastProvider>
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
              <div className="hidden md:flex gap-6">
                <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-900">Platform overview</Link>
                <Link href="/admin/merchants" className="text-xs text-gray-600 hover:text-gray-900">Merchants</Link>
                <Link href="/admin/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">Providers</Link>
                <Link href="/admin/settlements" className="text-xs text-gray-600 hover:text-gray-900">Settlements</Link>
                <Link href="/admin/settings" className="text-xs text-gray-900">Settings</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-xs text-gray-600">admin@zeepay.co.zw</span>
              <button onClick={handleLogout} className="text-xs text-gray-600 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Platform settings</h1>
            <p className="text-xs text-gray-600 mt-1">Configure platform-wide defaults and operational controls</p>
          </div>
          <button className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800" onClick={save}>
            {saved ? '✓ Saved' : 'Save changes'}
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
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  >
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
                      checked={settings.toggles[index]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          toggles: settings.toggles.map((t, i) => (i === index ? e.target.checked : t)),
                        })
                      }
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
                      value={settings.fees.mobileMoney}
                      step="0.1"
                      onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, mobileMoney: parseFloat(e.target.value) || 0 } })}
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
                      value={settings.fees.card}
                      step="0.1"
                      onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, card: parseFloat(e.target.value) || 0 } })}
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
                      value={settings.fees.bankTransfer}
                      step="0.1"
                      onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, bankTransfer: parseFloat(e.target.value) || 0 } })}
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
                  <select
                    value={settings.settlementSchedule}
                    onChange={(e) => setSettings({ ...settings, settlementSchedule: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  >
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
                      value={settings.minSettlement}
                      onChange={(e) => setSettings({ ...settings, minSettlement: parseFloat(e.target.value) || 0 })}
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
    </ToastProvider>
  );
}
