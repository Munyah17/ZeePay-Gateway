'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      setTransactions([
        { id: 'pay_8x2k91', merchant: 'Acme Solutions', amount: 10, method: 'EcoCash', status: 'Succeeded', date: '2 min ago' },
        { id: 'pay_7m4422', merchant: 'Acme Solutions', amount: 50, method: 'Visa', status: 'Succeeded', date: '5 min ago' },
        { id: 'pay_9q0678', merchant: 'TechGlobal Ltd', amount: 15, method: 'Omari', status: 'Failed', date: '32 min ago' },
        { id: 'pay_5k3124', merchant: 'Acme Solutions', amount: 100, method: 'Mastercard', status: 'Succeeded', date: '1 hour ago' },
        { id: 'pay_6n8104', merchant: 'GreenTech', amount: 25, method: 'EcoCash', status: 'Succeeded', date: '2 hours ago' },
      ]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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

  const filteredTransactions = filter === 'All' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

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
                <Link href="/admin/transactions" className="text-xs text-gray-900">Transactions</Link>
                <Link href="/admin/providers" className="text-xs text-gray-600 hover:text-gray-900">Providers</Link>
                <Link href="/admin/settlements" className="text-xs text-gray-600 hover:text-gray-900">Settlements</Link>
                <Link href="/admin/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
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
        <div className="mb-8">
          <h1 className="text-sm font-semibold text-gray-900">Platform transactions</h1>
          <p className="text-xs text-gray-600 mt-1">Inspect transaction activity across all demo merchants</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xs font-semibold text-gray-900">All platform transactions</h2>
                <p className="text-xs text-gray-500 mt-1">{filteredTransactions.length} records · Demo data</p>
              </div>
              <div className="flex gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                >
                  <option value="All">All</option>
                  <option value="Succeeded">Succeeded</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <button className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                  ⇩ Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">{tx.id}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">{tx.merchant}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">{tx.method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
