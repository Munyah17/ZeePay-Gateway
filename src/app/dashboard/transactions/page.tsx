'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const mockTransactions: Transaction[] = [
        { id: '1', reference: 'INV-1042', amount: 10, currency: 'USD', status: 'succeeded', createdAt: '2026-10-19T10:00:00Z' },
        { id: '2', reference: 'INV-1041', amount: 25, currency: 'USD', status: 'pending', createdAt: '2026-10-19T09:30:00Z' },
        { id: '3', reference: 'INV-1040', amount: 15, currency: 'USD', status: 'succeeded', createdAt: '2026-10-18T16:45:00Z' },
        { id: '4', reference: 'INV-1039', amount: 50, currency: 'USD', status: 'failed', createdAt: '2026-10-18T14:20:00Z' },
        { id: '5', reference: 'INV-1038', amount: 30, currency: 'USD', status: 'succeeded', createdAt: '2026-10-18T11:10:00Z' },
      ];

      const filtered = filter === 'all' 
        ? mockTransactions 
        : mockTransactions.filter(t => t.status === filter);

      setTransactions(filtered);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-700';
      case 'pending':
        return 'text-yellow-700';
      case 'failed':
        return 'text-red-700';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
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
                <Link href="/dashboard/transactions" className="text-xs text-gray-900">Transactions</Link>
                <Link href="/dashboard/customers" className="text-xs text-gray-600 hover:text-gray-900">Customers</Link>
                <Link href="/dashboard/methods" className="text-xs text-gray-600 hover:text-gray-900">Methods</Link>
                <Link href="/dashboard/refunds" className="text-xs text-gray-600 hover:text-gray-900">Refunds</Link>
                <Link href="/dashboard/settings" className="text-xs text-gray-600 hover:text-gray-900">Settings</Link>
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
          <h1 className="text-sm font-semibold text-gray-900">Transactions</h1>
          <p className="text-xs text-gray-600 mt-1">View and manage your payment transactions</p>
        </div>

        <div className="border border-gray-200 rounded p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-700">Filter by status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
            >
              <option value="all">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-xs text-gray-900">{transaction.reference}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        ${transaction.amount.toFixed(2)} {transaction.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <button className="text-gray-600 hover:text-gray-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
