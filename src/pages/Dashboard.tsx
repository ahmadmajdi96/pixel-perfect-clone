import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AlertTriangle, MessageSquareWarning, Truck, Plus, ClipboardList, Calendar, TrendingUp, Wheat, GitBranch, ShieldAlert, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

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
  const [calibrationStats, setCalibrationStats] = useState({ overdue: 0, dueSoon: 0 });
  const [deviationStats, setDeviationStats] = useState({ open: 0, critical: 0 });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    // Open CAPAs by severity
    const { data: capas } = await supabase
      .from("capas").select("severity, status, created_at, sla_deadline").neq("status", "closure");
    if (capas) {
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
    }

    // Active complaints
    const { count } = await supabase.from("complaints").select("*", { count: "exact", head: true }).in("status", ["logged", "investigating"]);
    setComplaintCount(count ?? 0);

    // Suppliers
    const { data: suppliers } = await supabase.from("suppliers").select("status");
    setSupplierCount(suppliers?.length ?? 0);
    if (suppliers) {
      const byStatus: Record<string, number> = {};
      suppliers.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
      setSuppliersByStatus(byStatus);
    }

    // Recent CAPAs
    const { data: recent } = await supabase.from("capas").select("*").order("created_at", { ascending: false }).limit(5);
    setRecentCapas(recent ?? []);

    // Complaint trend (90 days for better data)
    const { data: complaints } = await supabase.from("complaints")
      .select("created_at, complaint_type, product")
      .gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString())
      .order("created_at", { ascending: true });

    if (complaints) {
      const byDay: Record<string, number> = {};
      complaints.forEach((c) => {
        const day = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        byDay[day] = (byDay[day] || 0) + 1;
      });
      setComplaintTrend(Object.entries(byDay).map(([date, count]) => ({ date, count })));

      const byType: Record<string, number> = {};
      complaints.forEach((c) => { byType[c.complaint_type] = (byType[c.complaint_type] || 0) + 1; });
      setComplaintByType(Object.entries(byType)
        .map(([type, count]) => ({ type: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), count }))
        .sort((a, b) => b.count - a.count));

      const byProduct: Record<string, number> = {};
      complaints.forEach((c) => { byProduct[c.product] = (byProduct[c.product] || 0) + 1; });
      setCpmuByProduct(Object.entries(byProduct)
        .map(([product, count]) => ({ product, complaints: count }))
        .sort((a, b) => b.complaints - a.complaints).slice(0, 8));
    }

    // Allergen stats
    const { data: allergens } = await supabase.from("allergen_profiles").select("*");
    if (allergens) {
      const riskBuckets = [
        { name: "Low (0-3)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) <= 3).length, fill: RISK_COLORS.low },
        { name: "Medium (4-6)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 4 && (a.cross_contact_risk_score ?? 0) <= 6).length, fill: RISK_COLORS.medium },
        { name: "High (7-8)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 7 && (a.cross_contact_risk_score ?? 0) <= 8).length, fill: RISK_COLORS.high },
        { name: "Critical (9-10)", count: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 9).length, fill: RISK_COLORS.critical },
      ];
      setAllergenStats({
        total: allergens.length,
        verified: allergens.filter(a => a.label_status === "verified").length,
        highRisk: allergens.filter(a => (a.cross_contact_risk_score ?? 0) >= 7).length,
        riskData: riskBuckets,
      });
    }

    // Traceability stats
    const { data: lots } = await supabase.from("traceability_lots").select("status");
    const { data: recalls } = await supabase.from("recall_exercises").select("recovery_rate_pct, status");
    if (lots) {
      const completed = recalls?.filter(r => r.recovery_rate_pct != null) ?? [];
      setTraceStats({
        totalLots: lots.length,
        quarantined: lots.filter(l => l.status === "quarantined").length,
        recalled: lots.filter(l => l.status === "recalled").length,
        avgRecovery: completed.length > 0 ? Math.round(completed.reduce((s, r) => s + Number(r.recovery_rate_pct), 0) / completed.length * 10) / 10 : 0,
      });
    }

    // Calibration
    const { data: instruments } = await supabase.from("calibration_instruments").select("status");
    if (instruments) {
      setCalibrationStats({
        overdue: instruments.filter(i => i.status === "overdue").length,
        dueSoon: instruments.filter(i => i.status === "due_soon").length,
      });
    }

    // Deviations
    const { data: devs } = await supabase.from("deviations").select("status, severity").in("status", ["open", "investigating"]);
    if (devs) {
      setDeviationStats({
        open: devs.length,
        critical: devs.filter(d => d.severity === "critical").length,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quality Dashboard</h1>
          <p className="metric-label mt-1">Real-time quality metrics overview</p>
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

      {/* KPI Row 2 - Extended */}
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
          {deviationStats.critical > 0 && (
            <p className="text-xs text-severity-critical mt-1">{deviationStats.critical} critical</p>
          )}
        </div>

        <div className="data-card cursor-pointer" onClick={() => navigate("/calibration")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Calibration Alerts</span>
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

        <div className="data-card cursor-pointer" onClick={() => navigate("/traceability")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Traceability</span>
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{traceStats.totalLots} lots</div>
          <div className="mt-2 flex gap-2 text-xs flex-wrap">
            {traceStats.quarantined > 0 && <span className="text-severity-high">{traceStats.quarantined} quarantined</span>}
            {traceStats.recalled > 0 && <span className="text-severity-critical">{traceStats.recalled} recalled</span>}
            {traceStats.avgRecovery > 0 && <span className="text-status-closed">{traceStats.avgRecovery}% avg recovery</span>}
          </div>
        </div>
      </div>

      {/* Allergen Risk + CAPA Severity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="data-card cursor-pointer" onClick={() => navigate("/allergens")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="metric-label">Allergen Cross-Contact Risk</h3>
            <Wheat className="h-4 w-4 text-severity-medium" />
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div><span className="text-2xl font-bold">{allergenStats.total}</span><span className="text-xs text-muted-foreground ml-1">profiles</span></div>
            <div><span className="text-2xl font-bold text-status-closed">{allergenStats.verified}</span><span className="text-xs text-muted-foreground ml-1">verified</span></div>
            <div><span className="text-2xl font-bold text-severity-critical">{allergenStats.highRisk}</span><span className="text-xs text-muted-foreground ml-1">high risk</span></div>
          </div>
          {allergenStats.riskData.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={allergenStats.riskData} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 90%)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {allergenStats.riskData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="data-card">
          <h3 className="metric-label mb-4">CAPA by Severity</h3>
          <div className="space-y-3">
            {["critical", "high", "medium", "low"].map((sev) => {
              const count = capaSummary[sev as keyof typeof capaSummary] as number;
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
          {/* CPMU mini table */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="data-card">
          <h3 className="metric-label mb-4">Complaint Trend (90 Days)</h3>
          {complaintTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={complaintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 90%)" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(210 100% 56%)" strokeWidth={2} dot={false} />
              </LineChart>
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
                <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 90%)" }} />
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

      {/* Recent CAPAs */}
      <div className="data-card">
        <h3 className="metric-label mb-4">Recent CAPAs</h3>
        {recentCapas.length > 0 ? (
          <div className="space-y-3">
            {recentCapas.map((capa) => (
              <div
                key={capa.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/capa/${capa.id}`)}
              >
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
