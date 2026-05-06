import { ToastProvider } from '@/features/partnership/components/Toast';
import './partnership.css';

export default function PartnershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {/* Back to Dashboard breadcrumb */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-sm border-b border-navy-100 px-4 py-2 flex items-center gap-2 text-sm">
        <a
          href="/dashboard"
          className="text-navy-500 hover:text-accent transition-colors font-medium"
        >
          Dashboard
        </a>
        <span className="text-navy-300">/</span>
        <span className="text-navy-700 font-semibold">Partnership Deed</span>
      </div>
      <div className="pt-10">
        {children}
      </div>
    </ToastProvider>
  );
}
