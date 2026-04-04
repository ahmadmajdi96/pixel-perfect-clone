import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Droplets, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const WaterQuality = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("water_tests").select("*").order("test_date", { ascending: false });
    setTests(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("water_tests").insert({
      test_type: fd.get("test_type") as string,
      sampling_point: fd.get("sampling_point") as string,
      result: fd.get("result") as string,
      notes: fd.get("notes") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Test recorded"); setShowDialog(false); fetchData(); }
  };

  const filtered = tests.filter(t =>
    t.sampling_point?.toLowerCase().includes(search.toLowerCase()) || t.test_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Water Quality Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-1">Potability testing, Legionella risk, and backflow prevention</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Droplets className="mr-2 h-4 w-4" /> Log Test</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Water Quality Test</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Test Type</Label>
                <select name="test_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="potability">Potability</option>
                  <option value="legionella">Legionella</option>
                  <option value="backflow_prevention">Backflow Prevention</option>
                  <option value="chlorine_residual">Chlorine Residual</option>
                </select>
              </div>
              <div><Label>Sampling Point</Label><Input name="sampling_point" required /></div>
              <div><Label>Result</Label>
                <select name="result" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
              <div><Label>Notes</Label><Input name="notes" /></div>
              <Button type="submit" className="w-full">Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center"><Droplets className="h-5 w-5 mx-auto text-primary" /><p className="metric-label mt-1">Total Tests</p><p className="text-2xl font-bold mt-1">{tests.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Compliant</p><p className="text-2xl font-bold text-status-closed mt-1">{tests.filter(t => t.result === "pass").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Failures</p><p className="text-2xl font-bold text-severity-critical mt-1">{tests.filter(t => t.result === "fail").length}</p></div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Test Type</TableHead><TableHead>Sampling Point</TableHead><TableHead>Date</TableHead><TableHead>Result</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(t)}>
                <TableCell className="font-medium">{t.test_type?.replace("_", " ")}</TableCell>
                <TableCell>{t.sampling_point}</TableCell>
                <TableCell className="text-xs">{format(new Date(t.test_date), "PP")}</TableCell>
                <TableCell><span className={`status-badge ${t.result === "pass" ? "bg-[hsl(var(--status-closed)/0.15)] text-status-closed" : "bg-severity-critical/15 text-severity-critical"}`}>{t.result}</span></TableCell>
                <TableCell><span className="status-badge">{t.status}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tests found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">Test Detail: {selected.test_type?.replace("_", " ")}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Test Type:</span> <span className="ml-2 capitalize">{selected.test_type?.replace("_", " ")}</span></div>
            <div><span className="text-muted-foreground">Sampling Point:</span> <span className="ml-2">{selected.sampling_point}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="ml-2">{format(new Date(selected.test_date), "PPP")}</span></div>
            <div><span className="text-muted-foreground">Result:</span> <span className={`ml-2 font-bold ${selected.result === "pass" ? "text-status-closed" : "text-severity-critical"}`}>{selected.result}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
            {selected.value && <div><span className="text-muted-foreground">Value:</span> <span className="ml-2">{selected.value} {selected.unit ?? ""}</span></div>}
            {selected.corrective_action && <div className="col-span-full"><span className="text-muted-foreground">Corrective Action:</span> <span className="ml-2">{selected.corrective_action}</span></div>}
            {selected.notes && <div className="col-span-full"><span className="text-muted-foreground">Notes:</span> <span className="ml-2">{selected.notes}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterQuality;
