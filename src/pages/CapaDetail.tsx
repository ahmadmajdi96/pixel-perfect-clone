import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CapaStatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CAPA_STAGES, CAPA_STAGE_LABELS } from "@/lib/constants";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";

const CapaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [capa, setCapa] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newAction, setNewAction] = useState({ description: "", action_type: "corrective" });
  const [rcaNotes, setRcaNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const [capaRes, actionsRes, timelineRes] = await Promise.all([
      supabase.from("capas").select("*").eq("id", id).single(),
      supabase.from("capa_actions").select("*").eq("capa_id", id).order("created_at"),
      supabase.from("capa_timeline").select("*").eq("capa_id", id).order("created_at", { ascending: false }),
    ]);
    setCapa(capaRes.data);
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
      capa_id: id,
      user_id: user?.id,
      event_type: "stage_change",
      description: `Advanced to ${CAPA_STAGE_LABELS[nextStage]}`,
    });
    toast.success(`Advanced to ${CAPA_STAGE_LABELS[nextStage]}`);
    fetchData();
  };

  const addAction = async () => {
    if (!newAction.description.trim()) return;
    const { error } = await supabase.from("capa_actions").insert({
      capa_id: id,
      description: newAction.description,
      action_type: newAction.action_type,
      assigned_to: user?.id,
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {CAPA_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <div className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                  i < currentIndex ? "bg-status-closed text-white" :
                  i === currentIndex ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {CAPA_STAGE_LABELS[stage]}
                </div>
                {i < CAPA_STAGES.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Source:</span> <span className="ml-2">{capa.source_type}</span></div>
                <div><span className="text-muted-foreground">Product/Line:</span> <span className="ml-2">{capa.product_line || "—"}</span></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{format(new Date(capa.created_at), "PPp")}</span></div>
                <div><span className="text-muted-foreground">SLA:</span> <span className="ml-2">{capa.sla_deadline ? formatDistanceToNow(new Date(capa.sla_deadline), { addSuffix: true }) : "—"}</span></div>
              </div>
              {capa.description && <><Separator /><p>{capa.description}</p></>}
            </CardContent>
          </Card>

          {/* RCA Section */}
          {(capa.status === "root_cause_analysis" || currentIndex > 1) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Root Cause Analysis — 5-Why Template</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Why 1: ...&#10;Why 2: ...&#10;Why 3: ...&#10;Why 4: ...&#10;Why 5: (Root Cause)"
                  value={rcaNotes}
                  onChange={(e) => setRcaNotes(e.target.value)}
                  rows={6}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={action.status === "completed"}
                    onChange={() => toggleAction(action.id, action.status)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${action.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {action.description}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{action.action_type}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add action..."
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addAction()}
                />
                <Button size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Audit Trail</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CapaDetail;
