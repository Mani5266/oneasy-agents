import dynamic from 'next/dynamic';

const PartnershipClient = dynamic(() => import('./PartnershipClient'), {
  loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>,
});

export default function PartnershipPage() {
  return <PartnershipClient />;
}
