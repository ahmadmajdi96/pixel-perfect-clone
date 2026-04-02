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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const STATUS_COLORS: Record<string, string> = { initiated: "bg-primary/15 text-primary border border-primary/30", risk_assessment: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30", pending_approval: "bg-severity-high/15 text-severity-high border border-severity-high/30", approved: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]", implementing: "bg-primary/15 text-primary border border-primary/30", effectiveness_check: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30", closed: "bg-muted text-muted-foreground border border-border", rejected: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30" };

const ChangeControlList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ status: "all", type: "all", risk: "all" });
  const [form, setForm] = useState({ title: "", change_type: "process", description: "", reason: "", target_date: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("change_requests").select("*").order("created_at", { ascending: false });
    setChanges(data ?? []);
    setLoading(false);
  };

  const createChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("change_requests").insert({ title: form.title, change_type: form.change_type as any, description: form.description || null, reason: form.reason || null, target_date: form.target_date ? new Date(form.target_date).toISOString() : null, initiator_id: user?.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Change request created");
    setDialogOpen(false);
    setForm({ title: "", change_type: "process", description: "", reason: "", target_date: "" });
    fetchData();
  };

  const filtered = changes.filter((c) => {
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (filters.type !== "all" && c.change_type !== filters.type) return false;
    if (filters.risk !== "all" && c.risk_level !== filters.risk) return false;
    if (search) { const q = search.toLowerCase(); return c.change_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Change Control</h1><p className="metric-label mt-1">Manage changes to products, processes, and equipment</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Initiate Change</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Initiate Change Request</DialogTitle></DialogHeader>
            <form onSubmit={createChange} className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={form.change_type} onValueChange={(v) => setForm({ ...form, change_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="product">Product</SelectItem><SelectItem value="process">Process</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="document">Document</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Reason for Change</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <Button type="submit" className="w-full">Submit Change Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TableFilters search={search} onSearchChange={setSearch} searchPlaceholder="Search by ID or title..."
        filters={[
          { key: "status", label: "Status", options: [{ value: "initiated", label: "Initiated" }, { value: "risk_assessment", label: "Risk Assessment" }, { value: "pending_approval", label: "Pending Approval" }, { value: "approved", label: "Approved" }, { value: "implementing", label: "Implementing" }, { value: "closed", label: "Closed" }, { value: "rejected", label: "Rejected" }] },
          { key: "type", label: "Type", options: [{ value: "product", label: "Product" }, { value: "process", label: "Process" }, { value: "equipment", label: "Equipment" }, { value: "supplier", label: "Supplier" }, { value: "document", label: "Document" }] },
          { key: "risk", label: "Risk", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
        ]}
        filterValues={filters} onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} resultCount={filtered.length}
      />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead><TableHead>Target</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No change requests</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/change-control/${c.id}`)}>
                <TableCell className="font-mono text-sm">{c.change_number}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell><span className="text-xs uppercase font-semibold">{c.change_type}</span></TableCell>
                <TableCell><span className={`text-xs font-semibold uppercase ${c.risk_level === "high" ? "text-severity-critical" : c.risk_level === "medium" ? "text-severity-high" : "text-severity-low"}`}>{c.risk_level}</span></TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</span></TableCell>
                <TableCell className="text-sm">{c.target_date ? format(new Date(c.target_date), "PP") : "—"}</TableCell>
                <TableCell className="text-sm">{format(new Date(c.created_at), "PP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChangeControlList;
