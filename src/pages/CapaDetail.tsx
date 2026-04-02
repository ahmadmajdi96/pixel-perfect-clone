import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CapaStatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CAPA_STAGES, CAPA_STAGE_LABELS } from "@/lib/constants";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, ChevronRight, Plus, CheckCircle2, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CapaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [capa, setCapa] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newAction, setNewAction] = useState({ description: "", action_type: "corrective" });
  const [rcaNotes, setRcaNotes] = useState("");
  const [effectivenessResult, setEffectivenessResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRca, setSavingRca] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [capaRes, actionsRes, timelineRes] = await Promise.all([
      supabase.from("capas").select("*").eq("id", id).single(),
      supabase.from("capa_actions").select("*").eq("capa_id", id).order("created_at"),
      supabase.from("capa_timeline").select("*").eq("capa_id", id).order("created_at", { ascending: false }),
    ]);
    setCapa(capaRes.data);
    setRcaNotes((capaRes.data as any)?.root_cause_notes ?? "");
    setEffectivenessResult((capaRes.data as any)?.effectiveness_result ?? "");
    setActions(actionsRes.data ?? []);
    setTimeline(timelineRes.data ?? []);
    setLoading(false);
  };

  const advanceStage = async () => {
    if (!capa) return;
    const currentIndex = CAPA_STAGES.indexOf(capa.status);
    if (currentIndex >= CAPA_STAGES.length - 1) return;
    const nextStage = CAPA_STAGES[currentIndex + 1];
    const { error } = await supabase
      .from("capas")
      .update({
        status: nextStage,
        ...(nextStage === "closure" ? { closed_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("capa_timeline").insert({
      capa_id: id, user_id: user?.id, event_type: "stage_change",
      description: `Advanced to ${CAPA_STAGE_LABELS[nextStage]}`,
    });
    toast.success(`Advanced to ${CAPA_STAGE_LABELS[nextStage]}`);
    fetchData();
  };

  const saveRcaNotes = async () => {
    setSavingRca(true);
    const { error } = await supabase.from("capas").update({ root_cause_notes: rcaNotes } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("RCA notes saved");
      await supabase.from("capa_timeline").insert({
        capa_id: id, user_id: user?.id, event_type: "rca_updated",
        description: "Root cause analysis updated",
      });
    }
    setSavingRca(false);
  };

  const verifyCapaAction = async () => {
    const { error } = await supabase.from("capas").update({
      verified_by: user?.id, verified_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("capa_timeline").insert({
      capa_id: id, user_id: user?.id, event_type: "verification",
      description: "CAPA verified and signed off",
    });
    toast.success("Verification sign-off recorded");
    fetchData();
  };

  const saveEffectivenessCheck = async () => {
    const { error } = await supabase.from("capas").update({
      effectiveness_result: effectivenessResult,
      effectiveness_check_date: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("capa_timeline").insert({
      capa_id: id, user_id: user?.id, event_type: "effectiveness_check",
      description: `Effectiveness check completed: ${effectivenessResult}`,
    });
    toast.success("Effectiveness check saved");
    fetchData();
  };

  const addAction = async () => {
    if (!newAction.description.trim()) return;
    const { error } = await supabase.from("capa_actions").insert({
      capa_id: id, description: newAction.description,
      action_type: newAction.action_type, assigned_to: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setNewAction({ description: "", action_type: "corrective" });
    toast.success("Action added");
    fetchData();
  };

  const toggleAction = async (actionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await supabase.from("capa_actions").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", actionId);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!capa) return <div className="flex items-center justify-center h-64 text-muted-foreground">CAPA not found</div>;

  const currentIndex = CAPA_STAGES.indexOf(capa.status);
  const completedActions = actions.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/capa")} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to CAPAs
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{capa.capa_number}</h1>
            <SeverityBadge severity={capa.severity} />
            <CapaStatusBadge status={capa.status} />
            {capa.sla_deadline && new Date(capa.sla_deadline) < new Date() && capa.status !== "closure" && (
              <span className="status-badge bg-[hsl(var(--severity-critical)/0.15)] text-severity-critical border border-[hsl(var(--severity-critical)/0.3)]">
                Overdue
              </span>
            )}
          </div>
          <h2 className="text-lg text-muted-foreground mt-1">{capa.title}</h2>
        </div>
        {capa.status !== "closure" && (
          <Button onClick={advanceStage}>
            Advance to {CAPA_STAGE_LABELS[CAPA_STAGES[currentIndex + 1]]}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stage Progress */}
      <div className="data-card">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {CAPA_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center">
              <div className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                i < currentIndex ? "status-badge bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]" :
                i === currentIndex ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {CAPA_STAGE_LABELS[stage]}
              </div>
              {i < CAPA_STAGES.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="data-card">
            <h3 className="metric-label mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Source:</span> <span className="ml-2">{capa.source_type}</span></div>
                <div><span className="text-muted-foreground">Product/Line:</span> <span className="ml-2">{capa.product_line || "—"}</span></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{format(new Date(capa.created_at), "PPp")}</span></div>
                <div><span className="text-muted-foreground">SLA:</span> <span className="ml-2">{capa.sla_deadline ? formatDistanceToNow(new Date(capa.sla_deadline), { addSuffix: true }) : "—"}</span></div>
              </div>
              {capa.description && <><Separator /><p>{capa.description}</p></>}
            </div>
          </div>

          {/* RCA Section */}
          {(capa.status === "root_cause_analysis" || currentIndex > 1) && (
            <div className="data-card">
              <h3 className="metric-label mb-4">Root Cause Analysis — 5-Why Template</h3>
              <Textarea
                placeholder={"Why 1: What happened?\n\nWhy 2: Why did that happen?\n\nWhy 3: Why did that cause occur?\n\nWhy 4: What is the underlying reason?\n\nWhy 5: What is the root cause?"}
                value={rcaNotes}
                onChange={(e) => setRcaNotes(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex justify-end mt-3">
                <Button size="sm" onClick={saveRcaNotes} disabled={savingRca}>
                  {savingRca ? "Saving..." : "Save RCA Notes"}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="metric-label">Actions</h3>
              <span className="text-xs text-muted-foreground">{completedActions}/{actions.length} completed</span>
            </div>
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={action.status === "completed"}
                    onChange={() => toggleAction(action.id, action.status)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${action.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                        action.action_type === "corrective" ? "text-severity-high" : "text-primary"
                      }`}>{action.action_type}</span>
                      {action.completed_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Completed {format(new Date(action.completed_at), "PP")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Select value={newAction.action_type} onValueChange={(v) => setNewAction({ ...newAction, action_type: v })}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add action..."
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addAction()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Verification Panel */}
          {(capa.status === "verification" || currentIndex > 4) && (
            <div className="data-card">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="metric-label">Verification Sign-Off</h3>
              </div>
              {(capa as any).verified_at ? (
                <div className="flex items-center gap-2 text-sm text-status-closed">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verified on {format(new Date((capa as any).verified_at), "PPp")}</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Confirm that all corrective and preventive actions have been implemented and are effective.
                  </p>
                  <Button size="sm" onClick={verifyCapaAction}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sign Off Verification
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Effectiveness Check Panel */}
          {(capa.status === "effectiveness_check" || currentIndex > 5) && (
            <div className="data-card">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-status-closed" />
                <h3 className="metric-label">Effectiveness Check (30/60/90 Day)</h3>
              </div>
              {(capa as any).effectiveness_check_date ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-status-closed">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Checked on {format(new Date((capa as any).effectiveness_check_date), "PPp")}</span>
                  </div>
                  <p className="text-muted-foreground">Result: {(capa as any).effectiveness_result}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Result Assessment</Label>
                    <Select value={effectivenessResult} onValueChange={setEffectivenessResult}>
                      <SelectTrigger><SelectValue placeholder="Select result..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="effective">Effective — Issue resolved</SelectItem>
                        <SelectItem value="partially_effective">Partially Effective — Needs improvement</SelectItem>
                        <SelectItem value="not_effective">Not Effective — Reopen required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={saveEffectivenessCheck} disabled={!effectivenessResult}>
                    Record Effectiveness Check
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Audit Trail</h3>
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div key={entry.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "PPp")}
                  </p>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No events yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapaDetail;
