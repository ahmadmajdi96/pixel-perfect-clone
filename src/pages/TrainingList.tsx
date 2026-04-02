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

const RESULT_COLORS: Record<string, string> = { pass: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]", fail: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30", pending: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30" };

const TrainingList = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ result: "all", format: "all" });
  const [form, setForm] = useState({ employee_name: "", topic: "", training_date: "", trainer: "", format: "classroom", result: "pending", qualification_name: "", qualification_expiry: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("training_records").select("*").order("training_date", { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  };

  const createRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("training_records").insert({
      employee_name: form.employee_name, topic: form.topic,
      training_date: form.training_date ? new Date(form.training_date).toISOString() : new Date().toISOString(),
      trainer: form.trainer || null, format: form.format, result: form.result as any,
      qualification_name: form.qualification_name || null,
      qualification_expiry: form.qualification_expiry ? new Date(form.qualification_expiry).toISOString() : null,
      recorded_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Training record added");
    setDialogOpen(false);
    setForm({ employee_name: "", topic: "", training_date: "", trainer: "", format: "classroom", result: "pending", qualification_name: "", qualification_expiry: "" });
    fetchData();
  };

  const filtered = records.filter((r) => {
    if (filters.result !== "all" && r.result !== filters.result) return false;
    if (filters.format !== "all" && r.format !== filters.format) return false;
    if (search) { const q = search.toLowerCase(); return r.employee_name.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Training & Competence</h1><p className="metric-label mt-1">Employee training records and qualifications</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Record</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Training Record</DialogTitle></DialogHeader>
            <form onSubmit={createRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Employee Name *</Label><Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Topic *</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.training_date} onChange={(e) => setForm({ ...form, training_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Trainer</Label><Input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
                <div className="space-y-2"><Label>Format</Label><Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="classroom">Classroom</SelectItem><SelectItem value="e-learning">E-Learning</SelectItem><SelectItem value="on-the-job">On-the-Job</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Result</Label><Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pass">Pass</SelectItem><SelectItem value="fail">Fail</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Qualification Name</Label><Input value={form.qualification_name} onChange={(e) => setForm({ ...form, qualification_name: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Qualification Expiry</Label><Input type="date" value={form.qualification_expiry} onChange={(e) => setForm({ ...form, qualification_expiry: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save Training Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TableFilters search={search} onSearchChange={setSearch} searchPlaceholder="Search by employee or topic..."
        filters={[
          { key: "result", label: "Result", options: [{ value: "pass", label: "Pass" }, { value: "fail", label: "Fail" }, { value: "pending", label: "Pending" }] },
          { key: "format", label: "Format", options: [{ value: "classroom", label: "Classroom" }, { value: "e-learning", label: "E-Learning" }, { value: "on-the-job", label: "On-the-Job" }] },
        ]}
        filterValues={filters} onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} resultCount={filtered.length}
      />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Topic</TableHead><TableHead>Date</TableHead><TableHead>Format</TableHead><TableHead>Result</TableHead><TableHead>Qualification</TableHead><TableHead>Expiry</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No training records</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee_name}</TableCell>
                <TableCell>{r.topic}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.training_date), "PP")}</TableCell>
                <TableCell className="text-xs uppercase">{r.format}</TableCell>
                <TableCell><span className={`status-badge ${RESULT_COLORS[r.result] ?? ""}`}>{r.result}</span></TableCell>
                <TableCell className="text-sm">{r.qualification_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.qualification_expiry ? <span className={new Date(r.qualification_expiry) < new Date() ? "text-severity-critical font-bold" : ""}>{format(new Date(r.qualification_expiry), "PP")}</span> : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TrainingList;
