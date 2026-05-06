import type { Metadata } from 'next';
import './offer-letter.css';

export const metadata: Metadata = {
  title: 'Offer Letter Generator | OnEasy',
  description: 'Generate professional offer letters and appointment letters for your organization.',
};

export default function OfferLetterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
