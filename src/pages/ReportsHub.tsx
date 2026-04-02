import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, BarChart3, AlertTriangle, MessageSquareWarning, ClipboardList, Truck, Shield } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";

type ReportType = "capa_trend" | "complaint_cpmu" | "audit_summary" | "supplier_scorecard" | "deviation_summary" | "training_matrix";

const REPORTS: { type: ReportType; title: string; desc: string; icon: any }[] = [
  { type: "capa_trend", title: "CAPA Trend Report", desc: "Open/closed CAPAs over time with severity breakdown", icon: AlertTriangle },
  { type: "complaint_cpmu", title: "Complaint CPMU Report", desc: "Complaints per million units by product & type", icon: MessageSquareWarning },
  { type: "audit_summary", title: "Audit Summary Report", desc: "Audit scores, findings count & status overview", icon: ClipboardList },
  { type: "supplier_scorecard", title: "Supplier Scorecard Report", desc: "Supplier performance scores and qualification status", icon: Truck },
  { type: "deviation_summary", title: "Deviation Summary", desc: "Deviation trends by type and severity", icon: BarChart3 },
  { type: "training_matrix", title: "Training Matrix Report", desc: "Employee training completion and qualification status", icon: Shield },
];

const downloadCSV = (rows: Record<string, any>[], filename: string) => {
  if (rows.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => {
    const val = r[h];
    const str = val === null || val === undefined ? "" : String(val);
    return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
};

const ReportsHub = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [period, setPeriod] = useState("90");

  const generateReport = async (type: ReportType) => {
    setGenerating(type);
    const since = subDays(new Date(), parseInt(period)).toISOString();
    try {
      switch (type) {
        case "capa_trend": {
          const { data } = await supabase.from("capas").select("capa_number, title, status, severity, created_at, closed_at, sla_deadline").gte("created_at", since).order("created_at", { ascending: false });
          downloadCSV((data ?? []).map(c => ({
            "CAPA #": c.capa_number, Title: c.title, Status: c.status, Severity: c.severity,
            "Created": format(new Date(c.created_at), "yyyy-MM-dd"),
            "Closed": c.closed_at ? format(new Date(c.closed_at), "yyyy-MM-dd") : "",
            "SLA Deadline": c.sla_deadline ? format(new Date(c.sla_deadline), "yyyy-MM-dd") : "",
            "Cycle Days": c.closed_at ? Math.round((new Date(c.closed_at).getTime() - new Date(c.created_at).getTime()) / 86400000) : "",
          })), `capa_trend_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
        case "complaint_cpmu": {
          const { data } = await supabase.from("complaints").select("complaint_number, product, complaint_type, severity, status, created_at, resolved_at, regulatory_flag").gte("created_at", since).order("created_at", { ascending: false });
          downloadCSV((data ?? []).map(c => ({
            "Complaint #": c.complaint_number, Product: c.product, Type: c.complaint_type, Severity: c.severity, Status: c.status,
            "Regulatory Flag": c.regulatory_flag ? "Yes" : "No",
            "Created": format(new Date(c.created_at), "yyyy-MM-dd"),
            "Resolved": c.resolved_at ? format(new Date(c.resolved_at), "yyyy-MM-dd") : "",
          })), `complaint_cpmu_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
        case "audit_summary": {
          const { data: audits } = await supabase.from("audits").select("audit_number, title, audit_type, status, score, scheduled_date, completed_date, standard").order("created_at", { ascending: false });
          const { data: findings } = await supabase.from("audit_findings").select("audit_id, severity, status");
          const findingsMap = (findings ?? []).reduce((m: any, f) => { m[f.audit_id] = (m[f.audit_id] || 0) + 1; return m; }, {});
          downloadCSV((audits ?? []).map(a => ({
            "Audit #": a.audit_number, Title: a.title, Type: a.audit_type, Status: a.status,
            Score: a.score ?? "", Standard: a.standard ?? "",
            "Findings Count": findingsMap[a.id] ?? 0,
            "Scheduled": a.scheduled_date ? format(new Date(a.scheduled_date), "yyyy-MM-dd") : "",
            "Completed": a.completed_date ? format(new Date(a.completed_date), "yyyy-MM-dd") : "",
          })), `audit_summary_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
        case "supplier_scorecard": {
          const { data: suppliers } = await supabase.from("suppliers").select("name, code, status, country, last_audit_date");
          const { data: scores } = await supabase.from("supplier_scorecards").select("supplier_id, period, overall_score, quality_score, delivery_score, compliance_score");
          const scoreMap = (scores ?? []).reduce((m: any, s) => { if (!m[s.supplier_id] || s.period > m[s.supplier_id].period) m[s.supplier_id] = s; return m; }, {} as any);
          downloadCSV((suppliers ?? []).map((s: any) => {
            const sc = scoreMap[s.id];
            return {
              Name: s.name, Code: s.code ?? "", Status: s.status, Country: s.country ?? "",
              "Last Audit": s.last_audit_date ? format(new Date(s.last_audit_date), "yyyy-MM-dd") : "",
              "Overall Score": sc?.overall_score ?? "", "Quality": sc?.quality_score ?? "",
              "Delivery": sc?.delivery_score ?? "", "Compliance": sc?.compliance_score ?? "",
            };
          }), `supplier_scorecard_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
        case "deviation_summary": {
          const { data } = await supabase.from("deviations").select("deviation_number, title, type, severity, status, product_affected, batch_affected, created_at, closed_at").gte("created_at", since).order("created_at", { ascending: false });
          downloadCSV((data ?? []).map(d => ({
            "Deviation #": d.deviation_number, Title: d.title, Type: d.type, Severity: d.severity, Status: d.status,
            Product: d.product_affected ?? "", Batch: d.batch_affected ?? "",
            "Created": format(new Date(d.created_at), "yyyy-MM-dd"),
            "Closed": d.closed_at ? format(new Date(d.closed_at), "yyyy-MM-dd") : "",
          })), `deviation_summary_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
        case "training_matrix": {
          const { data } = await supabase.from("training_records").select("employee_name, topic, trainer, training_date, result, effectiveness_assessed, effectiveness_score, qualification_name, qualification_expiry").order("training_date", { ascending: false });
          downloadCSV((data ?? []).map(t => ({
            Employee: t.employee_name, Topic: t.topic, Trainer: t.trainer ?? "",
            Date: format(new Date(t.training_date), "yyyy-MM-dd"), Result: t.result,
            "Effectiveness Assessed": t.effectiveness_assessed ? "Yes" : "No",
            "Score": t.effectiveness_score ?? "",
            Qualification: t.qualification_name ?? "",
            "Qualification Expiry": t.qualification_expiry ? format(new Date(t.qualification_expiry), "yyyy-MM-dd") : "",
          })), `training_matrix_${format(new Date(), "yyyyMMdd")}.csv`);
          break;
        }
      }
    } catch (err: any) { toast.error(err.message); }
    setGenerating(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Hub</h1>
        <p className="text-sm text-muted-foreground">Generate and download QMS reports</p>
      </div>

      <div className="flex items-center gap-3">
        <Label>Report Period:</Label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(r => (
          <Card key={r.type} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription className="text-xs">{r.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => generateReport(r.type)} disabled={generating === r.type}>
                <Download className="mr-2 h-4 w-4" />
                {generating === r.type ? "Generating..." : "Download CSV"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsHub;
