import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const capaStatusLabels: Record<string, string> = {
  initiation: "Initiation",
  root_cause_analysis: "RCA",
  action_assignment: "Action Assignment",
  preventive_action: "Preventive Action",
  verification: "Verification",
  effectiveness_check: "Effectiveness Check",
  closure: "Closure",
};

const supplierStatusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-status-closed text-white border-transparent" },
  conditional: { label: "Conditional", className: "bg-severity-medium text-black border-transparent" },
  suspended: { label: "Suspended", className: "bg-severity-high text-white border-transparent" },
  rejected: { label: "Rejected", className: "bg-severity-critical text-white border-transparent" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-transparent" },
};

const complaintStatusConfig: Record<string, { label: string; className: string }> = {
  logged: { label: "Logged", className: "bg-status-open text-white border-transparent" },
  investigating: { label: "Investigating", className: "bg-status-in-progress text-black border-transparent" },
  resolved: { label: "Resolved", className: "bg-status-closed text-white border-transparent" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-transparent" },
};

export function CapaStatusBadge({ status }: { status: string }) {
  const label = capaStatusLabels[status] ?? status;
  const isEarly = ["initiation", "root_cause_analysis"].includes(status);
  const isMid = ["action_assignment", "preventive_action"].includes(status);
  const isDone = status === "closure";
  const className = isDone
    ? "bg-status-closed text-white border-transparent"
    : isMid
    ? "bg-status-in-progress text-black border-transparent"
    : isEarly
    ? "bg-status-open text-white border-transparent"
    : "bg-primary text-primary-foreground border-transparent";
  return <Badge className={cn(className)}>{label}</Badge>;
}

export function SupplierStatusBadge({ status }: { status: string }) {
  const config = supplierStatusConfig[status] ?? supplierStatusConfig.pending;
  return <Badge className={cn(config.className)}>{config.label}</Badge>;
}

export function ComplaintStatusBadge({ status }: { status: string }) {
  const config = complaintStatusConfig[status] ?? complaintStatusConfig.logged;
  return <Badge className={cn(config.className)}>{config.label}</Badge>;
}
