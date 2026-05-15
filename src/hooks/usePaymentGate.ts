'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type Agent = 'networth' | 'llp' | 'partnership' | 'offerletter';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYMENT BYPASS: Set to false to re-enable Razorpay payments
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BYPASS_PAYMENT = true;

interface UsePaymentGateOptions {
  agent: Agent;
  documentId: string | null;
}

interface UsePaymentGateResult {
  isPaid: boolean;
  paymentLoading: boolean;
  /** Wraps an action behind payment. If already paid, runs action immediately. Otherwise opens Razorpay checkout first. */
  requirePayment: (onSuccess: () => void) => Promise<void>;
}

// Load Razorpay script once globally
let razorpayScriptLoaded = false;
function ensureRazorpayScript(): Promise<void> {
  if (razorpayScriptLoaded || typeof window === 'undefined') return Promise.resolve();
  if (document.querySelector('script[src*="razorpay"]')) {
    razorpayScriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => { razorpayScriptLoaded = true; resolve(); };
    s.onerror = () => resolve(); // fail silently
    document.head.appendChild(s);
  });
}

export function usePaymentGate({ agent, documentId }: UsePaymentGateOptions): UsePaymentGateResult {
  // BYPASS: skip all payment logic, allow free downloads
  if (BYPASS_PAYMENT) {
    return {
      isPaid: true,
      paymentLoading: false,
      requirePayment: async (onSuccess: () => void) => { onSuccess(); },
    };
  }

  const [isPaid, setIsPaid] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const checkedRef = useRef<string | null>(null);

  // Check payment status when documentId changes
  useEffect(() => {
    if (!documentId || checkedRef.current === documentId) return;
    checkedRef.current = documentId;

    fetch(`/api/payments/check?agent=${agent}&documentId=${documentId}`)
      .then(async (res) => {
        if (res.ok) {
          const d = await res.json();
          if (d.paid) setIsPaid(true);
          else setIsPaid(false);
        }
      })
      .catch(() => {});
  }, [agent, documentId]);

  // Reset when documentId changes
  useEffect(() => {
    setIsPaid(false);
    checkedRef.current = null;
  }, [documentId]);

  // Razorpay script loaded on-demand when payment is triggered (not eagerly)

  const requirePayment = useCallback(async (onSuccess: () => void) => {
    if (isPaid) { onSuccess(); return; }
    if (!documentId) return;

    setPaymentLoading(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, documentId }),
      });
      const orderData = await res.json();

      if (orderData.alreadyPaid) {
        setIsPaid(true);
        setPaymentLoading(false);
        onSuccess();
        return;
      }

      if (!res.ok) {
        alert(orderData.error || 'Failed to create payment order');
        setPaymentLoading(false);
        return;
      }

      await ensureRazorpayScript();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'OneAsy',
        description: orderData.description || 'Document Download',
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            setIsPaid(true);
            onSuccess();
          } else {
            alert('Payment verification failed. Please contact support.');
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => { setPaymentLoading(false); },
        },
        theme: { color: '#1e3a5f' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      alert('Payment failed. Please try again.');
      setPaymentLoading(false);
    }
  }, [isPaid, documentId, agent]);

  return { isPaid, paymentLoading, requirePayment };
}

/**
 * Imperative payment gate — use in grid/list views where document ID varies per click.
 * Returns a promise that resolves to true if payment succeeded (or was already paid).
 */
export async function requestPaymentForDocument(agent: Agent, documentId: string): Promise<boolean> {
  // BYPASS: skip payment, always allow
  if (BYPASS_PAYMENT) return true;

  // Check if already paid
  try {
    const checkRes = await fetch(`/api/payments/check?agent=${agent}&documentId=${documentId}`);
    if (checkRes.ok) {
      const d = await checkRes.json();
      if (d.paid) return true;
    }
  } catch { /* proceed to payment */ }

  // Create order
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent, documentId }),
  });
  const orderData = await res.json();

  if (orderData.alreadyPaid) return true;
  if (!res.ok) {
    alert(orderData.error || 'Failed to create payment order');
    return false;
  }

  await ensureRazorpayScript();

  return new Promise<boolean>((resolve) => {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'OneAsy',
      description: orderData.description || 'Document Download',
      order_id: orderData.orderId,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        });
        resolve(verifyRes.ok);
      },
      modal: {
        ondismiss: () => { resolve(false); },
      },
      theme: { color: '#1e3a5f' },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  });
}
