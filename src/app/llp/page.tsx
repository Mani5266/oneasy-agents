import dynamic from "next/dynamic";

const LLPApp = dynamic(() => import("@/features/llp/components/LLPApp"), {
  loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>,
});

export default function LLPPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      <LLPApp />
    </div>
  );
}
