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
      // Mock data for now
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
      // Mock key generation
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">Manage your account settings</p>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Overview</Link>
              <Link href="/dashboard/transactions" className="text-gray-600 hover:text-gray-900">Transactions</Link>
              <Link href="/dashboard/settings" className="text-blue-600 font-medium">Settings</Link>
              <Link href="/dashboard/simulator" className="text-gray-600 hover:text-gray-900">Simulator</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`${
                activeTab === 'api-keys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`${
                activeTab === 'webhooks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Webhooks
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <>
            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                {/* New Key Modal */}
                {generatedKey && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">API Key Generated</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Copy this key now. You won't be able to see it again.
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-sm">
                        {generatedKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedKey)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => setGeneratedKey(null)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* API Keys Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">API Keys</h2>
                    <button
                      onClick={() => setShowNewKeyModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Generate New Key
                    </button>
                  </div>

                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{key.keyPrefix}***</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Environment: <span className="font-medium">{key.environment}</span>
                            </p>
                            {key.lastUsedAt && (
                              <p className="text-sm text-gray-500">
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

                {/* Generate Key Modal */}
                {showNewKeyModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4">Generate New API Key</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Environment
                        </label>
                        <select
                          value={newKeyEnvironment}
                          onChange={(e) => setNewKeyEnvironment(e.target.value as 'test' | 'live')}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="test">Test</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowNewKeyModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateKey}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                {/* Webhooks Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Webhook Endpoints</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Add Webhook
                    </button>
                  </div>

                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{webhook.url}</p>
                            <p className="text-sm text-gray-500 mt-1">
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
                    <div className="text-center py-8 text-gray-500">
                      No webhook endpoints configured
                    </div>
                  )}
                </div>

                {/* Webhook Documentation */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Webhook Events</h3>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded p-3">
                      <p className="font-medium text-gray-900">payment.succeeded</p>
                      <p className="text-sm text-gray-500">Sent when a payment is successfully completed</p>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <p className="font-medium text-gray-900">payment.failed</p>
                      <p className="text-sm text-gray-500">Sent when a payment fails</p>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <p className="font-medium text-gray-900">payment.refunded</p>
                      <p className="text-sm text-gray-500">Sent when a refund is processed</p>
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
