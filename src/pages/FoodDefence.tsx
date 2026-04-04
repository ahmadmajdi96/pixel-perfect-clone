import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShieldAlert, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const FoodDefence = () => {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("food_defence_threats").select("*").order("risk_score", { ascending: false });
    setThreats(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const likelihood = Number(fd.get("likelihood"));
    const severity = Number(fd.get("severity"));
    const { error } = await supabase.from("food_defence_threats").insert({
      threat_type: fd.get("threat_type") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      likelihood,
      severity,
      risk_score: likelihood * severity,
    });
    if (error) toast.error(error.message);
    else { toast.success("Threat added"); setShowDialog(false); fetchData(); }
  };

  const filtered = threats.filter(t =>
    (typeFilter === "all" || t.threat_type === typeFilter) &&
    (t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const taccpCount = threats.filter(t => t.threat_type === "taccp").length;
  const vaccpCount = threats.filter(t => t.threat_type === "vaccp").length;
  const highRisk = threats.filter(t => (t.risk_score ?? 0) >= 15).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Food Defence & Food Fraud</h1>
          <p className="text-muted-foreground text-sm mt-1">TACCP threat register, VACCP vulnerability register, and mitigation strategies</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Threat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Threat/Vulnerability</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Type</Label>
                <select name="threat_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="taccp">TACCP (Threat)</option>
                  <option value="vaccp">VACCP (Vulnerability)</option>
                </select>
              </div>
              <div><Label>Category</Label><Input name="category" required placeholder="e.g. Intentional contamination" /></div>
              <div><Label>Description</Label><Input name="description" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Likelihood (1-5)</Label><Input name="likelihood" type="number" min="1" max="5" defaultValue="1" /></div>
                <div><Label>Severity (1-5)</Label><Input name="severity" type="number" min="1" max="5" defaultValue="1" /></div>
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center">
          <ShieldAlert className="h-5 w-5 mx-auto text-severity-critical" />
          <p className="metric-label mt-1">TACCP Threats</p>
          <p className="text-2xl font-bold mt-1">{taccpCount}</p>
        </div>
        <div className="data-card text-center">
          <Lock className="h-5 w-5 mx-auto text-severity-medium" />
          <p className="metric-label mt-1">VACCP Vulnerabilities</p>
          <p className="text-2xl font-bold mt-1">{vaccpCount}</p>
        </div>
        <div className="data-card text-center">
          <p className="metric-label">High Risk (≥15)</p>
          <p className="text-2xl font-bold text-severity-critical mt-1">{highRisk}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="taccp">TACCP</option>
          <option value="vaccp">VACCP</option>
        </select>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>L×S</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell><span className={`status-badge ${t.threat_type === "taccp" ? "bg-severity-critical/15 text-severity-critical border border-severity-critical/30" : "bg-severity-medium/15 text-severity-medium border border-severity-medium/30"}`}>{t.threat_type.toUpperCase()}</span></TableCell>
                <TableCell className="font-medium">{t.category}</TableCell>
                <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                <TableCell className="font-mono text-xs">{t.likelihood}×{t.severity}</TableCell>
                <TableCell><span className={`font-bold ${(t.risk_score ?? 0) >= 15 ? "text-severity-critical" : (t.risk_score ?? 0) >= 8 ? "text-severity-medium" : "text-status-closed"}`}>{t.risk_score ?? 0}</span></TableCell>
                <TableCell><span className="status-badge">{t.status}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No threats found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FoodDefence;
