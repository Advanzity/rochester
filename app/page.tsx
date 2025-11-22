import { PageShell } from "@/components/PageShell";
import { AppTile } from "@/components/AppTile";
import { BarChart3, Scale } from "lucide-react";

export default function Home() {
  const marketBoardApp = {
    label: "Market Board",
    description: "Metals, crypto & FX",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/market-board",
    active: true,
  };

  const goldScrapApp = {
    label: "Gold Scrap",
    description: "Pricing calculator",
    icon: <Scale className="w-5 h-5" />,
    href: "/gold-scrap",
    active: true,
  };

  const placeholderTiles = Array.from({ length: 1 }, (_, i) => ({
    label: "Reserved",
    description: "Future app",
    active: false,
    icon: undefined,
    href: undefined,
  }));

  const allApps = [marketBoardApp, goldScrapApp, ...placeholderTiles];

  return (
    <PageShell
      title="Dashboard Apps"
      subtitle="Rochester Jewelry & Coin · Back Office"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {allApps.map((app, index) => (
          <AppTile
            key={index}
            label={app.label}
            description={app.description}
            icon={app.icon}
            href={app.href}
            active={app.active}
          />
        ))}
      </div>
    </PageShell>
  );
}
