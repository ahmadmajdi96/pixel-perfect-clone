import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SeverityBadge } from "@/components/SeverityBadge";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/15 text-primary border border-primary/30",
  investigating: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  dispositioned: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  closed: "bg-muted text-muted-foreground border border-border",
};

const DeviationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deviation, setDeviation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [disposition, setDisposition] = useState("");

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data } = await supabase.from("deviations").select("*").eq("id", id).single();
    setDeviation(data);
    setNotes(data?.investigation_notes ?? "");
    setDisposition(data?.disposition ?? "");
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    const updates: any = { status };
    if (status === "closed") updates.closed_at = new Date().toISOString();
    const { error } = await supabase.from("deviations").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status updated to ${status}`); fetchData(); }
  };

  const saveNotes = async () => {
    const { error } = await supabase.from("deviations").update({ investigation_notes: notes, disposition: disposition || null }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Notes saved");
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!deviation) return <div className="flex items-center justify-center h-64 text-muted-foreground">Deviation not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/deviations")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Deviations</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deviation.deviation_number}</h1>
            <SeverityBadge severity={deviation.severity} />
            <span className={`status-badge ${STATUS_COLORS[deviation.status] ?? ""}`}>{deviation.status}</span>
          </div>
          <p className="text-lg mt-1">{deviation.title}</p>
        </div>
        <div className="flex gap-2">
          {deviation.status === "open" && <Button onClick={() => updateStatus("investigating")}>Start Investigation</Button>}
          {deviation.status === "investigating" && <Button onClick={() => updateStatus("dispositioned")}>Set Disposition</Button>}
          {deviation.status === "dispositioned" && <Button onClick={() => updateStatus("closed")}>Close</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Deviation Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="ml-2 uppercase font-semibold">{deviation.type}</span></div>
              <div><span className="text-muted-foreground">Source:</span> <span className="ml-2">{deviation.source ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Product:</span> <span className="ml-2">{deviation.product_affected ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Batch:</span> <span className="ml-2 font-mono">{deviation.batch_affected ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Reported:</span> <span className="ml-2">{format(new Date(deviation.created_at), "PPP")}</span></div>
              <div><span className="text-muted-foreground">Closed:</span> <span className="ml-2">{deviation.closed_at ? format(new Date(deviation.closed_at), "PPP") : "—"}</span></div>
            </div>
            {deviation.description && <p className="text-sm mt-4 text-muted-foreground">{deviation.description}</p>}
          </div>

          <div className="data-card">
            <h3 className="metric-label mb-4">Investigation & Disposition</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Investigation Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Disposition</label>
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger><SelectValue placeholder="Select disposition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="use_as_is">Use As Is</SelectItem>
                    <SelectItem value="rework">Rework</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveNotes}>Save Notes</Button>
            </div>
          </div>
        </div>

        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Linked CAPA</h3>
            {deviation.capa_id ? (
              <Button variant="outline" className="w-full" onClick={() => navigate(`/capa/${deviation.capa_id}`)}>View CAPA →</Button>
            ) : (
              <p className="text-sm text-muted-foreground">No CAPA linked to this deviation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviationDetail;
