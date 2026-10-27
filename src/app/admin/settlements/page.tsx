'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { exportCSV } from '@/lib/export';
import { Modal, useToast } from '@/components/ui';

interface Settlement {
  id: string;
  provider: string;
  amount: number;
  status: string;
  date: string;
}

export default function AdminSettlementsPage() {
  const router = useRouter();
  const toast = useToast();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [inspecting, setInspecting] = useState<Settlement | null>(null);

  const runReconciliation = () => {
    setReconciling(true);
    setTimeout(() => {
      setSettlements((prev) => prev.map((s) => (s.status === 'Pending' ? { ...s, status: 'Settled' } : s)));
      setReconciling(false);
      toast('Reconciliation complete — pending records marked settled (demo)', 'info');
    }, 1500);
  };

  const exportReport = () => {
    exportCSV(
      'settlements',
      settlements.map((s) => ({ id: s.id, provider: s.provider, amount: s.amount, status: s.status, date: s.date })),
    );
    toast(`Exported ${settlements.length} settlement records`);
  };

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchSettlements();
  }, [router]);

  const fetchSettlements = async () => {
    try {
      setSettlements([
        { id: 'set_1004', provider: 'EcoCash', amount: 8420, status: 'Settled', date: '16 Oct 2026' },
        { id: 'set_1003', provider: 'InnBucks', amount: 5330, status: 'Settled', date: '16 Oct 2026' },
        { id: 'set_1002', provider: 'Visa & Mastercard', amount: 2480, status: 'Pending', date: '15 Oct 2026' },
        { id: 'set_1001', provider: 'Omari', amount: 1910, status: 'Settled', date: '15 Oct 2026' },
      ]);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
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
      case 'Settled':
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
              <div className="hidden md:flex gap-6">
                <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-900">Platform overview</Link>
                <Link href="/admin/merchants" className="text-xs text-gray-600 hover:text-gray-900">Merchants</Link>
                <Link href="/admin/transactions" className="text-xs text-gray-600 hover:text-gray-900">Transactions</Link>
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">Providers</Link>
                <Link href="/admin/settlements" className="text-xs text-gray-900">Settlements</Link>
                <Link href="/admin/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
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
            <h1 className="text-sm font-semibold text-gray-900">Settlements & reconciliation</h1>
            <p className="text-xs text-gray-600 mt-1">Compare provider-reported settlements against payment records</p>
          </div>
          <div className="flex gap-3">
            <button className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50" onClick={exportReport}>
              ⇩ Export report
            </button>
            <button
              className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50"
              onClick={runReconciliation}
              disabled={reconciling}
            >
              {reconciling ? 'Reconciling…' : '↻ Run reconciliation'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-xs text-yellow-800">
            <strong>Payment status is not settlement status.</strong> This demo uses mock settlement records. Real settlement data must come from provider reports or authenticated APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Settled volume</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">$15,660</p>
            <p className="text-xs text-gray-500 mt-1">Provider-reported demo total</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Pending settlement</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">$2,480</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting provider confirmation</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Reconciliation matches</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">98.2%</p>
            <p className="text-xs text-gray-500 mt-1">Based on mock records</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600">Discrepancies</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">2</p>
            <p className="text-xs text-gray-500 mt-1">Require investigation</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded p-6">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
              <h2 className="text-xs font-semibold text-gray-900">Recent settlement records</h2>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {settlements.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Settlement ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Settlement date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id}>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">{settlement.id}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">{settlement.provider}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">${settlement.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getStatusColor(settlement.status)}`}>
                          {settlement.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{settlement.date}</td>
                      <td className="px-4 py-3 text-xs">
                        <button className="text-gray-600 hover:text-gray-900" onClick={() => setInspecting(settlement)}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Inspect modal */}
      {inspecting && (
        <Modal open title={`Settlement ${inspecting.id}`} onClose={() => setInspecting(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Provider</span>
              <span className="small fw-medium">{inspecting.provider}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Amount</span>
              <span className="small fw-medium">${inspecting.amount.toLocaleString()}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <span className="small">{inspecting.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Settlement date</span>
              <span className="small">{inspecting.date}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Discrepancies</span>
              <span className="small">None detected (demo)</span>
            </li>
          </ul>
          <p className="small text-muted mt-3 mb-0">
            This is mock settlement data for demonstration; real inspection requires provider reports.
          </p>
        </Modal>
      )}
    </div>
  );
}
