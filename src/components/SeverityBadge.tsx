import { cn } from "@/lib/utils";

const severityConfig = {
  critical: {
    label: "Critical",
    className: "status-badge bg-[hsl(var(--severity-critical)/0.15)] text-severity-critical border border-[hsl(var(--severity-critical)/0.3)]",
  },
  high: {
    label: "High",
    className: "status-badge bg-[hsl(var(--severity-high)/0.15)] text-severity-high border border-[hsl(var(--severity-high)/0.3)]",
  },
  medium: {
    label: "Medium",
    className: "status-badge bg-[hsl(var(--severity-medium)/0.15)] text-severity-medium border border-[hsl(var(--severity-medium)/0.3)]",
  },
  low: {
    label: "Low",
    className: "status-badge bg-[hsl(var(--severity-low)/0.15)] text-severity-low border border-[hsl(var(--severity-low)/0.3)]",
  },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity as keyof typeof severityConfig] ?? severityConfig.medium;
  return <span className={cn(config.className)}>{config.label}</span>;
}
