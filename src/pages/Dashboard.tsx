import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    // Fetch open CAPAs by severity
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

    // Fetch active complaints count
    const { count } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .in("status", ["logged", "investigating"]);
    setComplaintCount(count ?? 0);

    // Fetch supplier count
    const { count: sCount } = await supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true });
    setSupplierCount(sCount ?? 0);

    // Recent CAPAs
    const { data: recent } = await supabase
      .from("capas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentCapas(recent ?? []);

    // Complaint trend (last 30 days mock - use real data if available)
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
          <p className="text-sm text-muted-foreground">Real-time quality metrics overview</p>
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/capa")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open CAPAs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-severity-high" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{capaSummary.total}</div>
            <div className="mt-2 flex gap-1">
              {capaSummary.critical > 0 && <SeverityBadge severity="critical" />}
              {capaSummary.high > 0 && <SeverityBadge severity="high" />}
              {capaSummary.medium > 0 && <SeverityBadge severity="medium" />}
              {capaSummary.low > 0 && <SeverityBadge severity="low" />}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/complaints")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-severity-medium" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{complaintCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged + Investigating</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suppliers")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{supplierCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAPA by Severity</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Critical</span><span className="font-bold text-severity-critical">{capaSummary.critical}</span></div>
              <div className="flex justify-between"><span>High</span><span className="font-bold text-severity-high">{capaSummary.high}</span></div>
              <div className="flex justify-between"><span>Medium</span><span className="font-bold text-severity-medium">{capaSummary.medium}</span></div>
              <div className="flex justify-between"><span>Low</span><span className="font-bold text-severity-low">{capaSummary.low}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complaint Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {complaintTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={complaintTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                No complaint data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent CAPAs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCapas.length > 0 ? (
              <div className="space-y-3">
                {recentCapas.map((capa) => (
                  <div
                    key={capa.id}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/capa/${capa.id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{capa.capa_number}</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
