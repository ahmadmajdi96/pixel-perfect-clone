import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const HaccpList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ccps, setCcps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    ccp_number: "", process_step: "", hazard_type: "biological",
    hazard_description: "", critical_limit_upper: "", critical_limit_lower: "",
    critical_limit_unit: "", monitoring_method: "", monitoring_frequency: "",
  });

  useEffect(() => { fetchCcps(); }, []);

  const fetchCcps = async () => {
    const { data } = await supabase.from("haccp_ccps").select("*").order("ccp_number");
    setCcps(data ?? []);
    setLoading(false);
  };

  const createCcp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("haccp_ccps").insert({
      ccp_number: form.ccp_number,
      process_step: form.process_step,
      hazard_type: form.hazard_type,
      hazard_description: form.hazard_description || null,
      critical_limit_upper: form.critical_limit_upper ? Number(form.critical_limit_upper) : null,
      critical_limit_lower: form.critical_limit_lower ? Number(form.critical_limit_lower) : null,
      critical_limit_unit: form.critical_limit_unit || null,
      monitoring_method: form.monitoring_method || null,
      monitoring_frequency: form.monitoring_frequency || null,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("CCP created");
    setDialogOpen(false);
    setForm({ ccp_number: "", process_step: "", hazard_type: "biological", hazard_description: "", critical_limit_upper: "", critical_limit_lower: "", critical_limit_unit: "", monitoring_method: "", monitoring_frequency: "" });
    fetchCcps();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HACCP & Food Safety Plan</h1>
          <p className="metric-label mt-1">CCP registry and monitoring</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add CCP</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Critical Control Point</DialogTitle></DialogHeader>
            <form onSubmit={createCcp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CCP Number *</Label>
                  <Input value={form.ccp_number} onChange={(e) => setForm({ ...form, ccp_number: e.target.value })} placeholder="CCP-01" required />
                </div>
                <div className="space-y-2">
                  <Label>Process Step *</Label>
                  <Input value={form.process_step} onChange={(e) => setForm({ ...form, process_step: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hazard Type</Label>
                  <Select value={form.hazard_type} onValueChange={(v) => setForm({ ...form, hazard_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biological">Biological</SelectItem>
                      <SelectItem value="chemical">Chemical</SelectItem>
                      <SelectItem value="physical">Physical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monitoring Frequency</Label>
                  <Input value={form.monitoring_frequency} onChange={(e) => setForm({ ...form, monitoring_frequency: e.target.value })} placeholder="e.g. Every 30 min" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hazard Description</Label>
                <Textarea value={form.hazard_description} onChange={(e) => setForm({ ...form, hazard_description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Lower Limit</Label>
                  <Input type="number" value={form.critical_limit_lower} onChange={(e) => setForm({ ...form, critical_limit_lower: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Upper Limit</Label>
                  <Input type="number" value={form.critical_limit_upper} onChange={(e) => setForm({ ...form, critical_limit_upper: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={form.critical_limit_unit} onChange={(e) => setForm({ ...form, critical_limit_unit: e.target.value })} placeholder="°C, ppm..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monitoring Method</Label>
                <Input value={form.monitoring_method} onChange={(e) => setForm({ ...form, monitoring_method: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Create CCP</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CCP #</TableHead>
              <TableHead>Process Step</TableHead>
              <TableHead>Hazard</TableHead>
              <TableHead>Critical Limits</TableHead>
              <TableHead>Monitoring</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : ccps.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No CCPs registered</TableCell></TableRow>
            ) : ccps.map((ccp) => (
              <TableRow key={ccp.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/haccp/${ccp.id}`)}>
                <TableCell className="font-mono font-medium">{ccp.ccp_number}</TableCell>
                <TableCell>{ccp.process_step}</TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold uppercase ${
                    ccp.hazard_type === "biological" ? "text-severity-critical" :
                    ccp.hazard_type === "chemical" ? "text-severity-high" : "text-severity-medium"
                  }`}>{ccp.hazard_type}</span>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {ccp.critical_limit_lower != null || ccp.critical_limit_upper != null
                    ? `${ccp.critical_limit_lower ?? "—"} – ${ccp.critical_limit_upper ?? "—"} ${ccp.critical_limit_unit ?? ""}`
                    : "—"}
                </TableCell>
                <TableCell className="text-sm">{ccp.monitoring_method ?? "—"}</TableCell>
                <TableCell>
                  <span className={`status-badge ${ccp.status === "active" ? "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]" : "bg-muted text-muted-foreground"}`}>
                    {ccp.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HaccpList;
