import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const RESULT_COLORS: Record<string, string> = {
  pass: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  fail: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  pending: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
};

const TrainingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data } = await supabase.from("training_records").select("*").eq("id", id).single();
    setRecord(data);
    setLoading(false);
  };

  const updateResult = async (result: string) => {
    const { error } = await supabase.from("training_records").update({ result: result as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Result updated"); fetchData(); }
  };

  const updateEffectiveness = async (score: string) => {
    const { error } = await supabase.from("training_records").update({
      effectiveness_assessed: true, effectiveness_score: Number(score),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Effectiveness recorded"); fetchData(); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!record) return <div className="flex items-center justify-center h-64 text-muted-foreground">Record not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/training")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Training</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{record.topic}</h1>
          <p className="text-muted-foreground mt-1">{record.employee_name} · {format(new Date(record.training_date), "PPP")}</p>
        </div>
        <span className={`status-badge ${RESULT_COLORS[record.result] ?? ""}`}>{record.result}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Training Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Employee:</span> <span className="ml-2 font-semibold">{record.employee_name}</span></div>
              <div><span className="text-muted-foreground">Employee ID:</span> <span className="ml-2 font-mono">{record.employee_id_ref ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Trainer:</span> <span className="ml-2">{record.trainer ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Format:</span> <span className="ml-2">{record.format ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Qualification:</span> <span className="ml-2">{record.qualification_name ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Qualification Expiry:</span> <span className="ml-2">{record.qualification_expiry ? format(new Date(record.qualification_expiry), "PPP") : "—"}</span></div>
            </div>
            {record.notes && <p className="text-sm mt-4 text-muted-foreground">{record.notes}</p>}
          </div>

          {record.result === "pending" && (
            <div className="data-card">
              <h3 className="metric-label mb-3">Update Result</h3>
              <div className="flex gap-3">
                <Button onClick={() => updateResult("pass")} className="bg-status-closed hover:bg-status-closed/80">Mark Pass</Button>
                <Button variant="destructive" onClick={() => updateResult("fail")}>Mark Fail</Button>
              </div>
            </div>
          )}

          <div className="data-card">
            <h3 className="metric-label mb-3">Effectiveness Assessment</h3>
            {record.effectiveness_assessed ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Score:</span>
                <span className="ml-2 font-mono font-bold text-lg">{record.effectiveness_score}%</span>
              </div>
            ) : (
              <div className="flex gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Score (0–100)</Label>
                  <Input type="number" min="0" max="100" className="w-24" id="eff-score" />
                </div>
                <Button size="sm" onClick={() => {
                  const val = (document.getElementById("eff-score") as HTMLInputElement).value;
                  if (val) updateEffectiveness(val);
                }}>Record</Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Status</h3>
            <div className="text-center">
              <span className={`status-badge text-lg ${RESULT_COLORS[record.result] ?? ""}`}>{record.result.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;
