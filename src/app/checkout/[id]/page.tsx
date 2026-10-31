'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  provider: string;
  type: string;
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
}

interface SavedCard {
  id: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardHolder?: string;
  label?: string;
  isDefault?: boolean;
}

/** Methods that debit a wallet/alias — need the customer's handle. */
const HANDLE_TYPES = new Set(['mobile_money', 'wallet', 'bank_transfer']);

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedMethods, setSavedMethods] = useState<SavedCard[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [handle, setHandle] = useState(''); // phone / alias / email
  const [awaitingApproval, setAwaitingApproval] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widget, setWidget] = useState<{ scriptUrl: string } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Server-side verification failures land back here with ?error=
  useEffect(() => {
    const e = searchParams.get('error');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setError(e);
  }, [searchParams]);

  // Inject the COPYandPAY hosted widget: form must exist before the
  // gateway script loads so it can hydrate the .paymentWidgets element.
  useEffect(() => {
    if (!widget || !widgetRef.current) return;
    const container = widgetRef.current;
    container.innerHTML = '';

    const form = document.createElement('form');
    form.className = 'paymentWidgets';
    form.action = `/api/v1/checkout/${paymentId}/verify`;
    form.setAttribute('data-brands', 'VISA MASTER ZIMSWITCH');
    container.appendChild(form);

    const script = document.createElement('script');
    script.src = widget.scriptUrl;
    container.appendChild(script);

    return () => { container.innerHTML = ''; };
  }, [widget, paymentId]);

  const fetchCheckoutContext = async (): Promise<string | null> => {
    const response = await fetch(`/api/v1/checkout/${paymentId}`);
    if (!response.ok) {
      throw new Error('Payment not found');
    }
    const data = await response.json();
    setPayment({
      id: data.id,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
    });
    setPaymentMethods(data.paymentMethods || []);
    const saved: SavedCard[] = data.savedPaymentMethods || [];
    setSavedMethods(saved);
    return data.status as string;
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCheckoutContext()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load payment');
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  // Poll payment status while waiting for the customer's approval
  // (PIN prompt on their phone, banking app confirmation, ...).
  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchCheckoutContext();
        if (status === 'succeeded') {
          stopPolling();
          router.push(`/checkout/${paymentId}/success`);
        } else if (status === 'failed' || status === 'cancelled') {
          stopPolling();
          setAwaitingApproval(null);
          setProcessing(false);
          setError(status === 'cancelled' ? 'Payment was cancelled' : 'Payment was declined');
        }
      } catch {
        // transient poll failure — keep waiting
      }
    }, 2500);
  };

  const performBrowserRedirect = (redirect: { url: string; method?: string; parameters?: Record<string, string> }) => {
    if (redirect.method === 'GET' || !redirect.method) {
      const qs = new URLSearchParams(redirect.parameters || {}).toString();
      window.location.href = qs ? `${redirect.url}?${qs}` : redirect.url;
      return;
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = redirect.url;
    Object.entries(redirect.parameters || {}).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (selectedMethod.startsWith('saved:')) {
        // One-click payment — charge the tokenised saved card
        const response = await fetch(`/api/v1/checkout/${paymentId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ savedPaymentMethodId: selectedMethod.slice(6) }),
        });
        const data = await response.json();

        if (data.requiresAction && data.redirect) {
          performBrowserRedirect(data.redirect);
          return;
        }

        if (data.requiresAction && data.checkoutUrl) {
          if (data.checkoutUrl.includes('paymentWidgets.js')) {
            // COPYandPAY: the URL is a widget SCRIPT, not a page —
            // redirecting to it shows raw JavaScript. Embed instead.
            setWidget({ scriptUrl: data.checkoutUrl });
            setProcessing(false);
            return;
          }
          // Step-up authentication required (e.g. 3DS redirect page)
          window.location.href = data.checkoutUrl;
          return;
        }
        if (!response.ok || data.status === 'failed') {
          throw new Error(data.message || 'Payment failed');
        }
        router.push(`/checkout/${paymentId}/success`);
        return;
      }

      // ------------------------------------------------------------
      // Payment method — initiate through the method's provider
      // (mobile money PIN prompt, wallet redirect, card gateway).
      // Unconfigured providers run simulated until the merchant
      // pastes API credentials on the dashboard.
      // ------------------------------------------------------------
      const method = paymentMethods.find((m) => m.id === selectedMethod);
      const needsHandle = method && HANDLE_TYPES.has(method.type);

      const response = await fetch(`/api/v1/checkout/${paymentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: selectedMethod,
          customerPhone: needsHandle ? handle || undefined : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.status === 'failed') {
        throw new Error(data.message || data.error || 'Payment failed');
      }

      // Provider-hosted checkout (OPay cashier, Cash App Pay, widget)
      if (data.checkoutUrl) {
        if (data.checkoutUrl.includes('paymentWidgets.js')) {
          setWidget({ scriptUrl: data.checkoutUrl });
          setProcessing(false);
          return;
        }
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.redirect) {
        performBrowserRedirect(data.redirect);
        return;
      }

      if (data.status === 'succeeded') {
        router.push(`/checkout/${paymentId}/success`);
        return;
      }

      // Pending customer approval — show instructions and poll.
      setAwaitingApproval(
        data.instructions || `Approve the ${method?.name || 'payment'} prompt on your device`
      );
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  const selectedMethodObj = paymentMethods.find((m) => m.id === selectedMethod);
  const needsHandle = selectedMethodObj ? HANDLE_TYPES.has(selectedMethodObj.type) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-center mb-2">Payment Not Found</h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">ZeePay Checkout</h1>

          {payment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
              <p className="text-3xl font-bold text-blue-600">
                ${payment.amount.toFixed(2)} {payment.currency}
              </p>
              <p className="text-xs text-gray-500 mt-1">Reference: {payment.reference}</p>
            </div>
          )}

          {awaitingApproval ? (
            <div className="text-center py-8">
              <div className="animate-pulse rounded-full h-16 w-16 bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Waiting for approval</h2>
              <p className="text-sm text-gray-600">{awaitingApproval}</p>
              <p className="text-xs text-gray-400 mt-4">This page updates automatically</p>
              <button
                onClick={() => { stopPolling(); setAwaitingApproval(null); setProcessing(false); }}
                className="mt-6 text-sm text-gray-500 hover:text-gray-800"
              >
                Cancel and choose another method
              </button>
            </div>
          ) : (
            <>
              {savedMethods.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Pay with a saved card</h2>
                  <div className="space-y-3">
                    {savedMethods.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => setSelectedMethod(`saved:${card.id}`)}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedMethod === `saved:${card.id}`
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {card.cardBrand ? card.cardBrand.charAt(0).toUpperCase() + card.cardBrand.slice(1) : 'Card'}{' '}
                              •••• {card.cardLast4}
                              {card.isDefault && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {card.cardHolder || card.label || 'Saved card'}
                              {card.cardExpMonth && card.cardExpYear ? ` · expires ${card.cardExpMonth}/${card.cardExpYear}` : ''}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedMethod === `saved:${card.id}`
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedMethod === `saved:${card.id}` && (
                              <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    One click — your saved card is charged instantly, no card details needed.
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">
                  {savedMethods.length > 0 ? 'Or pay another way' : 'Choose your payment method'}
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.provider}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedMethod === method.id && (
                            <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {needsHandle && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedMethodObj?.type === 'bank_transfer'
                      ? 'Your phone or email (payment alias)'
                      : 'Your mobile money number'}
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder={selectedMethodObj?.type === 'bank_transfer' ? 'e.g. 0712 345 678 or you@email.com' : 'e.g. 0772 123 456'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The payment prompt will be sent to this {selectedMethodObj?.type === 'bank_transfer' ? 'alias' : 'number'}.
                  </p>
                </div>
              )}

              {widget && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Enter card details</h2>
                  <div ref={widgetRef} className="rounded-lg border border-gray-200 bg-white p-3"></div>
                  <p className="text-xs text-gray-500 mt-2">
                    Card details are entered on ZimSwitch Online&apos;s hosted form — they never touch ZeePay.
                  </p>
                  <button
                    onClick={() => setWidget(null)}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose a different payment method
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedMethod || processing || !!widget || (needsHandle && !handle.trim())}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secured by ZeePay
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
