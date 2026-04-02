import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const RISK_COLORS = (score: number) => {
  if (score >= 15) return "bg-severity-critical/20 text-severity-critical font-bold";
  if (score >= 10) return "bg-severity-high/20 text-severity-high font-bold";
  if (score >= 5) return "bg-severity-medium/20 text-severity-medium";
  return "bg-severity-low/20 text-severity-low";
};

const RiskRegister = () => {
  const { user } = useAuth();
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    category: "HACCP", description: "", likelihood: "3", severity: "3",
    control_measures: "", residual_likelihood: "2", residual_severity: "2", owner: "", review_date: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("risk_register").select("*").order("risk_score", { ascending: false });
    setRisks(data ?? []);
    setLoading(false);
  };

  const createRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("risk_register").insert({
      category: form.category, description: form.description,
      likelihood: Number(form.likelihood), severity: Number(form.severity),
      control_measures: form.control_measures || null,
      residual_likelihood: Number(form.residual_likelihood),
      residual_severity: Number(form.residual_severity),
      owner: form.owner || null,
      review_date: form.review_date ? new Date(form.review_date).toISOString() : null,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Risk added");
    setDialogOpen(false);
    setForm({ category: "HACCP", description: "", likelihood: "3", severity: "3", control_measures: "", residual_likelihood: "2", residual_severity: "2", owner: "", review_date: "" });
    fetchData();
  };

  // Build 5x5 heatmap data
  const heatmapCounts: Record<string, number> = {};
  risks.forEach((r) => {
    const key = `${r.likelihood}-${r.severity}`;
    heatmapCounts[key] = (heatmapCounts[key] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Register</h1>
          <p className="metric-label mt-1">HACCP, TACCP, VACCP, and operational risks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Risk</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Risk Entry</DialogTitle></DialogHeader>
            <form onSubmit={createRisk} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HACCP">HACCP</SelectItem>
                      <SelectItem value="TACCP">TACCP</SelectItem>
                      <SelectItem value="VACCP">VACCP</SelectItem>
                      <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                      <SelectItem value="Facility">Facility</SelectItem>
                      <SelectItem value="Regulatory">Regulatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Owner</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Likelihood (1-5)</Label><Input type="number" min="1" max="5" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: e.target.value })} /></div>
                <div className="space-y-2"><Label>Severity (1-5)</Label><Input type="number" min="1" max="5" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Control Measures</Label><Textarea value={form.control_measures} onChange={(e) => setForm({ ...form, control_measures: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Residual Likelihood (1-5)</Label><Input type="number" min="1" max="5" value={form.residual_likelihood} onChange={(e) => setForm({ ...form, residual_likelihood: e.target.value })} /></div>
                <div className="space-y-2"><Label>Residual Severity (1-5)</Label><Input type="number" min="1" max="5" value={form.residual_severity} onChange={(e) => setForm({ ...form, residual_severity: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} /></div>
              <Button type="submit" className="w-full">Add Risk</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk Heatmap */}
      <div className="data-card">
        <h3 className="metric-label mb-4">Risk Heatmap (Likelihood × Severity)</h3>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md mx-auto">
            <thead>
              <tr>
                <th className="text-xs text-muted-foreground p-1"></th>
                {[1,2,3,4,5].map((s) => <th key={s} className="text-xs text-muted-foreground p-1 text-center">S{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {[5,4,3,2,1].map((l) => (
                <tr key={l}>
                  <td className="text-xs text-muted-foreground p-1">L{l}</td>
                  {[1,2,3,4,5].map((s) => {
                    const score = l * s;
                    const count = heatmapCounts[`${l}-${s}`] || 0;
                    return (
                      <td key={s} className="p-1">
                        <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold ${
                          score >= 15 ? "bg-severity-critical/30 text-severity-critical" :
                          score >= 10 ? "bg-severity-high/30 text-severity-high" :
                          score >= 5 ? "bg-severity-medium/30 text-severity-medium" :
                          "bg-severity-low/30 text-severity-low"
                        }`}>
                          {count > 0 ? count : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>L×S</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Residual</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : risks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No risks registered</TableCell></TableRow>
            ) : risks.map((r) => (
              <TableRow key={r.id}>
                <TableCell><span className="text-xs font-semibold uppercase">{r.category}</span></TableCell>
                <TableCell className="max-w-[250px] truncate">{r.description}</TableCell>
                <TableCell className="font-mono text-sm">{r.likelihood}×{r.severity}</TableCell>
                <TableCell><span className={`px-2 py-0.5 rounded text-xs ${RISK_COLORS(r.risk_score)}`}>{r.risk_score}</span></TableCell>
                <TableCell><span className={`px-2 py-0.5 rounded text-xs ${RISK_COLORS(r.residual_risk_score)}`}>{r.residual_risk_score}</span></TableCell>
                <TableCell className="text-sm">{r.owner ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {r.review_date ? (
                    <span className={new Date(r.review_date) < new Date() ? "text-severity-critical" : ""}>
                      {format(new Date(r.review_date), "PP")}
                    </span>
                  ) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RiskRegister;
