'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  date: string;
}

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchRefunds();
  }, [router]);

  const fetchRefunds = async () => {
    try {
      setRefunds([
        { id: 'ref_10021', paymentId: 'pay_1f0992', amount: 12, status: 'Succeeded', date: '16 Oct 2026' },
        { id: 'ref_10020', paymentId: 'pay_8j2201', amount: 10, status: 'Succeeded', date: '15 Oct 2026' },
      ]);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
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
      case 'Succeeded':
        return 'text-green-700';
      case 'Pending':
        return 'text-yellow-700';
      case 'Failed':
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
                <Link href="/dashboard" className="text-xs text-gray-600 hover:text-gray-900">Overview</Link>
                <Link href="/dashboard/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/dashboard/customers" className="text-xs text-gray-600 hover:text-gray-900">Customers</Link>
                <Link href="/dashboard/methods" className="text-xs text-gray-600 hover:text-gray-900">Methods</Link>
                <Link href="/dashboard/refunds" className="text-xs text-gray-900">Refunds</Link>
                <Link href="/dashboard/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
                <Link href="/dashboard/simulator" className="text-xs text-gray-600 hover:text-gray-900">Simulator</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">merchant@example.com</span>
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
            <h1 className="text-sm font-semibold text-gray-900">Refunds</h1>
            <p className="text-xs text-gray-600 mt-1">Track and initiate refunds for supported payment providers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800"
          >
            ＋ Create refund
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-xs text-yellow-800">
            <strong>Demo only.</strong> Refund actions below update mock records only. Actual refund support depends on the underlying payment provider and transaction status.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-semibold text-gray-900">Refund history</h2>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {refunds.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Refund ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">{refund.id}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">{refund.paymentId}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">${refund.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getStatusColor(refund.status)}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{refund.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md w-full mx-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-4">Create refund</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500">
                    <option>pay_8x2k91 — $10.00 (invoice_1042)</option>
                    <option>pay_7m4422 — $50.00 (invoice_1041)</option>
                    <option>pay_9q0678 — $20.00 (invoice_1040)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Refund amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue="10"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500">
                    <option>Customer request</option>
                    <option>Duplicate payment</option>
                    <option>Service not delivered</option>
                    <option>Other</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">This creates a simulated refund record only.</p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="border border-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => { e.preventDefault(); setShowCreateModal(false); }}
                    className="bg-black text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800"
                  >
                    Create demo refund
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
