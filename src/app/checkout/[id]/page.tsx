'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedMethods, setSavedMethods] = useState<SavedCard[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widget, setWidget] = useState<{ scriptUrl: string } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

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

  const fetchCheckoutContext = async () => {
    try {
      // Public checkout context — payment + customer's saved cards
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
      const saved: SavedCard[] = data.savedPaymentMethods || [];
      setSavedMethods(saved);
      // Preselect the default saved card for true one-click payment
      const def = saved.find((m) => m.isDefault) || saved[0];
      if (def) setSelectedMethod(`saved:${def.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/v1/payment-methods');
      if (!response.ok) {
        throw new Error('Failed to load payment methods');
      }
      const data = await response.json();
      setPaymentMethods(data.data);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCheckoutContext();
    fetchPaymentMethods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

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
          // S2S async (3DS / issuer validation): the browser must POST
          // the gateway-supplied parameters — a plain navigation loses them.
          if (data.redirect.method === 'GET') {
            const qs = new URLSearchParams(data.redirect.parameters || {}).toString();
            window.location.href = qs ? `${data.redirect.url}?${qs}` : data.redirect.url;
          } else {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = data.redirect.url;
            Object.entries(data.redirect.parameters || {}).forEach(([k, v]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = k;
              input.value = String(v);
              form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
          }
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

      // Other methods — provider redirect flow (simulated in sandbox)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push(`/checkout/${paymentId}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

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
            disabled={!selectedMethod || processing || !!widget}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Secured by ZeePay
          </p>
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
