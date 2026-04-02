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
  approved: {
    label: "Approved",
    className: "status-badge bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  },
  conditional: {
    label: "Conditional",
    className: "status-badge bg-[hsl(var(--severity-medium)/0.15)] text-severity-medium border border-[hsl(var(--severity-medium)/0.3)]",
  },
  suspended: {
    label: "Suspended",
    className: "status-badge bg-[hsl(var(--severity-high)/0.15)] text-severity-high border border-[hsl(var(--severity-high)/0.3)]",
  },
  rejected: {
    label: "Rejected",
    className: "status-badge bg-[hsl(var(--severity-critical)/0.15)] text-severity-critical border border-[hsl(var(--severity-critical)/0.3)]",
  },
  pending: {
    label: "Pending",
    className: "status-badge bg-muted text-muted-foreground border border-border",
  },
};

const complaintStatusConfig: Record<string, { label: string; className: string }> = {
  logged: {
    label: "Logged",
    className: "status-badge bg-[hsl(var(--status-open)/0.15)] text-primary border border-[hsl(var(--status-open)/0.3)]",
  },
  investigating: {
    label: "Investigating",
    className: "status-badge bg-[hsl(var(--status-in-progress)/0.15)] text-status-in-progress border border-[hsl(var(--status-in-progress)/0.3)]",
  },
  resolved: {
    label: "Resolved",
    className: "status-badge bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  },
  closed: {
    label: "Closed",
    className: "status-badge bg-muted text-muted-foreground border border-border",
  },
};

export function CapaStatusBadge({ status }: { status: string }) {
  const label = capaStatusLabels[status] ?? status;
  const isEarly = ["initiation", "root_cause_analysis"].includes(status);
  const isMid = ["action_assignment", "preventive_action"].includes(status);
  const isDone = status === "closure";
  const className = isDone
    ? "status-badge bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]"
    : isMid
    ? "status-badge bg-[hsl(var(--status-in-progress)/0.15)] text-status-in-progress border border-[hsl(var(--status-in-progress)/0.3)]"
    : isEarly
    ? "status-badge bg-[hsl(var(--status-open)/0.15)] text-primary border border-[hsl(var(--status-open)/0.3)]"
    : "status-badge bg-[hsl(var(--primary)/0.15)] text-primary border border-[hsl(var(--primary)/0.3)]";
  return <span className={cn(className)}>{label}</span>;
}

export function SupplierStatusBadge({ status }: { status: string }) {
  const config = supplierStatusConfig[status] ?? supplierStatusConfig.pending;
  return <span className={cn(config.className)}>{config.label}</span>;
}

export function ComplaintStatusBadge({ status }: { status: string }) {
  const config = complaintStatusConfig[status] ?? complaintStatusConfig.logged;
  return <span className={cn(config.className)}>{config.label}</span>;
}
