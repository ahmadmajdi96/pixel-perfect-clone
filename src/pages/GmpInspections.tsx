import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ClipboardCheck, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const GmpInspections = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("gmp_inspections").select("*").order("created_at", { ascending: false });
    setInspections(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("gmp_inspections").insert({
      inspection_type: fd.get("inspection_type") as string,
      area: fd.get("area") as string,
      inspector_name: fd.get("inspector_name") as string,
      scheduled_date: fd.get("scheduled_date") as string || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Inspection scheduled"); setShowDialog(false); fetchData(); }
  };

  const avgScore = inspections.filter(i => i.score_pct != null).length > 0
    ? (inspections.filter(i => i.score_pct != null).reduce((a, b) => a + Number(b.score_pct), 0) / inspections.filter(i => i.score_pct != null).length).toFixed(1)
    : "N/A";

  const filtered = inspections.filter(i =>
    i.area?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspection_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GMP Inspection Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Pre-op, post-op, and walkthrough inspections with digital checklists</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Inspection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule GMP Inspection</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Type</Label>
                <select name="inspection_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="pre_operational">Pre-Operational</option>
                  <option value="post_operational">Post-Operational</option>
                  <option value="walkthrough">Walkthrough</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
              <div><Label>Area</Label><Input name="area" required placeholder="e.g. Line 1, Warehouse A" /></div>
              <div><Label>Inspector</Label><Input name="inspector_name" /></div>
              <div><Label>Scheduled Date</Label><Input name="scheduled_date" type="date" /></div>
              <Button type="submit" className="w-full">Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="data-card text-center"><p className="metric-label">Total Inspections</p><p className="text-2xl font-bold mt-1">{inspections.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Avg Score</p><p className="text-2xl font-bold mt-1">{avgScore}%</p></div>
        <div className="data-card text-center"><p className="metric-label">Critical Failures</p><p className="text-2xl font-bold text-severity-critical mt-1">{inspections.reduce((a, b) => a + (b.critical_fail_count ?? 0), 0)}</p></div>
        <div className="data-card text-center"><p className="metric-label">Scheduled</p><p className="text-2xl font-bold mt-1">{inspections.filter(i => i.status === "scheduled").length}</p></div>
      </div>

      <Input placeholder="Search by area or type..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Type</TableHead><TableHead>Area</TableHead><TableHead>Inspector</TableHead><TableHead>Date</TableHead><TableHead>Score</TableHead><TableHead>Fails</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(i => (
              <TableRow key={i.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(i)}>
                <TableCell className="font-medium">{i.inspection_type?.replace("_", " ")}</TableCell>
                <TableCell>{i.area}</TableCell>
                <TableCell>{i.inspector_name ?? "—"}</TableCell>
                <TableCell className="text-xs">{i.scheduled_date ? format(new Date(i.scheduled_date), "PP") : "—"}</TableCell>
                <TableCell>
                  {i.score_pct != null ? (
                    <span className={`font-bold ${Number(i.score_pct) >= 95 ? "text-status-closed" : Number(i.score_pct) >= 80 ? "text-severity-medium" : "text-severity-critical"}`}>{i.score_pct}%</span>
                  ) : "—"}
                </TableCell>
                <TableCell>{(i.critical_fail_count ?? 0) > 0 ? <span className="text-severity-critical font-bold">{i.critical_fail_count}</span> : i.fail_count ?? 0}</TableCell>
                <TableCell><span className="status-badge">{i.status}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No inspections found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">Inspection Detail: {selected.area}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Type:</span> <span className="ml-2 font-medium capitalize">{selected.inspection_type?.replace("_", " ")}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="ml-2">{selected.area}</span></div>
            <div><span className="text-muted-foreground">Inspector:</span> <span className="ml-2">{selected.inspector_name ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Scheduled:</span> <span className="ml-2">{selected.scheduled_date ? format(new Date(selected.scheduled_date), "PPP") : "TBD"}</span></div>
            <div><span className="text-muted-foreground">Completed:</span> <span className="ml-2">{selected.completed_date ? format(new Date(selected.completed_date), "PPP") : "—"}</span></div>
            <div><span className="text-muted-foreground">Score:</span> <span className={`ml-2 font-bold ${Number(selected.score_pct) >= 95 ? "text-status-closed" : Number(selected.score_pct) >= 80 ? "text-severity-medium" : "text-severity-critical"}`}>{selected.score_pct ?? "—"}%</span></div>
            <div><span className="text-muted-foreground">Pass Count:</span> <span className="ml-2">{selected.pass_count ?? 0}</span></div>
            <div><span className="text-muted-foreground">Fail Count:</span> <span className="ml-2">{selected.fail_count ?? 0}</span></div>
            <div><span className="text-muted-foreground">Critical Fails:</span> <span className="ml-2 text-severity-critical font-bold">{selected.critical_fail_count ?? 0}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
          </div>
          {selected.notes && <p className="text-sm text-muted-foreground mt-3 p-3 rounded bg-accent/30">{selected.notes}</p>}
        </div>
      )}
    </div>
  );
};

export default GmpInspections;
