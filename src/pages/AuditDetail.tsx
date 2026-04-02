import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SeverityBadge } from "@/components/SeverityBadge";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary border border-primary/30",
  in_progress: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  completed: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  cancelled: "bg-muted text-muted-foreground border border-border",
};

const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audit, setAudit] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingDialog, setFindingDialog] = useState(false);
  const [findingForm, setFindingForm] = useState({ description: "", severity: "minor", category: "", evidence: "" });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [auditRes, findingsRes] = await Promise.all([
      supabase.from("audits").select("*").eq("id", id).single(),
      supabase.from("audit_findings").select("*").eq("audit_id", id).order("finding_number", { ascending: true }),
    ]);
    setAudit(auditRes.data);
    setFindings(findingsRes.data ?? []);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completed_date = new Date().toISOString();
    const { error } = await supabase.from("audits").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Audit marked as ${status.replace(/_/g, " ")}`); fetchData(); }
  };

  const updateScore = async (score: string) => {
    const { error } = await supabase.from("audits").update({ score: Number(score) }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Score updated"); fetchData(); }
  };

  const addFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("audit_findings").insert({
      audit_id: id, description: findingForm.description,
      severity: findingForm.severity, category: findingForm.category || null,
      evidence: findingForm.evidence || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Finding added");
    setFindingDialog(false);
    setFindingForm({ description: "", severity: "minor", category: "", evidence: "" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!audit) return <div className="flex items-center justify-center h-64 text-muted-foreground">Audit not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/audits")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Audits</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{audit.audit_number}</h1>
            <span className={`status-badge ${STATUS_COLORS[audit.status] ?? ""}`}>{audit.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-lg mt-1">{audit.title}</p>
          <p className="text-muted-foreground text-sm mt-1">{audit.audit_type.toUpperCase()} audit · {audit.standard ?? "No standard"}</p>
        </div>
        <div className="flex gap-2">
          {audit.status === "scheduled" && <Button onClick={() => updateStatus("in_progress")}>Start Audit</Button>}
          {audit.status === "in_progress" && <Button onClick={() => updateStatus("completed")}>Complete Audit</Button>}
          {(audit.status === "scheduled" || audit.status === "in_progress") && <Button variant="outline" onClick={() => updateStatus("cancelled")}>Cancel</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Audit Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Scheduled:</span> <span className="ml-2">{audit.scheduled_date ? format(new Date(audit.scheduled_date), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Completed:</span> <span className="ml-2">{audit.completed_date ? format(new Date(audit.completed_date), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Score:</span> <span className="ml-2 font-mono font-bold">{audit.score != null ? `${audit.score}%` : "—"}</span></div>
              <div><span className="text-muted-foreground">Findings:</span> <span className="ml-2 font-bold">{findings.length}</span></div>
            </div>
            {audit.scope && <div className="mt-4"><span className="text-muted-foreground text-sm">Scope:</span><p className="text-sm mt-1">{audit.scope}</p></div>}
            {audit.summary && <div className="mt-4"><span className="text-muted-foreground text-sm">Summary:</span><p className="text-sm mt-1">{audit.summary}</p></div>}
          </div>

          {audit.status === "in_progress" || audit.status === "completed" ? (
            <div className="data-card">
              <h3 className="metric-label mb-3">Set Score</h3>
              <div className="flex gap-3">
                <Input type="number" min="0" max="100" placeholder="Score %" defaultValue={audit.score ?? ""} className="w-32"
                  onBlur={(e) => e.target.value && updateScore(e.target.value)} />
                <span className="text-sm text-muted-foreground self-center">out of 100</span>
              </div>
            </div>
          ) : null}

          {/* Findings */}
          <div className="data-card p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="metric-label">Audit Findings</h3>
              <Dialog open={findingDialog} onOpenChange={setFindingDialog}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-3 w-3" />Add Finding</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Finding</DialogTitle></DialogHeader>
                  <form onSubmit={addFinding} className="space-y-4">
                    <div className="space-y-2"><Label>Description *</Label><Textarea value={findingForm.description} onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Severity</Label>
                        <Select value={findingForm.severity} onValueChange={(v) => setFindingForm({ ...findingForm, severity: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="observation">Observation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Category</Label><Input value={findingForm.category} onChange={(e) => setFindingForm({ ...findingForm, category: e.target.value })} placeholder="e.g. Hygiene, Documentation" /></div>
                    </div>
                    <div className="space-y-2"><Label>Evidence</Label><Textarea value={findingForm.evidence} onChange={(e) => setFindingForm({ ...findingForm, evidence: e.target.value })} /></div>
                    <Button type="submit" className="w-full">Add Finding</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Description</TableHead><TableHead>Severity</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {findings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No findings recorded</TableCell></TableRow>
                ) : findings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono">{f.finding_number}</TableCell>
                    <TableCell className="max-w-[300px]">{f.description}</TableCell>
                    <TableCell><SeverityBadge severity={f.severity} /></TableCell>
                    <TableCell className="text-sm">{f.category ?? "—"}</TableCell>
                    <TableCell><span className={`status-badge ${f.status === "closed" ? "bg-muted text-muted-foreground border border-border" : "bg-primary/15 text-primary border border-primary/30"}`}>{f.status}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Critical</span><span className="font-bold text-severity-critical">{findings.filter(f => f.severity === "critical").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Major</span><span className="font-bold text-severity-high">{findings.filter(f => f.severity === "major").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Minor</span><span className="font-bold text-severity-medium">{findings.filter(f => f.severity === "minor").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Observations</span><span className="font-bold">{findings.filter(f => f.severity === "observation").length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetail;
