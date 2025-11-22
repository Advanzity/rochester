import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-grotesk">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 tracking-wide">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
