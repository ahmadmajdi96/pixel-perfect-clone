import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AlertTriangle, MessageSquareWarning, Truck, Plus, Calendar, TrendingUp, Wheat, GitBranch, ShieldAlert, Wrench, ClipboardList, Microscope, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";

const PARETO_COLORS = [
  "hsl(0 84% 60%)", "hsl(25 95% 53%)", "hsl(48 96% 53%)",
  "hsl(210 100% 56%)", "hsl(142 71% 45%)", "hsl(280 67% 60%)",
  "hsl(215 12% 50%)", "hsl(340 75% 55%)", "hsl(170 70% 40%)",
];

const RISK_COLORS: Record<string, string> = {
  low: "hsl(210 100% 56%)",
  medium: "hsl(48 96% 53%)",
  high: "hsl(25 95% 53%)",
  critical: "hsl(0 84% 60%)",
};

const TOOLTIP_STYLE = { backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 90%)" };

const Dashboard = () => {
  const navigate = useNavigate();
  const [capaSummary, setCapaSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  const [complaintCount, setComplaintCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [recentCapas, setRecentCapas] = useState<any[]>([]);
  const [complaintTrend, setComplaintTrend] = useState<any[]>([]);
  const [complaintByType, setComplaintByType] = useState<any[]>([]);
  const [overdueCapas, setOverdueCapas] = useState(0);
  const [avgDaysOpen, setAvgDaysOpen] = useState(0);
  const [suppliersByStatus, setSuppliersByStatus] = useState<Record<string, number>>({});
  const [cpmuByProduct, setCpmuByProduct] = useState<any[]>([]);
  const [allergenStats, setAllergenStats] = useState({ total: 0, verified: 0, highRisk: 0, riskData: [] as any[] });
  const [traceStats, setTraceStats] = useState({ totalLots: 0, quarantined: 0, recalled: 0, avgRecovery: 0 });
  const [calibrationStats, setCalibrationStats] = useState({ overdue: 0, dueSoon: 0, total: 0 });
  const [deviationStats, setDeviationStats] = useState({ open: 0, critical: 0 });
  const [empStats, setEmpStats] = useState({ pass: 0, fail: 0, pending: 0 });
  const [auditStats, setAuditStats] = useState({ scheduled: 0, completed: 0, avgScore: 0 });
  const [docStats, setDocStats] = useState({ total: 0, pendingApproval: 0 });
  const [trainingStats, setTrainingStats] = useState({ expiringSoon: 0, failRate: 0 });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    const [
      capaRes, complaintRes, supplierRes, recentRes, complaintsAll,
      allergenRes, lotsRes, recallsRes, instrumentsRes, devsRes,
      empRes, auditRes, docRes, trainingRes,
    ] = await Promise.all([
      supabase.from("capas").select("severity, status, created_at, sla_deadline").neq("status", "closure"),
      supabase.from("complaints").select("*", { count: "exact", head: true }).in("status", ["logged", "investigating"]),
      supabase.from("suppliers").select("status"),
      supabase.from("capas").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("complaints").select("created_at, complaint_type, product").gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString()).order("created_at", { ascending: true }),
      supabase.from("allergen_profiles").select("*"),
      supabase.from("traceability_lots").select("status"),
      supabase.from("recall_exercises").select("recovery_rate_pct, status"),
      supabase.from("calibration_instruments").select("status"),
      supabase.from("deviations").select("status, severity").in("status", ["open", "investigating"]),
      supabase.from("emp_sample_results").select("result").limit(200),
      supabase.from("audits").select("status, score"),
      supabase.from("documents").select("status"),
      supabase.from("training_records").select("result, qualification_expiry"),
    ]);

    // CAPAs
    const capas = capaRes.data ?? [];
    const summary = { critical: 0, high: 0, medium: 0, low: 0, total: capas.length };
    let totalDays = 0, overdue = 0;
    capas.forEach((c) => {
      if (c.severity in summary) summary[c.severity as keyof typeof summary]++;
      totalDays += (Date.now() - new Date(c.created_at).getTime()) / 86400000;
      if (c.sla_deadline && new Date(c.sla_deadline) < new Date()) overdue++;
    });
    setCapaSummary(summary);
    setAvgDaysOpen(capas.length > 0 ? Math.round(totalDays / capas.length) : 0);
    setOverdueCapas(overdue);
    setComplaintCount(complaintRes.count ?? 0);
    setRecentCapas(recentRes.data ?? []);

    // Suppliers
    const suppliers = supplierRes.data ?? [];
    setSupplierCount(suppliers.length);
    const byStatus: Record<string, number> = {};
    suppliers.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
    setSuppliersByStatus(byStatus);

    // Complaint analytics
    const complaints = complaintsAll.data ?? [];
    if (complaints.length) {
      const byWeek: Record<string, number> = {};
      complaints.forEach((c) => {
        const d = new Date(c.created_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        byWeek[key] = (byWeek[key] || 0) + 1;
      });
      setComplaintTrend(Object.entries(byWeek).map(([date, count]) => ({ date, count })));

      const byType: Record<string, number> = {};
      complaints.forEach((c) => { byType[c.complaint_type] = (byType[c.complaint_type] || 0) + 1; });
      setComplaintByType(Object.entries(byType).map(([type, count]) => ({ type: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), count })).sort((a, b) => b.count - a.count));

      const byProduct: Record<string, number> = {};
      complaints.forEach((c) => { byProduct[c.product] = (byProduct[c.product] || 0) + 1; });
      setCpmuByProduct(Object.entries(byProduct).map(([product, count]) => ({ product, complaints: count })).sort((a, b) => b.complaints - a.complaints).slice(0, 8));
    }

    // Allergens
    const allergens = allergenRes.data ?? [];
    if (allergens.length) {
      const riskBuckets = [
        { name: "Low (0-3)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) <= 3).length, fill: RISK_COLORS.low },
        { name: "Medium (4-6)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 4 && (a.cross_contact_risk_score ?? 0) <= 6).length, fill: RISK_COLORS.medium },
        { name: "High (7-8)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 7 && (a.cross_contact_risk_score ?? 0) <= 8).length, fill: RISK_COLORS.high },
        { name: "Critical (9-10)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 9).length, fill: RISK_COLORS.critical },
      ];
      setAllergenStats({ total: allergens.length, verified: allergens.filter(a => a.label_status === "verified").length, highRisk: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 7).length, riskData: riskBuckets });
    }

    // Traceability
    const lots = lotsRes.data ?? [];
    const recalls = recallsRes.data ?? [];
    const completed = recalls.filter(r => r.recovery_rate_pct != null);
    setTraceStats({
      totalLots: lots.length,
      quarantined: lots.filter(l => l.status === "quarantined").length,
      recalled: lots.filter(l => l.status === "recalled").length,
      avgRecovery: completed.length > 0 ? Math.round(completed.reduce((s, r) => s + Number(r.recovery_rate_pct), 0) / completed.length * 10) / 10 : 0,
    });

    // Calibration
    const instruments = instrumentsRes.data ?? [];
    setCalibrationStats({ overdue: instruments.filter(i => i.status === "overdue").length, dueSoon: instruments.filter(i => i.status === "due_soon").length, total: instruments.length });

    // Deviations
    const devs = devsRes.data ?? [];
    setDeviationStats({ open: devs.length, critical: devs.filter(d => d.severity === "critical").length });

    // EMP
    const empResults = empRes.data ?? [];
    setEmpStats({ pass: empResults.filter(r => r.result === "pass").length, fail: empResults.filter(r => r.result === "fail").length, pending: empResults.filter(r => r.result === "pending").length });

    // Audits
    const audits = auditRes.data ?? [];
    const completedAudits = audits.filter(a => a.status === "completed" && a.score != null);
    setAuditStats({
      scheduled: audits.filter(a => a.status === "scheduled").length,
      completed: completedAudits.length,
      avgScore: completedAudits.length > 0 ? Math.round(completedAudits.reduce((s, a) => s + Number(a.score), 0) / completedAudits.length) : 0,
    });

    // Docs
    const docs = docRes.data ?? [];
    setDocStats({ total: docs.length, pendingApproval: docs.filter(d => d.status === "pending_approval").length });

    // Training
    const training = trainingRes.data ?? [];
    const thirtyDays = new Date(Date.now() + 30 * 86400000);
    setTrainingStats({
      expiringSoon: training.filter(t => t.qualification_expiry && new Date(t.qualification_expiry) < thirtyDays && new Date(t.qualification_expiry) > new Date()).length,
      failRate: training.length > 0 ? Math.round(training.filter(t => t.result === "fail").length / training.length * 100) : 0,
    });
  };

  const capaComplianceRate = capaSummary.total > 0 ? Math.round(((capaSummary.total - overdueCapas) / capaSummary.total) * 100) : 100;
  const empPassRate = (empStats.pass + empStats.fail) > 0 ? Math.round(empStats.pass / (empStats.pass + empStats.fail) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quality Dashboard</h1>
          <p className="metric-label mt-1">Real-time quality metrics & compliance overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/complaints/new")} size="sm">
            <MessageSquareWarning className="mr-2 h-4 w-4" />Log Complaint
          </Button>
          <Button onClick={() => navigate("/capa/new")} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />Create CAPA
          </Button>
        </div>
      </div>

      {/* Compliance Score Banner */}
      <div className="data-card bg-gradient-to-r from-card to-secondary/30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="metric-label mb-2">CAPA SLA Compliance</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-mono font-bold ${capaComplianceRate >= 90 ? "text-status-closed" : capaComplianceRate >= 70 ? "text-severity-medium" : "text-severity-critical"}`}>{capaComplianceRate}%</span>
            </div>
            <Progress value={capaComplianceRate} className="mt-2 h-1.5" />
          </div>
          <div>
            <p className="metric-label mb-2">EMP Pass Rate</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-mono font-bold ${empPassRate >= 95 ? "text-status-closed" : empPassRate >= 80 ? "text-severity-medium" : "text-severity-critical"}`}>{empPassRate}%</span>
            </div>
            <Progress value={empPassRate} className="mt-2 h-1.5" />
          </div>
          <div>
            <p className="metric-label mb-2">Avg Audit Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-mono font-bold ${auditStats.avgScore >= 85 ? "text-status-closed" : auditStats.avgScore >= 70 ? "text-severity-medium" : "text-severity-critical"}`}>{auditStats.avgScore || "—"}%</span>
            </div>
            <Progress value={auditStats.avgScore} className="mt-2 h-1.5" />
          </div>
          <div>
            <p className="metric-label mb-2">Recall Recovery Avg</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-mono font-bold ${traceStats.avgRecovery >= 95 ? "text-status-closed" : traceStats.avgRecovery >= 80 ? "text-severity-medium" : "text-severity-critical"}`}>{traceStats.avgRecovery || "—"}%</span>
            </div>
            <Progress value={traceStats.avgRecovery} className="mt-2 h-1.5" />
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="data-card cursor-pointer" onClick={() => navigate("/capa")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Open CAPAs</span>
            <AlertTriangle className="h-4 w-4 text-severity-high" />
          </div>
          <div className="metric-value">{capaSummary.total}</div>
          <div className="mt-3 flex gap-1 flex-wrap">
            {capaSummary.critical > 0 && <SeverityBadge severity="critical" />}
            {capaSummary.high > 0 && <SeverityBadge severity="high" />}
            {capaSummary.medium > 0 && <SeverityBadge severity="medium" />}
            {capaSummary.low > 0 && <SeverityBadge severity="low" />}
          </div>
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/complaints")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Active Complaints</span>
            <MessageSquareWarning className="h-4 w-4 text-severity-medium" />
          </div>
          <div className="metric-value">{complaintCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Logged + Investigating</p>
        </div>

        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Overdue CAPAs</span>
            <Calendar className="h-4 w-4 text-severity-critical" />
          </div>
          <div className="metric-value text-severity-critical">{overdueCapas}</div>
          <p className="text-xs text-muted-foreground mt-1">Past SLA deadline</p>
        </div>

        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Avg Days Open</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{avgDaysOpen}</div>
          <p className="text-xs text-muted-foreground mt-1">Active CAPAs average age</p>
        </div>
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="data-card cursor-pointer" onClick={() => navigate("/suppliers")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Suppliers</span>
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{supplierCount}</div>
          <div className="mt-2 flex gap-2 text-xs flex-wrap">
            {suppliersByStatus.approved && <span className="text-status-closed">{suppliersByStatus.approved} approved</span>}
            {suppliersByStatus.conditional && <span className="text-severity-medium">{suppliersByStatus.conditional} conditional</span>}
            {suppliersByStatus.suspended && <span className="text-severity-high">{suppliersByStatus.suspended} suspended</span>}
          </div>
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/deviations")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Open Deviations</span>
            <ShieldAlert className="h-4 w-4 text-severity-high" />
          </div>
          <div className="metric-value">{deviationStats.open}</div>
          {deviationStats.critical > 0 && <p className="text-xs text-severity-critical mt-1">{deviationStats.critical} critical</p>}
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/calibration")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Calibration</span>
            <Wrench className="h-4 w-4 text-severity-medium" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="metric-value text-severity-critical">{calibrationStats.overdue}</span>
              <span className="text-xs text-muted-foreground ml-1">overdue</span>
            </div>
            <div>
              <span className="metric-value text-severity-medium">{calibrationStats.dueSoon}</span>
              <span className="text-xs text-muted-foreground ml-1">due soon</span>
            </div>
          </div>
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/emp")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">EMP Results</span>
            <Microscope className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="metric-value text-status-closed">{empStats.pass}</span>
              <span className="text-xs text-muted-foreground ml-1">pass</span>
            </div>
            <div>
              <span className="metric-value text-severity-critical">{empStats.fail}</span>
              <span className="text-xs text-muted-foreground ml-1">fail</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row 3 - Secondary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="data-card cursor-pointer" onClick={() => navigate("/traceability")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Traceability</span>
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{traceStats.totalLots}</div>
          <div className="mt-2 flex gap-2 text-xs flex-wrap">
            {traceStats.quarantined > 0 && <span className="text-severity-high">{traceStats.quarantined} quarantined</span>}
            {traceStats.recalled > 0 && <span className="text-severity-critical">{traceStats.recalled} recalled</span>}
          </div>
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/audits")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Audits</span>
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="metric-value">{auditStats.scheduled}</span>
              <span className="text-xs text-muted-foreground ml-1">upcoming</span>
            </div>
            <div>
              <span className="metric-value text-status-closed">{auditStats.completed}</span>
              <span className="text-xs text-muted-foreground ml-1">done</span>
            </div>
          </div>
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/documents")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Documents</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{docStats.total}</div>
          {docStats.pendingApproval > 0 && <p className="text-xs text-severity-medium mt-1">{docStats.pendingApproval} pending approval</p>}
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/allergens")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Allergen Risk</span>
            <Wheat className="h-4 w-4 text-severity-medium" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="metric-value">{allergenStats.total}</span>
              <span className="text-xs text-muted-foreground ml-1">profiles</span>
            </div>
            {allergenStats.highRisk > 0 && (
              <div>
                <span className="metric-value text-severity-critical">{allergenStats.highRisk}</span>
                <span className="text-xs text-muted-foreground ml-1">high risk</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="data-card">
          <h3 className="metric-label mb-4">Complaint Trend (90 Days — Weekly)</h3>
          {complaintTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={complaintTrend}>
                <defs>
                  <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210 100% 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210 100% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="hsl(210 100% 56%)" strokeWidth={2} fill="url(#complaintGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">No complaint data yet</div>
          )}
        </div>

        <div className="data-card">
          <h3 className="metric-label mb-4">Complaint Type Pareto</h3>
          {complaintByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complaintByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="type" tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {complaintByType.map((_, i) => (
                    <Cell key={i} fill={PARETO_COLORS[i % PARETO_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">No complaint data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="data-card">
          <h3 className="metric-label mb-4">Allergen Cross-Contact Risk Distribution</h3>
          {allergenStats.riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={allergenStats.riskData} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {allergenStats.riskData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">No allergen data</div>
          )}
        </div>

        <div className="data-card">
          <h3 className="metric-label mb-4">CAPA by Severity</h3>
          <div className="space-y-3">
            {(["critical", "high", "medium", "low"] as const).map((sev) => {
              const count = capaSummary[sev] as number;
              const maxCount = Math.max(capaSummary.critical, capaSummary.high, capaSummary.medium, capaSummary.low, 1);
              return (
                <div key={sev} className="flex items-center gap-3">
                  <span className="text-xs capitalize w-14">{sev}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-severity-${sev}`} style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className={`font-mono font-bold text-sm w-6 text-right text-severity-${sev}`}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <p className="metric-label mb-2">CPMU by Product (90d)</p>
            {cpmuByProduct.length > 0 ? (
              <div className="space-y-1.5 text-sm max-h-[120px] overflow-y-auto scrollbar-thin">
                {cpmuByProduct.map((p) => (
                  <div key={p.product} className="flex justify-between items-center">
                    <span className="truncate max-w-[200px]">{p.product}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (p.complaints / (cpmuByProduct[0]?.complaints || 1)) * 100)}%` }} />
                      </div>
                      <span className="font-mono font-bold w-8 text-right">{p.complaints}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent CAPAs */}
      <div className="data-card">
        <h3 className="metric-label mb-4">Recent CAPAs</h3>
        {recentCapas.length > 0 ? (
          <div className="space-y-3">
            {recentCapas.map((capa) => (
              <div key={capa.id} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/capa/${capa.id}`)}>
                <div className="flex items-center gap-4">
                  <p className="font-mono font-medium text-sm">{capa.capa_number}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">{capa.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  {capa.sla_deadline && new Date(capa.sla_deadline) < new Date() && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-severity-critical">Overdue</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(capa.created_at))} ago</span>
                  <SeverityBadge severity={capa.severity} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">No CAPAs created yet</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
