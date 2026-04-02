import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AlertTriangle, MessageSquareWarning, Truck, Plus, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [capaSummary, setCapaSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  const [complaintCount, setComplaintCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [recentCapas, setRecentCapas] = useState<any[]>([]);
  const [complaintTrend, setComplaintTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: capas } = await supabase
      .from("capas")
      .select("severity, status")
      .neq("status", "closure");

    if (capas) {
      const summary = { critical: 0, high: 0, medium: 0, low: 0, total: capas.length };
      capas.forEach((c) => {
        if (c.severity in summary) summary[c.severity as keyof typeof summary]++;
      });
      setCapaSummary(summary);
    }

    const { count } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .in("status", ["logged", "investigating"]);
    setComplaintCount(count ?? 0);

    const { count: sCount } = await supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true });
    setSupplierCount(sCount ?? 0);

    const { data: recent } = await supabase
      .from("capas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentCapas(recent ?? []);

    const { data: complaints } = await supabase
      .from("complaints")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    if (complaints) {
      const byDay: Record<string, number> = {};
      complaints.forEach((c) => {
        const day = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        byDay[day] = (byDay[day] || 0) + 1;
      });
      setComplaintTrend(Object.entries(byDay).map(([date, count]) => ({ date, count })));
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
            <MessageSquareWarning className="mr-2 h-4 w-4" />
            Log Complaint
          </Button>
          <Button onClick={() => navigate("/capa/new")} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create CAPA
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="data-card cursor-pointer" onClick={() => navigate("/capa")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Open CAPAs</span>
            <AlertTriangle className="h-4 w-4 text-severity-high" />
          </div>
          <div className="metric-value">{capaSummary.total}</div>
          <div className="mt-3 flex gap-1">
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

        <div className="data-card cursor-pointer" onClick={() => navigate("/suppliers")}>
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">Suppliers</span>
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <div className="metric-value">{supplierCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Total registered</p>
        </div>

        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <span className="metric-label">CAPA by Severity</span>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span>Critical</span><span className="font-mono font-bold text-severity-critical">{capaSummary.critical}</span></div>
            <div className="flex justify-between"><span>High</span><span className="font-mono font-bold text-severity-high">{capaSummary.high}</span></div>
            <div className="flex justify-between"><span>Medium</span><span className="font-mono font-bold text-severity-medium">{capaSummary.medium}</span></div>
            <div className="flex justify-between"><span>Low</span><span className="font-mono font-bold text-severity-low">{capaSummary.low}</span></div>
          </div>
        </div>
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="data-card">
          <h3 className="metric-label mb-4">Complaint Trend (30 Days)</h3>
          {complaintTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={complaintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 12%)",
                    border: "1px solid hsl(220 14% 18%)",
                    borderRadius: "8px",
                    color: "hsl(210 20% 90%)",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(210 100% 56%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
              No complaint data yet
            </div>
          )}
        </div>

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
                  <div>
                    <p className="font-mono font-medium text-sm">{capa.capa_number}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{capa.title}</p>
                  </div>
                  <SeverityBadge severity={capa.severity} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
              No CAPAs created yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
