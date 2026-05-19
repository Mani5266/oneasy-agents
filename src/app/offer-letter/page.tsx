"use client";

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const OfferLetterApp = dynamic(() => import('@/features/offer-letter/components/OfferLetterApp'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>,
});

export default function OfferLetterPage() {
  return <ErrorBoundary><OfferLetterApp /></ErrorBoundary>;
}
