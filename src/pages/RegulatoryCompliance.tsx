import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  compliant: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  at_risk: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  non_compliant: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
};

const RegulatoryCompliance = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("regulatory_rules").select("*").order("created_at", { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  };

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("regulatory_rules").insert({
      rule_reference: fd.get("rule_reference") as string,
      title: fd.get("title") as string,
      market: fd.get("market") as string,
      description: fd.get("description") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Rule added"); setShowRuleDialog(false); fetchData(); }
  };

  const filteredRules = rules.filter(r =>
    (r.title?.toLowerCase().includes(search.toLowerCase()) || r.rule_reference?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || r.status === statusFilter)
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regulatory Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track regulatory rules and compliance status</p>
        </div>
        <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Regulatory Rule</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div><Label>Reference</Label><Input name="rule_reference" required /></div>
              <div><Label>Title</Label><Input name="title" required /></div>
              <div><Label>Market</Label><Input name="market" defaultValue="US" /></div>
              <div><Label>Description</Label><Input name="description" /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center"><p className="metric-label">Active Rules</p><p className="text-2xl font-bold mt-1">{rules.filter(r => r.status === "active").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Pending Review</p><p className="text-2xl font-bold text-severity-medium mt-1">{rules.filter(r => r.status === "pending_review").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Total Rules</p><p className="text-2xl font-bold mt-1">{rules.length}</p></div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Reference</TableHead><TableHead>Title</TableHead><TableHead>Market</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredRules.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(r)}>
                <TableCell className="font-mono text-xs">{r.rule_reference}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.market}</TableCell>
                <TableCell><span className="status-badge">{r.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</TableCell>
              </TableRow>
            ))}
            {filteredRules.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No rules found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">Rule Detail: {selected.rule_reference}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Title:</span> <span className="ml-2 font-medium">{selected.title}</span></div>
            <div><span className="text-muted-foreground">Reference:</span> <span className="ml-2 font-mono">{selected.rule_reference}</span></div>
            <div><span className="text-muted-foreground">Market:</span> <span className="ml-2">{selected.market}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
            <div><span className="text-muted-foreground">Source:</span> <span className="ml-2">{selected.source ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Impact Count:</span> <span className="ml-2">{selected.impact_count ?? 0}</span></div>
            {selected.effective_date && <div><span className="text-muted-foreground">Effective:</span> <span className="ml-2">{format(new Date(selected.effective_date), "PPP")}</span></div>}
            {selected.enforcement_date && <div><span className="text-muted-foreground">Enforcement:</span> <span className="ml-2">{format(new Date(selected.enforcement_date), "PPP")}</span></div>}
          </div>
          {selected.description && <p className="text-sm text-muted-foreground mt-3 p-3 rounded bg-accent/30">{selected.description}</p>}
        </div>
      )}
    </div>
  );
};

export default RegulatoryCompliance;
