import Link from "next/link";
import { ReactNode } from "react";

interface AppTileProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  active?: boolean;
}

export function AppTile({
  label,
  description,
  icon,
  href,
  active = false,
}: AppTileProps) {
  const content = (
    <div
      className={`
        relative bg-white rounded-lg p-4 h-32 flex flex-col justify-between
        transition-all duration-200
        ${
          active
            ? "border-2 border-orange-500 hover:shadow-md hover:border-orange-600 cursor-pointer"
            : "border border-gray-200"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`text-sm font-bold tracking-wide ${
              active ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {label}
          </h3>
        </div>
        {icon && (
          <div className={active ? "text-orange-600" : "text-gray-300"}>
            {icon}
          </div>
        )}
      </div>

      {description && (
        <p
          className={`text-xs ${
            active ? "text-gray-600" : "text-gray-400"
          } leading-relaxed`}
        >
          {description}
        </p>
      )}

      {active && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>
      )}
    </div>
  );

  if (href && active) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
