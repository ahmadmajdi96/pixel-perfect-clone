import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  investigating: "bg-primary/15 text-primary border border-primary/30",
  dispositioned: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  closed: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
};

const DeviationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deviations, setDeviations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ severity: "all", status: "all", type: "all" });
  const [form, setForm] = useState({ title: "", type: "process", severity: "medium", description: "", product_affected: "", batch_affected: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("deviations").select("*").order("created_at", { ascending: false });
    setDeviations(data ?? []);
    setLoading(false);
  };

  const createDeviation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("deviations").insert({
      title: form.title, type: form.type as any, severity: form.severity as any,
      description: form.description || null, product_affected: form.product_affected || null,
      batch_affected: form.batch_affected || null, reported_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Deviation reported");
    setDialogOpen(false);
    setForm({ title: "", type: "process", severity: "medium", description: "", product_affected: "", batch_affected: "" });
    fetchData();
  };

  const filtered = deviations.filter((d) => {
    if (filters.severity !== "all" && d.severity !== filters.severity) return false;
    if (filters.status !== "all" && d.status !== filters.status) return false;
    if (filters.type !== "all" && d.type !== filters.type) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.deviation_number.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || (d.product_affected ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deviations & Nonconformances</h1>
          <p className="metric-label mt-1">Track process, product, and regulatory deviations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Report Deviation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Deviation / NCR</DialogTitle></DialogHeader>
            <form onSubmit={createDeviation} className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="process">Process</SelectItem><SelectItem value="product">Product</SelectItem><SelectItem value="regulatory">Regulatory</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Product Affected</Label><Input value={form.product_affected} onChange={(e) => setForm({ ...form, product_affected: e.target.value })} /></div>
                <div className="space-y-2"><Label>Batch Affected</Label><Input value={form.batch_affected} onChange={(e) => setForm({ ...form, batch_affected: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Submit Deviation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TableFilters
        search={search} onSearchChange={setSearch}
        searchPlaceholder="Search by ID, title, or product..."
        filters={[
          { key: "severity", label: "Severity", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
          { key: "status", label: "Status", options: [{ value: "open", label: "Open" }, { value: "investigating", label: "Investigating" }, { value: "dispositioned", label: "Dispositioned" }, { value: "closed", label: "Closed" }] },
          { key: "type", label: "Type", options: [{ value: "process", label: "Process" }, { value: "product", label: "Product" }, { value: "regulatory", label: "Regulatory" }] },
        ]}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        resultCount={filtered.length}
      />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead>
              <TableHead>Status</TableHead><TableHead>Product</TableHead><TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No deviations found</TableCell></TableRow>
            ) : filtered.map((d) => (
              <TableRow key={d.id} className="cursor-pointer hover:bg-secondary/50">
                <TableCell className="font-mono text-sm">{d.deviation_number}</TableCell>
                <TableCell>{d.title}</TableCell>
                <TableCell><span className="text-xs uppercase font-semibold">{d.type}</span></TableCell>
                <TableCell><SeverityBadge severity={d.severity} /></TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[d.status] ?? ""}`}>{d.status}</span></TableCell>
                <TableCell className="text-sm">{d.product_affected ?? "—"}</TableCell>
                <TableCell className="text-sm">{format(new Date(d.created_at), "PP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviationList;
