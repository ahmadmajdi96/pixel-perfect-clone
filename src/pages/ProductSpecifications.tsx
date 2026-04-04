import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  compliant: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  under_review: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  non_compliant: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  draft: "bg-muted text-muted-foreground border border-border",
};

const ProductSpecifications = () => {
  const [specs, setSpecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("product_specifications").select("*").order("created_at", { ascending: false });
    setSpecs(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("product_specifications").insert({
      product_name: fd.get("product_name") as string,
      product_code: fd.get("product_code") as string,
      spec_type: fd.get("spec_type") as string,
      customer_name: fd.get("customer_name") as string || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Specification created"); setShowDialog(false); fetchData(); }
  };

  const filtered = specs.filter(s =>
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.product_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product & Customer Specifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Internal product specs and customer specification sheets</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Specification</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Specification</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Product Name</Label><Input name="product_name" required /></div>
              <div><Label>Product Code</Label><Input name="product_code" /></div>
              <div><Label>Spec Type</Label>
                <select name="spec_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="internal">Internal</option>
                  <option value="customer">Customer</option>
                  <option value="regulatory">Regulatory</option>
                </select>
              </div>
              <div><Label>Customer Name</Label><Input name="customer_name" /></div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search specs..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Product</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Customer</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Compliance</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(s => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(s)}>
                <TableCell className="font-medium">{s.product_name}</TableCell>
                <TableCell className="font-mono text-xs">{s.product_code ?? "—"}</TableCell>
                <TableCell>{s.spec_type}</TableCell>
                <TableCell>{s.customer_name ?? "—"}</TableCell>
                <TableCell>v{s.version}</TableCell>
                <TableCell><span className="status-badge">{s.status}</span></TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[s.compliance_status] ?? ""}`}>{s.compliance_status?.replace("_", " ")}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No specifications found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">Specification Detail: {selected.product_name}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Product Code:</span> <span className="ml-2 font-mono">{selected.product_code ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Type:</span> <span className="ml-2 capitalize">{selected.spec_type}</span></div>
            <div><span className="text-muted-foreground">Customer:</span> <span className="ml-2">{selected.customer_name ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Version:</span> <span className="ml-2">v{selected.version}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
            <div><span className="text-muted-foreground">Compliance:</span> <span className="ml-2">{selected.compliance_status?.replace("_", " ")}</span></div>
            {selected.effective_date && <div><span className="text-muted-foreground">Effective:</span> <span className="ml-2">{format(new Date(selected.effective_date), "PPP")}</span></div>}
            {selected.review_date && <div><span className="text-muted-foreground">Review Date:</span> <span className="ml-2">{format(new Date(selected.review_date), "PPP")}</span></div>}
          </div>
          {selected.parameters && Array.isArray(selected.parameters) && selected.parameters.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selected.parameters.map((p: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-accent/30 text-sm flex justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.min}–{p.max} {p.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;
