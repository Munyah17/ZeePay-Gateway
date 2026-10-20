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
    <div>
      <main>
        <div className="mb-8">
          <h1 className="text-sm font-semibold text-gray-900">Payment Simulator</h1>
          <p className="text-xs text-gray-600 mt-1">Test payment scenarios in test mode</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-xs text-yellow-700">
            The payment simulator is only available in test mode. No real money will be processed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-xs font-semibold text-gray-900 mb-4">Simulate Payment Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Payment ID (Provider Reference)
                </label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="e.g., mock_abc123..."
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Scenario
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSimulate}
                  disabled={loading || !paymentId || !selectedScenario}
                  className="flex-1 bg-black text-white py-2 px-4 rounded text-xs hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Simulating...' : 'Simulate'}
                </button>
                <button
                  onClick={handleFetchPayment}
                  disabled={loading || !paymentId}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded text-xs hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching...' : 'Fetch Payment'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
                {error}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-xs font-semibold text-gray-900 mb-4">Result</h2>

            {result ? (
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                Run a simulation to see results here
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded p-6 mt-6">
          <h2 className="text-xs font-semibold text-gray-900 mb-4">Available Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded p-4">
                <p className="text-xs font-medium text-gray-900">{scenario.label}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {scenario.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded p-6 mt-6">
          <h2 className="text-xs font-semibold text-gray-900 mb-4">Integration Testing Guide</h2>
          <div className="space-y-4 text-xs text-gray-700">
            <div>
              <p className="font-medium text-gray-900 mb-1">1. Create a Test Payment</p>
              <p className="text-gray-600">
                Use the API to create a payment in test mode. The payment will start with a "pending" status.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">2. Simulate Payment Completion</p>
              <p className="text-gray-600">
                Use the simulator to change the payment status to "succeeded" to test your webhook handlers.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">3. Test Failure Scenarios</p>
              <p className="text-gray-600">
                Simulate failed payments to ensure your application handles errors gracefully.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">4. Verify Webhook Delivery</p>
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
