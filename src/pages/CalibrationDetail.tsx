import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  in_calibration: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  due_soon: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  overdue: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  out_of_service: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
};

const CalibrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instrument, setInstrument] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordDialog, setRecordDialog] = useState(false);
  const [form, setForm] = useState({ result: "in_tolerance", certificate_reference: "", notes: "" });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [instRes, recRes] = await Promise.all([
      supabase.from("calibration_instruments").select("*").eq("id", id).single(),
      supabase.from("calibration_records").select("*").eq("instrument_id", id).order("calibration_date", { ascending: false }),
    ]);
    setInstrument(instRes.data);
    setRecords(recRes.data ?? []);
    setLoading(false);
  };

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextDue = instrument.calibration_frequency_days
      ? new Date(Date.now() + instrument.calibration_frequency_days * 86400000).toISOString()
      : null;
    const { error } = await supabase.from("calibration_records").insert({
      instrument_id: id, result: form.result as any,
      certificate_reference: form.certificate_reference || null,
      notes: form.notes || null, calibrated_by: user?.id,
      next_due_date: nextDue,
    });
    if (error) { toast.error(error.message); return; }
    // Update instrument status
    await supabase.from("calibration_instruments").update({
      status: "in_calibration" as any, last_calibration_date: new Date().toISOString(),
      next_calibration_due: nextDue,
    }).eq("id", id);
    toast.success("Calibration recorded");
    setRecordDialog(false);
    setForm({ result: "in_tolerance", certificate_reference: "", notes: "" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!instrument) return <div className="flex items-center justify-center h-64 text-muted-foreground">Instrument not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/calibration")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Calibration</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{instrument.instrument_id}</h1>
            <span className={`status-badge ${STATUS_COLORS[instrument.status] ?? ""}`}>{instrument.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-lg mt-1">{instrument.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Instrument Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="ml-2">{instrument.type ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Manufacturer:</span> <span className="ml-2">{instrument.manufacturer ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Model:</span> <span className="ml-2">{instrument.model ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Serial:</span> <span className="ml-2 font-mono">{instrument.serial_number ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="ml-2">{instrument.location ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Frequency:</span> <span className="ml-2">{instrument.calibration_frequency_days ? `${instrument.calibration_frequency_days} days` : "—"}</span></div>
              <div><span className="text-muted-foreground">Last Calibrated:</span> <span className="ml-2">{instrument.last_calibration_date ? format(new Date(instrument.last_calibration_date), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Next Due:</span> <span className="ml-2">{instrument.next_calibration_due ? format(new Date(instrument.next_calibration_due), "PPP") : "—"}</span></div>
            </div>
          </div>

          <div className="data-card p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="metric-label">Calibration History</h3>
              <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-3 w-3" />Record Calibration</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Calibration</DialogTitle></DialogHeader>
                  <form onSubmit={addRecord} className="space-y-4">
                    <div className="space-y-2"><Label>Result</Label>
                      <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_tolerance">In Tolerance</SelectItem>
                          <SelectItem value="out_of_tolerance">Out of Tolerance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Certificate Reference</Label><Input value={form.certificate_reference} onChange={(e) => setForm({ ...form, certificate_reference: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button type="submit" className="w-full">Record</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Result</TableHead><TableHead>Certificate</TableHead><TableHead>Next Due</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No calibration records</TableCell></TableRow>
                ) : records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{format(new Date(r.calibration_date), "PP")}</TableCell>
                    <TableCell><span className={`status-badge ${r.result === "in_tolerance" ? "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]" : "bg-severity-critical/15 text-severity-critical border border-severity-critical/30"}`}>{r.result.replace(/_/g, " ")}</span></TableCell>
                    <TableCell className="text-sm font-mono">{r.certificate_reference ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.next_due_date ? format(new Date(r.next_due_date), "PP") : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => setRecordDialog(true)}>Record Calibration</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationDetail;
