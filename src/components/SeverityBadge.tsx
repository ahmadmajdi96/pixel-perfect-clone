import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: { label: "Critical", className: "bg-severity-critical text-white border-transparent" },
  high: { label: "High", className: "bg-severity-high text-white border-transparent" },
  medium: { label: "Medium", className: "bg-severity-medium text-black border-transparent" },
  low: { label: "Low", className: "bg-severity-low text-white border-transparent" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity as keyof typeof severityConfig] ?? severityConfig.medium;
  return <Badge className={cn(config.className)}>{config.label}</Badge>;
}
