'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  name: string;
  email: string;
  payments: number;
  totalPaid: number;
  lastActivity: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      setCustomers([
        { name: 'Sarah Moyo', email: 'sarah@example.com', payments: 6, totalPaid: 95, lastActivity: '2 min ago' },
        { name: 'Tawanda Ncube', email: 'tawanda@example.com', payments: 4, totalPaid: 180, lastActivity: '1 day ago' },
        { name: 'Rudo Dube', email: 'rudo@example.com', payments: 3, totalPaid: 42, lastActivity: '2 days ago' },
        { name: 'Brian Moyo', email: 'brian@example.com', payments: 2, totalPaid: 65, lastActivity: '3 days ago' },
        { name: 'Tariro Ndlovu', email: 'tariro@example.com', payments: 2, totalPaid: 20, lastActivity: '4 days ago' },
      ]);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zeepay_authed');
    localStorage.removeItem('zeepay_user');
    router.push('/');
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
                <Link href="/dashboard/customers" className="text-xs text-gray-900">Customers</Link>
                <Link href="/dashboard/methods" className="text-xs text-gray-600 hover:text-gray-900">Methods</Link>
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

      <main>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Customers</h1>
            <p className="text-xs text-gray-600 mt-1">Customers associated with your payment activity</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800"
          >
            ＋ Add customer
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last activity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium">{customer.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{customer.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">{customer.payments}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">${customer.totalPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{customer.lastActivity}</td>
                      <td className="px-4 py-3 text-xs">
                        <button className="text-gray-600 hover:text-gray-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md w-full mx-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-4">Add customer</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
                    placeholder="+263..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="border border-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => { e.preventDefault(); setShowAddModal(false); }}
                    className="bg-black text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800"
                  >
                    Add customer
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
