interface SectionHeaderProps {
  label: string;
  subtitle?: string;
}

export function SectionHeader({ label, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xs text-gray-700 tracking-widest uppercase font-bold mb-1">
        {label}
      </h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
