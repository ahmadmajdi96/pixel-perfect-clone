import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, Shield, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

const UnifiedDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    // Aggregate recent events from multiple tables
    const [capas, complaints, deviations, audits] = await Promise.all([
      supabase.from("capas").select("id, capa_number, title, severity, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("complaints").select("id, complaint_number, product, severity, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("deviations").select("id, deviation_number, title, severity, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("audits").select("id, audit_number, title, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const unified = [
      ...(capas.data ?? []).map(c => ({ ...c, source: "CAPA", ref: c.capa_number, name: c.title, link: `/capa/${c.id}` })),
      ...(complaints.data ?? []).map(c => ({ ...c, source: "Complaint", ref: c.complaint_number, name: c.product, link: `/complaints/${c.id}` })),
      ...(deviations.data ?? []).map(d => ({ ...d, source: "Deviation", ref: d.deviation_number, name: d.title, link: `/deviations/${d.id}` })),
      ...(audits.data ?? []).map(a => ({ ...a, source: "Audit", ref: a.audit_number, name: a.title, link: `/audits/${a.id}` })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setEvents(unified);
    setLoading(false);
  };

  const sourceColors: Record<string, string> = {
    CAPA: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
    Complaint: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
    Deviation: "bg-severity-high/15 text-severity-high border border-severity-high/30",
    Audit: "bg-primary/15 text-primary border border-primary/30",
  };

  const sourceIcons: Record<string, React.ReactNode> = {
    CAPA: <AlertTriangle className="h-4 w-4" />,
    Complaint: <FileText className="h-4 w-4" />,
    Deviation: <Shield className="h-4 w-4" />,
    Audit: <Activity className="h-4 w-4" />,
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cross-Department Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Unified real-time feed of quality, safety, and production events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["CAPA", "Complaint", "Deviation", "Audit"].map(source => (
          <div key={source} className="data-card text-center">
            <div className="flex items-center justify-center gap-2">
              {sourceIcons[source]}
              <p className="metric-label">{source}s</p>
            </div>
            <p className="text-2xl font-bold mt-1">{events.filter(e => e.source === source).length}</p>
          </div>
        ))}
      </div>

      <div className="data-card">
        <h3 className="metric-label mb-4">Unified Event Timeline</h3>
        <div className="space-y-3">
          {events.map((event, i) => (
            <div key={`${event.source}-${event.id}-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = event.link}>
              <div className="mt-0.5">{sourceIcons[event.source]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`status-badge text-[10px] ${sourceColors[event.source]}`}>{event.source}</span>
                  <span className="font-mono text-xs text-muted-foreground">{event.ref}</span>
                </div>
                <p className="text-sm font-medium mt-1 truncate">{event.name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="status-badge text-[10px]">{event.status}</span>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(event.created_at), "PP")}</p>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-center text-muted-foreground py-8">No events</p>}
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
