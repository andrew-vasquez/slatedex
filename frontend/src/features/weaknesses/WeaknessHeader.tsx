import AppHeader from "@/components/ui/AppHeader";

interface WeaknessHeaderProps {
  subtitle?: string;
  currentTool?: "weaknesses" | "type-chart";
}

export default function WeaknessHeader({
  subtitle = "Pokemon weakness lookup",
  currentTool = "weaknesses",
}: WeaknessHeaderProps) {
  const title = currentTool === "type-chart" ? "Type Chart" : "Weakness Tool";

  return (
    <AppHeader
      backHref="/"
      backLabel="Back to home"
      badge="Tools"
      mobileItems={[
        { href: "/play", label: "Launch Builder", description: "Build a team with coverage tools" },
        {
          href: "/weaknesses",
          label: "Weakness Tool",
          description: currentTool === "weaknesses" ? "You are here" : "Check full Pokemon weaknesses fast",
        },
        {
          href: "/type-chart",
          label: "Type Chart",
          description: currentTool === "type-chart" ? "You are here" : "See every type at a glance",
        },
      ]}
      bottomSlot={(
        <div>
          <p className="app-header-kicker">Battle Utility</p>
          <h1 className="app-header-title font-display">{title}</h1>
          <p className="app-header-subtitle">{subtitle}</p>
        </div>
      )}
    />
  );
}
