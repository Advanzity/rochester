interface ReserveCardProps {
  type: "crypto" | "fx";
}

export function ReserveCard({ type }: ReserveCardProps) {
  const label = type === "crypto" ? "Future coin configuration" : "Future FX pair";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center min-h-[240px]">
      <div className="text-xs text-gray-400 tracking-widest uppercase font-mono mb-2">
        RESERVED SLOT
      </div>
      <p className="text-sm text-gray-500 text-center">{label}</p>
    </div>
  );
}
