// React — the SECURE pattern.
// The browser NEVER holds the Liqo API key. It calls YOUR backend,
// which uses @liqo/sdk server-side and returns a checkoutUrl to redirect to.

import { useState } from 'react';

export function CheckoutButton({ orderId, amount }: { orderId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      // Call your own backend endpoint (see the express/nextjs examples),
      // NOT the Liqo API directly.
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          fromCurrency: 'NGN',
          toAsset: 'USDC',
          toWallet: 'G...RECIPIENT',
          payerEmail: 'customer@example.com',
          targetChain: 'stellar',
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? 'Checkout failed');

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl; // redirect to Liqo hosted checkout
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={startCheckout} disabled={loading}>
        {loading ? 'Redirecting…' : `Pay ${amount}`}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
