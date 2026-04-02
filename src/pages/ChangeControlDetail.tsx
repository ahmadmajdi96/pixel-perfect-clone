import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-primary/15 text-primary border border-primary/30",
  risk_assessment: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  pending_approval: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  approved: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  implementing: "bg-primary/15 text-primary border border-primary/30",
  effectiveness_check: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  closed: "bg-muted text-muted-foreground border border-border",
  rejected: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
};

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  initiated: { label: "Begin Risk Assessment", value: "risk_assessment" },
  risk_assessment: { label: "Submit for Approval", value: "pending_approval" },
  pending_approval: { label: "Approve", value: "approved" },
  approved: { label: "Begin Implementation", value: "implementing" },
  implementing: { label: "Check Effectiveness", value: "effectiveness_check" },
  effectiveness_check: { label: "Close", value: "closed" },
};

const ChangeControlDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [change, setChange] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data } = await supabase.from("change_requests").select("*").eq("id", id).single();
    setChange(data);
    setLoading(false);
  };

  const advanceStatus = async (status: string) => {
    const updates: any = { status };
    if (status === "implementing") updates.implemented_by = user?.id;
    if (status === "closed") updates.closed_at = new Date().toISOString();
    const { error } = await supabase.from("change_requests").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status updated`); fetchData(); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!change) return <div className="flex items-center justify-center h-64 text-muted-foreground">Change request not found</div>;

  const next = NEXT_STATUS[change.status];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/change-control")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Change Control</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{change.change_number}</h1>
            <span className={`status-badge ${STATUS_COLORS[change.status] ?? ""}`}>{change.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-lg mt-1">{change.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{change.change_type.toUpperCase()} change · Risk: {change.risk_level ?? "Not assessed"}</p>
        </div>
        <div className="flex gap-2">
          {next && <Button onClick={() => advanceStatus(next.value)}>{next.label}</Button>}
          {change.status === "pending_approval" && <Button variant="destructive" onClick={() => advanceStatus("rejected")}>Reject</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Change Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Target Date:</span> <span className="ml-2">{change.target_date ? format(new Date(change.target_date), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{format(new Date(change.created_at), "PPP")}</span></div>
              <div><span className="text-muted-foreground">Implemented:</span> <span className="ml-2">{change.implemented_at ? format(new Date(change.implemented_at), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Closed:</span> <span className="ml-2">{change.closed_at ? format(new Date(change.closed_at), "PPP") : "—"}</span></div>
            </div>
            {change.description && <p className="text-sm mt-4">{change.description}</p>}
            {change.reason && <div className="mt-3"><span className="text-muted-foreground text-sm">Reason:</span><p className="text-sm mt-1">{change.reason}</p></div>}
          </div>

          <div className="data-card">
            <h3 className="metric-label mb-4">Impact Assessment</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Food Safety:</span> <span className="ml-2">{change.food_safety_impact ?? "Not assessed"}</span></div>
              <div><span className="text-muted-foreground">Quality:</span> <span className="ml-2">{change.quality_impact ?? "Not assessed"}</span></div>
              <div><span className="text-muted-foreground">Regulatory:</span> <span className="ml-2">{change.regulatory_impact ?? "Not assessed"}</span></div>
              <div><span className="text-muted-foreground">Operational:</span> <span className="ml-2">{change.operational_impact ?? "Not assessed"}</span></div>
            </div>
          </div>

          {change.effectiveness_result && (
            <div className="data-card">
              <h3 className="metric-label mb-3">Effectiveness Check</h3>
              <p className="text-sm">{change.effectiveness_result}</p>
            </div>
          )}
        </div>

        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Workflow Progress</h3>
            <div className="space-y-2">
              {["initiated", "risk_assessment", "pending_approval", "approved", "implementing", "effectiveness_check", "closed"].map((s, i, arr) => {
                const idx = arr.indexOf(change.status);
                const done = i <= idx;
                return (
                  <div key={s} className={`text-xs px-3 py-2 rounded ${done ? "bg-primary/15 text-primary font-semibold" : "bg-muted/50 text-muted-foreground"}`}>
                    {s.replace(/_/g, " ").toUpperCase()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeControlDetail;
