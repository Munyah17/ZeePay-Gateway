'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SimulatorPage() {
  const [paymentId, setPaymentId] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const scenarios = [
    { id: 'success', label: 'Successful Payment', status: 'succeeded' },
    { id: 'failed', label: 'Failed Payment', status: 'failed' },
    { id: 'pending', label: 'Pending Payment', status: 'pending' },
    { id: 'cancelled', label: 'Cancelled Payment', status: 'cancelled' },
  ];

  const handleSimulate = async () => {
    if (!paymentId) {
      setError('Please enter a payment ID');
      return;
    }

    if (!selectedScenario) {
      setError('Please select a scenario');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const scenario = scenarios.find((s) => s.id === selectedScenario);
      if (!scenario) {
        throw new Error('Invalid scenario');
      }

      const response = await fetch(`/api/v1/simulator/payments/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: scenario.status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPayment = async () => {
    if (!paymentId) {
      setError('Please enter a payment ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/v1/simulator/payments/${paymentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Simulator</h1>
              <p className="text-gray-600 text-sm">Test payment scenarios in test mode</p>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Overview</Link>
              <Link href="/dashboard/transactions" className="text-gray-600 hover:text-gray-900">Transactions</Link>
              <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
              <Link href="/dashboard/simulator" className="text-blue-600 font-medium">Simulator</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                The payment simulator is only available in test mode. No real money will be processed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulator Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Simulate Payment Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment ID (Provider Reference)
                </label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="e.g., mock_abc123..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSimulate}
                  disabled={loading || !paymentId || !selectedScenario}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Simulating...' : 'Simulate'}
                </button>
                <button
                  onClick={handleFetchPayment}
                  disabled={loading || !paymentId}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching...' : 'Fetch Payment'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Result</h2>

            {result ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Run a simulation to see results here
              </div>
            )}
          </div>
        </div>

        {/* Available Scenarios */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Available Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{scenario.label}</h3>
                <p className="text-sm text-gray-500 mt-1">Status: {scenario.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Testing Guide */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Integration Testing Guide</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">1. Create a Test Payment</h3>
              <p className="text-gray-600">
                Use the API to create a payment in test mode. The payment will start with a "pending" status.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">2. Simulate Payment Completion</h3>
              <p className="text-gray-600">
                Use the simulator to change the payment status to "succeeded" to test your webhook handlers.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">3. Test Failure Scenarios</h3>
              <p className="text-gray-600">
                Simulate failed payments to ensure your application handles errors gracefully.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">4. Verify Webhook Delivery</h3>
              <p className="text-gray-600">
                Check your webhook delivery history in the Settings tab to ensure events are being delivered.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
