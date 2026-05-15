import dynamic from "next/dynamic";

const HomeContent = dynamic(() => import("@/features/salary/components/HomeContent"), {
  loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>,
});

export default function SalaryPage() {
  return <HomeContent />;
}
