export const CAPA_STAGES = [
  "initiation",
  "root_cause_analysis",
  "action_assignment",
  "preventive_action",
  "verification",
  "effectiveness_check",
  "closure",
] as const;

export const CAPA_STAGE_LABELS: Record<string, string> = {
  initiation: "Initiation",
  root_cause_analysis: "Root Cause Analysis",
  action_assignment: "Action Assignment",
  preventive_action: "Preventive Action",
  verification: "Verification",
  effectiveness_check: "Effectiveness Check",
  closure: "Closure",
};

export const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

export const COMPLAINT_TYPES = [
  { value: "foreign_body", label: "Foreign Body" },
  { value: "allergen", label: "Allergen" },
  { value: "mislabeling", label: "Mislabeling" },
  { value: "quality_defect", label: "Quality Defect" },
  { value: "packaging", label: "Packaging" },
  { value: "taste_odor", label: "Taste/Odor" },
  { value: "microbiological", label: "Microbiological" },
  { value: "chemical", label: "Chemical" },
  { value: "other", label: "Other" },
] as const;

export const SOURCE_TYPES = [
  { value: "internal_audit", label: "Internal Audit" },
  { value: "external_audit", label: "External Audit" },
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "supplier_nonconformance", label: "Supplier NC" },
  { value: "internal", label: "Internal Finding" },
  { value: "regulatory", label: "Regulatory" },
] as const;

export function getAutoSeverity(type: string): string {
  if (["foreign_body", "allergen", "microbiological", "chemical"].includes(type)) return "critical";
  if (["mislabeling"].includes(type)) return "high";
  if (["quality_defect", "packaging"].includes(type)) return "medium";
  return "low";
}
