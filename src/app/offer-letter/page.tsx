import dynamic from 'next/dynamic';

const OfferLetterApp = dynamic(() => import('@/features/offer-letter/components/OfferLetterApp'), {
  loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>,
});

export default function OfferLetterPage() {
  return <OfferLetterApp />;
}
