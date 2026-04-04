import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Award, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SpecialtyCertifications = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("specialty_certifications").select("*").order("created_at", { ascending: false });
    setCerts(data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("specialty_certifications").insert({
      certification_type: fd.get("certification_type") as string,
      certifying_body: fd.get("certifying_body") as string,
      certificate_number: fd.get("certificate_number") as string,
      product_scope: fd.get("product_scope") as string,
      expiry_date: fd.get("expiry_date") as string || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Certification added"); setShowDialog(false); fetchData(); }
  };

  const filtered = certs.filter(c =>
    c.certification_type?.toLowerCase().includes(search.toLowerCase()) || c.certifying_body?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Specialty & Religious Certifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Halal, Organic, Non-GMO, Vegan certifications</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Certification</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Certification</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Type</Label>
                <select name="certification_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="kosher">Kosher</option>
                  <option value="halal">Halal</option>
                  <option value="organic">Organic</option>
                  <option value="non_gmo">Non-GMO</option>
                  <option value="vegan">Vegan</option>
                  <option value="allergen_free">Allergen-Free</option>
                </select>
              </div>
              <div><Label>Certifying Body</Label><Input name="certifying_body" required /></div>
              <div><Label>Certificate Number</Label><Input name="certificate_number" /></div>
              <div><Label>Product Scope</Label><Input name="product_scope" /></div>
              <div><Label>Expiry Date</Label><Input name="expiry_date" type="date" /></div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center"><Award className="h-5 w-5 mx-auto text-primary" /><p className="metric-label mt-1">Active Certs</p><p className="text-2xl font-bold mt-1">{certs.filter(c => c.status === "active").length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Expiring (30d)</p><p className="text-2xl font-bold text-severity-medium mt-1">{certs.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date(Date.now() + 30 * 86400000)).length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Cert Types</p><p className="text-2xl font-bold mt-1">{new Set(certs.map(c => c.certification_type)).size}</p></div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Type</TableHead><TableHead>Body</TableHead><TableHead>Certificate #</TableHead><TableHead>Scope</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(c)}>
                <TableCell className="font-medium capitalize">{c.certification_type?.replace("_", " ")}</TableCell>
                <TableCell>{c.certifying_body}</TableCell>
                <TableCell className="font-mono text-xs">{c.certificate_number ?? "—"}</TableCell>
                <TableCell>{c.product_scope ?? "All products"}</TableCell>
                <TableCell className="text-xs">{c.expiry_date ? format(new Date(c.expiry_date), "PP") : "—"}</TableCell>
                <TableCell><span className="status-badge">{c.status}</span></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No certifications found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">Certification Detail</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Type:</span> <span className="ml-2 capitalize font-medium">{selected.certification_type?.replace("_", " ")}</span></div>
            <div><span className="text-muted-foreground">Certifying Body:</span> <span className="ml-2">{selected.certifying_body}</span></div>
            <div><span className="text-muted-foreground">Certificate #:</span> <span className="ml-2 font-mono">{selected.certificate_number ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Scope:</span> <span className="ml-2">{selected.product_scope ?? "All products"}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
            {selected.expiry_date && <div><span className="text-muted-foreground">Expiry:</span> <span className={`ml-2 ${new Date(selected.expiry_date) < new Date() ? "text-severity-critical font-bold" : ""}`}>{format(new Date(selected.expiry_date), "PPP")}</span></div>}
            {selected.issued_date && <div><span className="text-muted-foreground">Issued:</span> <span className="ml-2">{format(new Date(selected.issued_date), "PPP")}</span></div>}
            {selected.audit_date && <div><span className="text-muted-foreground">Last Audit:</span> <span className="ml-2">{format(new Date(selected.audit_date), "PPP")}</span></div>}
          </div>
          {selected.notes && <p className="text-sm text-muted-foreground mt-3 p-3 rounded bg-accent/30">{selected.notes}</p>}
        </div>
      )}
    </div>
  );
};

export default SpecialtyCertifications;
