'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal, ToastProvider, toast } from '@/components/ui';
import { copyToClipboard as copyText } from '@/utils/actions';

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
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: '', events: 'payment.succeeded, payment.failed' });

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
      setApiKeys((prev) => [
        {
          id: String(Date.now()),
          keyPrefix: mockKey.slice(0, 12),
          environment: newKeyEnvironment,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowNewKeyModal(false);
      toast('API key generated');
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  };

  const toggleKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k)));
    toast('Key status updated');
  };

  const deleteKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast('API key deleted', 'info');
  };

  const addWebhook = () => {
    const url = webhookForm.url.trim();
    if (!/^https:\/\/.+/.test(url)) {
      toast('Enter a valid HTTPS URL', 'warning');
      return;
    }
    setWebhooks((prev) => [
      {
        id: String(Date.now()),
        url,
        events: webhookForm.events.split(',').map((e) => e.trim()).filter(Boolean),
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setShowWebhookModal(false);
    setWebhookForm({ url: '', events: 'payment.succeeded, payment.failed' });
    toast('Webhook endpoint added');
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)));
    toast('Webhook status updated');
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast('Webhook deleted', 'info');
  };

  const copyToClipboard = (text: string) => {
    copyText(text).then((ok) => toast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'danger'));
  };

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Settings</h2>
        <p className="text-muted">Manage your account settings</p>
      </div>

      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
            type="button"
          >
            API Keys
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
            type="button"
          >
            Webhooks
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'api-keys' && (
            <div className="space-y-4">
              {generatedKey && (
                <div className="alert alert-info" role="alert">
                  <h6 className="alert-heading">API Key Generated</h6>
                  <p className="small mb-3">
                    Copy this key now. You won't be able to see it again.
                  </p>
                  <div className="d-flex gap-2">
                    <code className="flex-grow-1 bg-white border rounded px-3 py-2 small">
                      {generatedKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedKey)}
                      className="btn btn-primary btn-sm"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setGeneratedKey(null)}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">API Keys</h5>
                  <button
                    onClick={() => setShowNewKeyModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <i className="bi bi-plus-lg me-1"></i> Generate New Key
                  </button>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="list-group-item d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 small fw-medium">{key.keyPrefix}***</h6>
                          <p className="small text-muted mb-1">
                            Environment: <span className="fw-medium">{key.environment}</span>
                          </p>
                          {key.lastUsedAt && (
                            <p className="small text-muted mb-0">
                              Last used: {new Date(key.lastUsedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${key.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            title={key.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleKey(key.id)}
                          >
                            <i className={`bi ${key.isActive ? 'bi-pause' : 'bi-play'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Delete"
                            onClick={() => deleteKey(key.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {showNewKeyModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Generate New API Key</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowNewKeyModal(false)}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label small">Environment</label>
                          <select
                            value={newKeyEnvironment}
                            onChange={(e) => setNewKeyEnvironment(e.target.value as 'test' | 'live')}
                            className="form-select form-select-sm"
                          >
                            <option value="test">Test</option>
                            <option value="live">Live</option>
                          </select>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          onClick={() => setShowNewKeyModal(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateKey}
                          className="btn btn-primary btn-sm"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Webhook Endpoints</h5>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowWebhookModal(true)}>
                    <i className="bi bi-plus-lg me-1"></i> Add Webhook
                  </button>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="list-group-item d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 small fw-medium">{webhook.url}</h6>
                          <p className="small text-muted mb-0">
                            Events: {webhook.events.join(', ')}
                          </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${webhook.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            title={webhook.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleWebhook(webhook.id)}
                          >
                            <i className={`bi ${webhook.isActive ? 'bi-pause' : 'bi-play'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Delete"
                            onClick={() => deleteWebhook(webhook.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {webhooks.length === 0 && (
                    <div className="text-center py-4 text-muted">
                      No webhook endpoints configured
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Webhook Events</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item">
                      <h6 className="small fw-medium mb-1">payment.succeeded</h6>
                      <p className="small text-muted mb-0">Sent when a payment is successfully completed</p>
                    </div>
                    <div className="list-group-item">
                      <h6 className="small fw-medium mb-1">payment.failed</h6>
                      <p className="small text-muted mb-0">Sent when a payment fails</p>
                    </div>
                    <div className="list-group-item">
                      <h6 className="small fw-medium mb-1">payment.refunded</h6>
                      <p className="small text-muted mb-0">Sent when a refund is processed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showWebhookModal && (
        <Modal
          title="Add Webhook Endpoint"
          onClose={() => setShowWebhookModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowWebhookModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={addWebhook}>Add webhook</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Endpoint URL *</label>
            <input
              type="url"
              className="form-control form-control-sm"
              placeholder="https://yourapp.com/webhooks"
              value={webhookForm.url}
              onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
            />
          </div>
          <div className="mb-1">
            <label className="form-label small">Events (comma separated)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={webhookForm.events}
              onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </ToastProvider>
  );
}
