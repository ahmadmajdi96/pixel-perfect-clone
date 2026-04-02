import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const STATUS_COLORS: Record<string, string> = { in_calibration: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]", due_soon: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30", overdue: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30", out_of_service: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30" };

const CalibrationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ status: "all" });
  const [form, setForm] = useState({ instrument_id: "", name: "", type: "", location: "", manufacturer: "", model: "", serial_number: "", calibration_frequency_days: "365" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("calibration_instruments").select("*").order("next_calibration_due");
    setInstruments(data ?? []);
    setLoading(false);
  };

  const createInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("calibration_instruments").insert({ instrument_id: form.instrument_id, name: form.name, type: form.type || null, location: form.location || null, manufacturer: form.manufacturer || null, model: form.model || null, serial_number: form.serial_number || null, calibration_frequency_days: Number(form.calibration_frequency_days) });
    if (error) { toast.error(error.message); return; }
    toast.success("Instrument added");
    setDialogOpen(false);
    setForm({ instrument_id: "", name: "", type: "", location: "", manufacturer: "", model: "", serial_number: "", calibration_frequency_days: "365" });
    fetchData();
  };

  const getComputedStatus = (inst: any) => {
    if (inst.status === "out_of_service") return "out_of_service";
    if (!inst.next_calibration_due) return "in_calibration";
    const days = differenceInDays(new Date(inst.next_calibration_due), new Date());
    if (days < 0) return "overdue";
    if (days <= 7) return "due_soon";
    return "in_calibration";
  };

  const filtered = instruments.filter((inst) => {
    const cs = getComputedStatus(inst);
    if (filters.status !== "all" && cs !== filters.status) return false;
    if (search) { const q = search.toLowerCase(); return inst.instrument_id.toLowerCase().includes(q) || inst.name.toLowerCase().includes(q) || (inst.type ?? "").toLowerCase().includes(q) || (inst.location ?? "").toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Calibration Management</h1><p className="metric-label mt-1">Instrument registry and calibration tracking</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Instrument</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Instrument</DialogTitle></DialogHeader>
            <form onSubmit={createInstrument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Instrument ID *</Label><Input value={form.instrument_id} onChange={(e) => setForm({ ...form, instrument_id: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Thermometer, Scale..." /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
                <div className="space-y-2"><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
                <div className="space-y-2"><Label>Serial #</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Calibration Frequency (days)</Label><Input type="number" value={form.calibration_frequency_days} onChange={(e) => setForm({ ...form, calibration_frequency_days: e.target.value })} /></div>
              <Button type="submit" className="w-full">Register Instrument</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card"><span className="metric-label">Total Instruments</span><div className="metric-value mt-2">{instruments.length}</div></div>
        <div className="data-card"><span className="metric-label">Due Soon (≤7 days)</span><div className="metric-value mt-2 text-severity-medium">{instruments.filter((i) => getComputedStatus(i) === "due_soon").length}</div></div>
        <div className="data-card"><span className="metric-label">Overdue</span><div className="metric-value mt-2 text-severity-critical">{instruments.filter((i) => getComputedStatus(i) === "overdue").length}</div></div>
      </div>

      <TableFilters search={search} onSearchChange={setSearch} searchPlaceholder="Search by ID, name, type, or location..."
        filters={[{ key: "status", label: "Status", options: [{ value: "in_calibration", label: "In Calibration" }, { value: "due_soon", label: "Due Soon" }, { value: "overdue", label: "Overdue" }, { value: "out_of_service", label: "Out of Service" }] }]}
        filterValues={filters} onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} resultCount={filtered.length}
      />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Last Cal</TableHead><TableHead>Next Due</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No instruments found</TableCell></TableRow>
            ) : filtered.map((inst) => {
              const cs = getComputedStatus(inst);
              return (
                <TableRow key={inst.id}>
                  <TableCell className="font-mono text-sm">{inst.instrument_id}</TableCell>
                  <TableCell>{inst.name}</TableCell>
                  <TableCell className="text-sm">{inst.type ?? "—"}</TableCell>
                  <TableCell className="text-sm">{inst.location ?? "—"}</TableCell>
                  <TableCell><span className={`status-badge ${STATUS_COLORS[cs] ?? ""}`}>{cs.replace(/_/g, " ")}</span></TableCell>
                  <TableCell className="text-sm">{inst.last_calibration_date ? format(new Date(inst.last_calibration_date), "PP") : "Never"}</TableCell>
                  <TableCell className="text-sm">{inst.next_calibration_due ? format(new Date(inst.next_calibration_due), "PP") : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CalibrationList;
