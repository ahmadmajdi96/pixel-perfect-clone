import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GitBranch, Timer } from "lucide-react";
import { TableFilters } from "@/components/TableFilters";
import { toast } from "sonner";
import { format } from "date-fns";

const LOT_STATUS_COLORS: Record<string, string> = {
  active: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  quarantined: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  recalled: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  released: "bg-primary/15 text-primary border border-primary/30",
};

const RECALL_STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  completed: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  cancelled: "bg-muted text-muted-foreground border border-border",
};

const TraceabilityRecall = () => {
  const { user } = useAuth();
  const [lots, setLots] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [recallDialogOpen, setRecallDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [lotForm, setLotForm] = useState({ lot_number: "", product_name: "", product_code: "", input_lots: "", output_lots: "", quantity: "", quantity_unit: "kg", notes: "" });
  const [recallForm, setRecallForm] = useState({ title: "", exercise_type: "mock", trigger_reason: "", affected_lots: "", scope_description: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [lotsRes, recallsRes] = await Promise.all([
      supabase.from("traceability_lots").select("*").order("created_at", { ascending: false }),
      supabase.from("recall_exercises").select("*").order("created_at", { ascending: false }),
    ]);
    setLots(lotsRes.data ?? []);
    setRecalls(recallsRes.data ?? []);
    setLoading(false);
  };

  const createLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("traceability_lots").insert({
      lot_number: lotForm.lot_number, product_name: lotForm.product_name,
      product_code: lotForm.product_code || null,
      input_lots: lotForm.input_lots ? lotForm.input_lots.split(",").map(s => s.trim()) : [],
      output_lots: lotForm.output_lots ? lotForm.output_lots.split(",").map(s => s.trim()) : [],
      quantity: lotForm.quantity ? parseFloat(lotForm.quantity) : null,
      quantity_unit: lotForm.quantity_unit, notes: lotForm.notes || null, created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lot record created");
    setLotDialogOpen(false);
    setLotForm({ lot_number: "", product_name: "", product_code: "", input_lots: "", output_lots: "", quantity: "", quantity_unit: "kg", notes: "" });
    fetchData();
  };

  const createRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("recall_exercises").insert({
      title: recallForm.title, exercise_type: recallForm.exercise_type,
      trigger_reason: recallForm.trigger_reason || null,
      affected_lots: recallForm.affected_lots ? recallForm.affected_lots.split(",").map(s => s.trim()) : [],
      scope_description: recallForm.scope_description || null, initiated_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Recall exercise created");
    setRecallDialogOpen(false);
    setRecallForm({ title: "", exercise_type: "mock", trigger_reason: "", affected_lots: "", scope_description: "" });
    fetchData();
  };

  const completeRecall = async (id: string, recoveryRate: number, hours: number) => {
    await supabase.from("recall_exercises").update({
      status: "completed", completed_at: new Date().toISOString(),
      recovery_rate_pct: recoveryRate, time_to_complete_hours: hours, result: recoveryRate >= 95 ? "pass" : "fail",
    }).eq("id", id);
    toast.success("Recall exercise completed");
    fetchData();
  };

  const lotFilters = [
    { key: "status", label: "Status", options: [
      { value: "active", label: "Active" },
      { value: "quarantined", label: "Quarantined" },
      { value: "recalled", label: "Recalled" },
      { value: "released", label: "Released" },
    ]},
  ];

  const filteredLots = lots.filter(l => {
    if (search && !l.lot_number?.toLowerCase().includes(search.toLowerCase()) && !l.product_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterValues.status && filterValues.status !== "all" && l.status !== filterValues.status) return false;
    return true;
  });

  // Genealogy: find linked lots
  const [genealogyLot, setGenealogyLot] = useState("");
  const genealogyResults = genealogyLot ? lots.filter(l =>
    l.lot_number === genealogyLot ||
    (l.input_lots || []).includes(genealogyLot) ||
    (l.output_lots || []).includes(genealogyLot)
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traceability & Recall</h1>
          <p className="text-sm text-muted-foreground">Lot genealogy, recall exercises & scope management</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="metric-label">Total Lots</p><p className="text-2xl font-bold">{lots.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">Mock Recalls</p><p className="text-2xl font-bold">{recalls.filter(r => r.exercise_type === "mock").length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">Avg Recovery Rate</p><p className="text-2xl font-bold text-status-closed">
          {recalls.filter(r => r.recovery_rate_pct != null).length > 0
            ? (recalls.filter(r => r.recovery_rate_pct != null).reduce((s, r) => s + Number(r.recovery_rate_pct), 0) / recalls.filter(r => r.recovery_rate_pct != null).length).toFixed(1) + "%"
            : "—"}
        </p></CardContent></Card>
      </div>

      <Tabs defaultValue="lots">
        <TabsList>
          <TabsTrigger value="lots">Lot Registry</TabsTrigger>
          <TabsTrigger value="genealogy">Genealogy Search</TabsTrigger>
          <TabsTrigger value="recalls">Recall Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-4">
          <div className="flex items-center justify-between">
            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search lots..."
              filters={lotFilters}
              filterValues={filterValues}
              onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
              resultCount={filteredLots.length}
            />
            <Dialog open={lotDialogOpen} onOpenChange={setLotDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Lot</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register Lot</DialogTitle></DialogHeader>
                <form onSubmit={createLot} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Lot Number *</Label><Input value={lotForm.lot_number} onChange={e => setLotForm(f => ({ ...f, lot_number: e.target.value }))} required /></div>
                    <div><Label>Product Name *</Label><Input value={lotForm.product_name} onChange={e => setLotForm(f => ({ ...f, product_name: e.target.value }))} required /></div>
                  </div>
                  <div><Label>Product Code</Label><Input value={lotForm.product_code} onChange={e => setLotForm(f => ({ ...f, product_code: e.target.value }))} /></div>
                  <div><Label>Input Lots (comma-separated)</Label><Input value={lotForm.input_lots} onChange={e => setLotForm(f => ({ ...f, input_lots: e.target.value }))} placeholder="LOT-001, LOT-002" /></div>
                  <div><Label>Output Lots (comma-separated)</Label><Input value={lotForm.output_lots} onChange={e => setLotForm(f => ({ ...f, output_lots: e.target.value }))} placeholder="LOT-003" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Quantity</Label><Input type="number" value={lotForm.quantity} onChange={e => setLotForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                    <div><Label>Unit</Label><Input value={lotForm.quantity_unit} onChange={e => setLotForm(f => ({ ...f, quantity_unit: e.target.value }))} /></div>
                  </div>
                  <div><Label>Notes</Label><Textarea value={lotForm.notes} onChange={e => setLotForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button type="submit" className="w-full">Register Lot</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="data-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Input Lots</TableHead>
                  <TableHead>Output Lots</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredLots.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No lots found</TableCell></TableRow>
                ) : filteredLots.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono font-medium">{l.lot_number}</TableCell>
                    <TableCell>{l.product_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(l.input_lots || []).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(l.output_lots || []).join(", ") || "—"}</TableCell>
                    <TableCell>{l.quantity ? `${l.quantity} ${l.quantity_unit}` : "—"}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${LOT_STATUS_COLORS[l.status] || LOT_STATUS_COLORS.active}`}>{l.status}</span></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(l.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="genealogy" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-primary" />
                <Input placeholder="Enter lot number to trace..." value={genealogyLot} onChange={e => setGenealogyLot(e.target.value)} className="max-w-md" />
              </div>
              {genealogyLot && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{genealogyResults.length} linked lot(s) found for "{genealogyLot}"</p>
                  {genealogyResults.map(l => (
                    <div key={l.id} className="p-3 rounded border mb-2">
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-medium">{l.lot_number}</span>
                        <span className="text-sm text-muted-foreground">{l.product_name}</span>
                        {l.lot_number === genealogyLot && <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">Target</span>}
                        {(l.input_lots || []).includes(genealogyLot) && <span className="px-2 py-0.5 rounded bg-severity-medium/20 text-severity-medium text-xs">Uses as input</span>}
                        {(l.output_lots || []).includes(genealogyLot) && <span className="px-2 py-0.5 rounded bg-[hsl(var(--status-closed)/0.2)] text-status-closed text-xs">Output from</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Inputs: {(l.input_lots || []).join(", ") || "none"} → Outputs: {(l.output_lots || []).join(", ") || "none"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recalls" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={recallDialogOpen} onOpenChange={setRecallDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Exercise</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Recall Exercise</DialogTitle></DialogHeader>
                <form onSubmit={createRecall} className="space-y-3">
                  <div><Label>Title *</Label><Input value={recallForm.title} onChange={e => setRecallForm(f => ({ ...f, title: e.target.value }))} required /></div>
                  <div>
                    <Label>Type</Label>
                    <Select value={recallForm.exercise_type} onValueChange={v => setRecallForm(f => ({ ...f, exercise_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mock">Mock Recall</SelectItem>
                        <SelectItem value="real">Real Recall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Trigger Reason</Label><Textarea value={recallForm.trigger_reason} onChange={e => setRecallForm(f => ({ ...f, trigger_reason: e.target.value }))} /></div>
                  <div><Label>Affected Lots (comma-separated)</Label><Input value={recallForm.affected_lots} onChange={e => setRecallForm(f => ({ ...f, affected_lots: e.target.value }))} /></div>
                  <div><Label>Scope Description</Label><Textarea value={recallForm.scope_description} onChange={e => setRecallForm(f => ({ ...f, scope_description: e.target.value }))} /></div>
                  <Button type="submit" className="w-full">Create Exercise</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Affected Lots</TableHead>
                  <TableHead>Recovery Rate</TableHead>
                  <TableHead>Time (hrs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recalls.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No recall exercises</TableCell></TableRow>
                ) : recalls.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${r.exercise_type === "mock" ? "bg-primary/15 text-primary border border-primary/30" : "bg-severity-critical/15 text-severity-critical border border-severity-critical/30"}`}>{r.exercise_type}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(r.affected_lots || []).join(", ") || "—"}</TableCell>
                    <TableCell>{r.recovery_rate_pct != null ? <span className={r.recovery_rate_pct >= 95 ? "text-status-closed" : "text-severity-critical"}>{r.recovery_rate_pct}%</span> : "—"}</TableCell>
                    <TableCell>{r.time_to_complete_hours ?? "—"}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${RECALL_STATUS_COLORS[r.status] || RECALL_STATUS_COLORS.in_progress}`}>{r.status?.replace("_", " ")}</span></TableCell>
                    <TableCell>
                      {r.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          const rate = prompt("Recovery rate %?", "98");
                          const hrs = prompt("Time to complete (hours)?", "2");
                          if (rate && hrs) completeRecall(r.id, parseFloat(rate), parseFloat(hrs));
                        }}>
                          <Timer className="mr-1 h-3 w-3" />Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TraceabilityRecall;
