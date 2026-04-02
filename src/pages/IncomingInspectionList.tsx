import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const STATUS_COLORS: Record<string, string> = { pending: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30", in_progress: "bg-primary/15 text-primary border border-primary/30", accepted: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]", rejected: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30", conditional: "bg-severity-high/15 text-severity-high border border-severity-high/30", hold_pending_lims: "bg-muted text-muted-foreground border border-border" };

const IncomingInspectionList = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ status: "all" });
  const [form, setForm] = useState({ supplier_id: "", ingredient: "", lot_code: "", quantity: "", quantity_unit: "kg" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [insRes, supRes] = await Promise.all([
      supabase.from("incoming_inspections").select("*, suppliers(name)").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, name").eq("status", "approved").order("name"),
    ]);
    setInspections(insRes.data ?? []);
    setSuppliers(supRes.data ?? []);
    setLoading(false);
  };

  const createInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("incoming_inspections").insert({ supplier_id: form.supplier_id || null, ingredient: form.ingredient, lot_code: form.lot_code || null, quantity: form.quantity ? Number(form.quantity) : null, quantity_unit: form.quantity_unit, inspector_id: user?.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Inspection created");
    setDialogOpen(false);
    setForm({ supplier_id: "", ingredient: "", lot_code: "", quantity: "", quantity_unit: "kg" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (["accepted", "rejected", "conditional"].includes(status)) { updates.inspected_at = new Date().toISOString(); updates.disposition = status; }
    const { error } = await supabase.from("incoming_inspections").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Inspection ${status.replace(/_/g, " ")}`); fetchData(); }
  };

  const filtered = inspections.filter((ins) => {
    if (filters.status !== "all" && ins.status !== filters.status) return false;
    if (search) { const q = search.toLowerCase(); return ins.inspection_number.toLowerCase().includes(q) || ins.ingredient.toLowerCase().includes(q) || (ins.lot_code ?? "").toLowerCase().includes(q) || ((ins.suppliers as any)?.name ?? "").toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Incoming Goods Inspection</h1><p className="metric-label mt-1">Inspect and disposition incoming materials</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Inspection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Incoming Inspection</DialogTitle></DialogHeader>
            <form onSubmit={createInspection} className="space-y-4">
              <div className="space-y-2"><Label>Supplier</Label><Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}><SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Ingredient *</Label><Input value={form.ingredient} onChange={(e) => setForm({ ...form, ingredient: e.target.value })} required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Lot Code</Label><Input value={form.lot_code} onChange={(e) => setForm({ ...form, lot_code: e.target.value })} /></div>
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="space-y-2"><Label>Unit</Label><Input value={form.quantity_unit} onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Create Inspection</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TableFilters search={search} onSearchChange={setSearch} searchPlaceholder="Search by ID, ingredient, lot, or supplier..."
        filters={[{ key: "status", label: "Status", options: [{ value: "pending", label: "Pending" }, { value: "in_progress", label: "In Progress" }, { value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }, { value: "conditional", label: "Conditional" }, { value: "hold_pending_lims", label: "Hold (LIMS)" }] }]}
        filterValues={filters} onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} resultCount={filtered.length}
      />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Ingredient</TableHead><TableHead>Supplier</TableHead><TableHead>Lot</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No inspections</TableCell></TableRow>
            ) : filtered.map((ins) => (
              <TableRow key={ins.id}>
                <TableCell className="font-mono text-sm">{ins.inspection_number}</TableCell>
                <TableCell>{ins.ingredient}</TableCell>
                <TableCell className="text-sm">{(ins.suppliers as any)?.name ?? "—"}</TableCell>
                <TableCell className="font-mono text-sm">{ins.lot_code ?? "—"}</TableCell>
                <TableCell className="text-sm">{ins.quantity ? `${ins.quantity} ${ins.quantity_unit}` : "—"}</TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[ins.status] ?? ""}`}>{ins.status.replace(/_/g, " ")}</span></TableCell>
                <TableCell className="text-sm">{format(new Date(ins.created_at), "PP")}</TableCell>
                <TableCell>{ins.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(ins.id, "accepted")}>Accept</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 text-severity-critical" onClick={() => updateStatus(ins.id, "rejected")}>Reject</Button>
                  </div>
                )}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IncomingInspectionList;
