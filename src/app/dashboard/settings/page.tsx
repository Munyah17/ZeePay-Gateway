'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  keyPrefix: string;
  environment: 'test' | 'live';
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks'>('api-keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'test' | 'live'>('test');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setApiKeys([
        { id: '1', keyPrefix: 'zp_test_1234', environment: 'test', isActive: true, lastUsedAt: '2026-10-19T10:00:00Z', createdAt: '2026-10-01T00:00:00Z' },
        { id: '2', keyPrefix: 'zp_live_5678', environment: 'live', isActive: true, createdAt: '2026-10-10T00:00:00Z' },
      ]);

      setWebhooks([
        { id: '1', url: 'https://myapp.com/webhooks/zeepay', events: ['payment.succeeded', 'payment.failed'], isActive: true, createdAt: '2026-10-05T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const mockKey = `zp_${newKeyEnvironment}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedKey(mockKey);
      setShowNewKeyModal(false);
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <nav className="border-b border-gray-200" style={{display: 'none'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
              <div className="flex gap-6">
                <Link href="/dashboard" className="text-xs text-gray-600 hover:text-gray-900">Overview</Link>
                <Link href="/dashboard/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/dashboard/customers" className="text-xs text-gray-600 hover:text-gray-900">Customers</Link>
                <Link href="/dashboard/methods" className="text-xs text-gray-600 hover:text-gray-900">Methods</Link>
                <Link href="/dashboard/refunds" className="text-xs text-gray-600 hover:text-gray-900">Refunds</Link>
                <Link href="/dashboard/settings" className="text-xs text-gray-900">Settings</Link>
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

      <main>
        <div className="mb-8">
          <h1 className="text-sm font-semibold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-600 mt-1">Manage your account settings</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`${
                activeTab === 'api-keys'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } whitespace-nowrap py-3 px-1 border-b-2 text-xs font-medium`}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`${
                activeTab === 'webhooks'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } whitespace-nowrap py-3 px-1 border-b-2 text-xs font-medium`}
            >
              Webhooks
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                {generatedKey && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                    <p className="text-xs font-semibold text-blue-900 mb-2">API Key Generated</p>
                    <p className="text-xs text-blue-700 mb-4">
                      Copy this key now. You won't be able to see it again.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-blue-300 rounded px-3 py-1.5 text-xs">
                        {generatedKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedKey)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => setGeneratedKey(null)}
                        className="border border-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-semibold text-gray-900">API Keys</h2>
                    <button
                      onClick={() => setShowNewKeyModal(true)}
                      className="bg-black text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800"
                    >
                      Generate New Key
                    </button>
                  </div>

                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="border border-gray-200 rounded p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{key.keyPrefix}***</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Environment: <span className="font-medium">{key.environment}</span>
                            </p>
                            {key.lastUsedAt && (
                              <p className="text-xs text-gray-500">
                                Last used: {new Date(key.lastUsedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {showNewKeyModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded p-6 max-w-md w-full mx-4">
                      <h3 className="text-xs font-semibold text-gray-900 mb-4">Generate New API Key</h3>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Environment
                        </label>
                        <select
                          value={newKeyEnvironment}
                          onChange={(e) => setNewKeyEnvironment(e.target.value as 'test' | 'live')}
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                        >
                          <option value="test">Test</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowNewKeyModal(false)}
                          className="border border-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateKey}
                          className="bg-black text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-semibold text-gray-900">Webhook Endpoints</h2>
                    <button className="bg-black text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800">
                      Add Webhook
                    </button>
                  </div>

                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="border border-gray-200 rounded p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{webhook.url}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Events: {webhook.events.join(', ')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {webhooks.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-500">
                      No webhook endpoints configured
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded p-6">
                  <h3 className="text-xs font-semibold text-gray-900 mb-4">Webhook Events</h3>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded p-3">
                      <p className="text-xs font-medium text-gray-900">payment.succeeded</p>
                      <p className="text-xs text-gray-500">Sent when a payment is successfully completed</p>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <p className="text-xs font-medium text-gray-900">payment.failed</p>
                      <p className="text-xs text-gray-500">Sent when a payment fails</p>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <p className="text-xs font-medium text-gray-900">payment.refunded</p>
                      <p className="text-xs text-gray-500">Sent when a refund is processed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
