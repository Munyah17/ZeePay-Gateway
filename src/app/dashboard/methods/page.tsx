'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  name: string;
  category: string;
  status: string;
}

export default function MethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = localStorage.getItem('zeepay_authed');
    if (!authed) {
      router.push('/auth/login');
      return;
    }

    fetchMethods();
  }, [router]);

  const fetchMethods = async () => {
    try {
      setMethods([
        { name: 'EcoCash', category: 'Mobile money', status: 'Active' },
        { name: 'InnBucks', category: 'Mobile money', status: 'Active' },
        { name: 'Omari', category: 'Mobile money', status: 'Active' },
        { name: 'Visa & Mastercard', category: 'Cards', status: 'Sandbox' },
        { name: 'American Express', category: 'Cards', status: 'Not configured' },
        { name: 'UnionPay', category: 'Cards', status: 'Not configured' },
        { name: 'M-Pesa', category: 'Mobile money', status: 'Roadmap' },
        { name: 'MTN MoMo', category: 'Mobile money', status: 'Roadmap' },
      ]);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zeepay_authed');
    localStorage.removeItem('zeepay_user');
    router.push('/');
  };

  const toggleMethod = (name: string) => {
    setMethods(methods.map(m => 
      m.name === name 
        ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' }
        : m
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-700';
      case 'Sandbox':
        return 'text-yellow-700';
      case 'Inactive':
        return 'text-gray-600';
      case 'Not configured':
        return 'text-gray-500';
      case 'Roadmap':
        return 'text-blue-700';
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
                <Link href="/dashboard/methods" className="text-xs text-gray-900">Methods</Link>
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
        <div className="mb-8">
          <h1 className="text-sm font-semibold text-gray-900">Payment methods</h1>
          <p className="text-xs text-gray-600 mt-1">Manage the methods enabled for your ZeePay merchant account</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-xs text-yellow-800">
            <strong>Prototype mode.</strong> Toggles update this demo interface only. Live payment methods require provider approval, credentials, and successful integration testing.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-semibold text-gray-900">Your payment methods</h2>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {methods.filter(m => m.status === 'Active').length} enabled
                </span>
              </div>
              <div className="space-y-4">
                {methods.map((method) => (
                  <div key={method.name} className="border border-gray-200 rounded p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-700">
                        {method.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-500">
                          {['EcoCash', 'InnBucks', 'Omari', 'Visa & Mastercard'].includes(method.name)
                            ? 'Initial integration target'
                            : 'Planned integration · Not live'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${getStatusColor(method.status)}`}>
                        {method.status}
                      </span>
                      {['EcoCash', 'InnBucks', 'Omari', 'Visa & Mastercard'].includes(method.name) && (
                        <input
                          type="checkbox"
                          checked={method.status === 'Active'}
                          onChange={() => toggleMethod(method.name)}
                          className="h-3 w-3 border-gray-300 rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-6">
              <h2 className="text-xs font-semibold text-gray-900 mb-6">Provider coverage</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Connected / sandbox</p>
                    <p className="text-xs text-gray-500">Local mobile money and card sandbox</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">3</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Setup required</p>
                    <p className="text-xs text-gray-500">Additional card network onboarding</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Roadmap</p>
                    <p className="text-xs text-gray-500">Subject to provider access and eligibility</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">3</span>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6">
                <p className="text-xs text-yellow-800">
                  The interface never treats a roadmap item as an operational payment method. Provider capability and merchant eligibility must be verified before live activation.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
