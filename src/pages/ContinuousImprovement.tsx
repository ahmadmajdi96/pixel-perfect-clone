import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  plan: "bg-primary/15 text-primary border border-primary/30",
  do: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  check: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  act: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  completed: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
};

const ContinuousImprovement = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("improvement_projects").select("*").order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("improvement_projects").insert({
      title: fd.get("title") as string,
      methodology: fd.get("methodology") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      owner: fd.get("owner") as string,
      target_metric: fd.get("target_metric") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Project created"); setShowDialog(false); fetchData(); }
  };

  const totalSavings = projects.reduce((a, b) => a + Number(b.savings_actual ?? 0), 0);

  const filtered = projects.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Continuous Improvement</h1>
          <p className="text-muted-foreground text-sm mt-1">PDCA projects, Lean/Six Sigma tracking, and improvement savings</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Improvement Project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Title</Label><Input name="title" required /></div>
              <div><Label>Methodology</Label>
                <select name="methodology" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="pdca">PDCA</option>
                  <option value="six_sigma">Six Sigma</option>
                  <option value="lean">Lean</option>
                  <option value="kaizen">Kaizen</option>
                </select>
              </div>
              <div><Label>Category</Label>
                <select name="category" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="quality">Quality</option>
                  <option value="safety">Safety</option>
                  <option value="efficiency">Efficiency</option>
                  <option value="cost">Cost Reduction</option>
                </select>
              </div>
              <div><Label>Description</Label><Input name="description" /></div>
              <div><Label>Owner</Label><Input name="owner" /></div>
              <div><Label>Target Metric</Label><Input name="target_metric" placeholder="e.g. Defect rate, OEE" /></div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="data-card text-center"><TrendingUp className="h-5 w-5 mx-auto text-primary" /><p className="metric-label mt-1">Active Projects</p><p className="text-2xl font-bold mt-1">{projects.filter(p => p.status !== "completed").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Completed</p><p className="text-2xl font-bold text-status-closed mt-1">{projects.filter(p => p.status === "completed").length}</p></div>
        <div className="data-card text-center"><Target className="h-5 w-5 mx-auto text-severity-medium" /><p className="metric-label mt-1">Total Projects</p><p className="text-2xl font-bold mt-1">{projects.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Actual Savings</p><p className="text-2xl font-bold text-status-closed mt-1">${totalSavings.toLocaleString()}</p></div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Method</TableHead><TableHead>Category</TableHead><TableHead>Owner</TableHead><TableHead>Stage</TableHead><TableHead>Savings</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="uppercase text-xs">{p.methodology}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.owner ?? "—"}</TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[p.status] ?? ""}`}>{p.status.toUpperCase()}</span></TableCell>
                <TableCell>{p.savings_actual ? `$${Number(p.savings_actual).toLocaleString()}` : "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No projects found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContinuousImprovement;
