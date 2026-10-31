'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal, useToast } from '@/components/ui';
import { copyToClipboard as copyText } from '@/lib/export';

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

interface ProviderEnvStatus {
  configured: boolean;
  partiallyConfigured: boolean;
  missingRequired: string[];
  isActive: boolean;
  updatedAt: string | null;
  simulated: boolean;
}

interface CredentialField {
  label: string;
  required?: boolean;
  secret?: boolean;
  placeholder?: string;
  help?: string;
}

interface ProviderDef {
  name: string;
  type: string;
  capabilities: Record<string, boolean | undefined>;
  configSchema: Record<string, CredentialField>;
  environments: { test: ProviderEnvStatus; live: ProviderEnvStatus };
}

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks' | 'providers'>('api-keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'test' | 'live'>('test');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: '', events: 'payment.succeeded, payment.failed' });

  // Provider connections (plug-and-play credentials)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [providers, setProviders] = useState<ProviderDef[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [envByProvider, setEnvByProvider] = useState<Record<string, 'test' | 'live'>>({});
  const [credForm, setCredForm] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    const stored = localStorage.getItem('zeepay_api_key');
    if (stored) setApiKeyInput(stored);
  }, []);

  useEffect(() => {
    if (activeTab === 'providers' && apiKeyInput) {
      fetchProviders(apiKeyInput);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
    toast('API key deleted', { tone: 'info' });
  };

  const addWebhook = () => {
    const url = webhookForm.url.trim();
    if (!/^https:\/\/.+/.test(url)) {
      toast('Enter a valid HTTPS URL', { tone: 'warning' });
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
    toast('Webhook deleted', { tone: 'info' });
  };

  const copyToClipboard = (text: string) => {
    copyText(text).then((ok) => toast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? undefined : { tone: 'danger' }));
  };

  // ------------------------------------------------------------------
  // Provider connections
  // ------------------------------------------------------------------

  const fetchProviders = async (key: string) => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const res = await fetch('/api/v1/provider-accounts', {
        headers: { 'x-api-key': key },
      });
      const data = await res.json();
      if (!res.ok) {
        setProvidersError(data.error || data.message || 'Failed to load providers');
        setProviders([]);
        return;
      }
      setProviders(data.data || []);
      localStorage.setItem('zeepay_api_key', key);
    } catch {
      setProvidersError('Failed to reach the provider accounts API');
    } finally {
      setProvidersLoading(false);
    }
  };

  const credFieldKey = (provider: string, env: string) => `${provider}:${env}`;

  const updateCredField = (provider: string, env: string, field: string, value: string) => {
    const key = credFieldKey(provider, env);
    setCredForm((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const saveCredentials = async (provider: ProviderDef, env: 'test' | 'live') => {
    const key = credFieldKey(provider.name, env);
    const values = credForm[key] || {};
    const hasAny = Object.values(values).some((v) => v.trim() !== '');
    if (!hasAny) {
      toast('Enter at least one credential field', { tone: 'warning' });
      return;
    }

    setSaving(key);
    try {
      const res = await fetch('/api/v1/provider-accounts', {
        method: 'PUT',
        headers: { 'x-api-key': apiKeyInput, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.name, environment: env, credentials: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.message || data.error || 'Save failed', { tone: 'danger' });
        return;
      }
      setCredForm((prev) => ({ ...prev, [key]: {} }));
      toast(
        data.configured
          ? `${provider.name} ${env} credentials saved — provider is live`
          : `${provider.name} saved — ${data.missingRequired.length} required field(s) still missing`,
        data.configured ? undefined : { tone: 'warning' }
      );
      await fetchProviders(apiKeyInput);
    } catch {
      toast('Failed to save credentials', { tone: 'danger' });
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async (provider: ProviderDef, env: 'test' | 'live') => {
    const key = credFieldKey(provider.name, env);
    setTesting(key);
    try {
      const res = await fetch('/api/v1/provider-accounts', {
        method: 'POST',
        headers: { 'x-api-key': apiKeyInput, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider: provider.name, environment: env }),
      });
      const data = await res.json();
      if (data.simulated) {
        toast(`${provider.name} is running in simulation mode — save credentials to go live`, { tone: 'info' });
      } else {
        toast(
          `${provider.name} connection ${data.healthy ? 'healthy' : `failed${data.message ? `: ${data.message}` : ''}`}`,
          data.healthy ? undefined : { tone: 'danger' }
        );
      }
    } catch {
      toast('Connection test failed', { tone: 'danger' });
    } finally {
      setTesting(null);
    }
  };

  const deactivateProvider = async (provider: ProviderDef, env: 'test' | 'live') => {
    try {
      const res = await fetch('/api/v1/provider-accounts', {
        method: 'DELETE',
        headers: { 'x-api-key': apiKeyInput, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.name, environment: env }),
      });
      if (res.ok) {
        toast(`${provider.name} ${env} deactivated`, { tone: 'info' });
        await fetchProviders(apiKeyInput);
      }
    } catch {
      toast('Failed to deactivate', { tone: 'danger' });
    }
  };

  const providerStatusBadge = (env: ProviderEnvStatus) => {
    if (env.configured && env.isActive) {
      return <span className="badge bg-success">Configured</span>;
    }
    if (env.partiallyConfigured) {
      return <span className="badge bg-warning text-dark">Partial</span>;
    }
    return <span className="badge bg-secondary">Simulated</span>;
  };

  const providerDisplayName = (name: string) =>
    name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return (
    <>
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
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
            type="button"
          >
            Payment Providers
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

          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="alert alert-info small" role="alert">
                Plug-and-play: providers run in <strong>simulation mode</strong> until you paste
                credentials here. Saving valid credentials switches that provider to the real
                gateway instantly — no code changes needed.
              </div>

              <div className="card">
                <div className="card-body">
                  <label className="form-label small fw-medium">Your ZeePay API key</label>
                  <div className="d-flex gap-2">
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="zp_test_..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <button
                      className="btn btn-primary btn-sm text-nowrap"
                      onClick={() => fetchProviders(apiKeyInput)}
                      disabled={!apiKeyInput || providersLoading}
                    >
                      {providersLoading ? 'Loading…' : 'Load providers'}
                    </button>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    Used to authenticate against the provider accounts API. Stored only in your browser.
                  </p>
                  {providersError && (
                    <p className="small text-danger mt-2 mb-0">{providersError}</p>
                  )}
                </div>
              </div>

              {providers.filter((p) => p.name !== 'mock').map((provider) => {
                const env = envByProvider[provider.name] || 'test';
                const envStatus = provider.environments[env];
                const formKey = credFieldKey(provider.name, env);
                const fields = credForm[formKey] || {};
                const schemaEntries = Object.entries(provider.configSchema || {});

                return (
                  <div className="card" key={provider.name}>
                    <div
                      className="card-header d-flex justify-content-between align-items-center"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedProvider(expandedProvider === provider.name ? null : provider.name)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <h5 className="card-title mb-0">{providerDisplayName(provider.name)}</h5>
                        <span className="badge bg-light text-dark border">{provider.type}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {providerStatusBadge(envStatus)}
                        <i className={`bi bi-chevron-${expandedProvider === provider.name ? 'up' : 'down'}`}></i>
                      </div>
                    </div>

                    {expandedProvider === provider.name && (
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <label className="form-label small mb-0">Environment</label>
                          <div className="btn-group btn-group-sm" role="group">
                            {(['test', 'live'] as const).map((e) => (
                              <button
                                key={e}
                                type="button"
                                className={`btn ${env === e ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() =>
                                  setEnvByProvider((prev) => ({ ...prev, [provider.name]: e }))
                                }
                              >
                                {e === 'test' ? 'Test' : 'Live'}
                              </button>
                            ))}
                          </div>
                          <span className="small text-muted">
                            {envStatus.simulated
                              ? 'Simulation mode — credentials not saved'
                              : envStatus.configured
                                ? 'Connected with saved credentials'
                                : `${envStatus.missingRequired.length} required field(s) missing`}
                          </span>
                        </div>

                        <div className="row g-3">
                          {schemaEntries.map(([fieldKey, field]) => (
                            <div className="col-md-6" key={fieldKey}>
                              <label className="form-label small">
                                {field.label}
                                {field.required && <span className="text-danger"> *</span>}
                                {envStatus.missingRequired.includes(fieldKey) && (
                                  <span className="badge bg-warning text-dark ms-2">missing</span>
                                )}
                              </label>
                              <input
                                type={field.secret ? 'password' : 'text'}
                                className="form-control form-control-sm"
                                placeholder={
                                  field.placeholder ||
                                  (field.secret ? '••••••••  (leave blank to keep current)' : '')
                                }
                                value={fields[fieldKey] || ''}
                                onChange={(e) =>
                                  updateCredField(provider.name, env, fieldKey, e.target.value)
                                }
                              />
                              {field.help && (
                                <p className="small text-muted mt-1 mb-0">{field.help}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {schemaEntries.length === 0 && (
                          <p className="small text-muted">This provider needs no credentials.</p>
                        )}

                        <div className="d-flex gap-2 mt-4">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => saveCredentials(provider, env)}
                            disabled={saving === formKey}
                          >
                            {saving === formKey ? 'Saving…' : 'Save credentials'}
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => testConnection(provider, env)}
                            disabled={testing === formKey}
                          >
                            {testing === formKey ? 'Testing…' : 'Test connection'}
                          </button>
                          {envStatus.isActive && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deactivateProvider(provider, env)}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showWebhookModal && (
        <Modal open 
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
    </>
  );
}
