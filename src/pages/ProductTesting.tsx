import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TestTube } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const RESULT_COLORS: Record<string, string> = {
  pass: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  fail: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  pending: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  at_risk: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
};

const ProductTesting = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("product_tests").select("*").order("created_at", { ascending: false });
    setTests(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("product_tests").insert({
      product_name: fd.get("product_name") as string,
      product_code: fd.get("product_code") as string,
      batch_number: fd.get("batch_number") as string,
      test_type: fd.get("test_type") as string,
      sampling_point: fd.get("sampling_point") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Test request submitted"); setShowDialog(false); fetchData(); }
  };

  const filtered = tests.filter(t =>
    t.product_name?.toLowerCase().includes(search.toLowerCase()) || t.batch_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finished Product Testing</h1>
          <p className="text-muted-foreground text-sm mt-1">Microbiological, chemical, allergen, and sensory testing program</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Submit Test Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Test Request</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Product Name</Label><Input name="product_name" required /></div>
              <div><Label>Product Code</Label><Input name="product_code" /></div>
              <div><Label>Batch Number</Label><Input name="batch_number" /></div>
              <div><Label>Test Type</Label>
                <select name="test_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="microbiological">Microbiological</option>
                  <option value="chemical">Chemical</option>
                  <option value="allergen_residue">Allergen Residue</option>
                  <option value="sensory">Sensory</option>
                </select>
              </div>
              <div><Label>Sampling Point</Label>
                <select name="sampling_point" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="end_of_line">End of Line</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="shelf_life">Shelf Life</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="data-card text-center"><p className="metric-label">Total Tests</p><p className="text-2xl font-bold mt-1">{tests.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Pass</p><p className="text-2xl font-bold text-status-closed mt-1">{tests.filter(t => t.result === "pass").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Fail</p><p className="text-2xl font-bold text-severity-critical mt-1">{tests.filter(t => t.result === "fail").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Pending</p><p className="text-2xl font-bold text-severity-medium mt-1">{tests.filter(t => t.result === "pending").length}</p></div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Product</TableHead><TableHead>Batch</TableHead><TableHead>Test Type</TableHead><TableHead>Sampling</TableHead><TableHead>Result</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.product_name}</TableCell>
                <TableCell className="font-mono text-xs">{t.batch_number ?? "—"}</TableCell>
                <TableCell>{t.test_type?.replace("_", " ")}</TableCell>
                <TableCell>{t.sampling_point?.replace("_", " ")}</TableCell>
                <TableCell><span className={`status-badge ${RESULT_COLORS[t.result] ?? ""}`}>{t.result}</span></TableCell>
                <TableCell><span className="status-badge">{t.status}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tests found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductTesting;
