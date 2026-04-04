import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const GlassControl = () => {
  const [register, setRegister] = useState<any[]>([]);
  const [breakages, setBreakages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"register" | "breakages">("register");
  const [showDialog, setShowDialog] = useState(false);
  const [showBreakageDialog, setShowBreakageDialog] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [r1, r2] = await Promise.all([
      supabase.from("glass_register").select("*").order("item_code"),
      supabase.from("glass_breakages").select("*").order("breakage_date", { ascending: false }),
    ]);
    setRegister(r1.data ?? []);
    setBreakages(r2.data ?? []);
    setLoading(false);
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("glass_register").insert({
      item_code: fd.get("item_code") as string,
      description: fd.get("description") as string,
      location: fd.get("location") as string,
      item_type: fd.get("item_type") as string,
      purpose: fd.get("purpose") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Item registered"); setShowDialog(false); fetchData(); }
  };

  const handleLogBreakage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("glass_breakages").insert({
      location: fd.get("location") as string,
      quantity_broken: Number(fd.get("quantity_broken")),
      immediate_action: fd.get("immediate_action") as string,
      product_at_risk: fd.get("product_at_risk") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Breakage logged"); setShowBreakageDialog(false); fetchData(); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Glass & Brittle Material Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Register, inspection tracking, and breakage investigations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBreakageDialog} onOpenChange={setShowBreakageDialog}>
            <DialogTrigger asChild><Button variant="destructive"><AlertTriangle className="mr-2 h-4 w-4" /> Log Breakage</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Breakage</DialogTitle></DialogHeader>
              <form onSubmit={handleLogBreakage} className="space-y-3">
                <div><Label>Location</Label><Input name="location" required /></div>
                <div><Label>Quantity Broken</Label><Input name="quantity_broken" type="number" min="1" defaultValue="1" /></div>
                <div><Label>Product at Risk</Label><Input name="product_at_risk" /></div>
                <div><Label>Immediate Action</Label><Input name="immediate_action" required /></div>
                <Button type="submit" variant="destructive" className="w-full">Log Breakage</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Register Item</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register Glass/Brittle Item</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <div><Label>Item Code</Label><Input name="item_code" required /></div>
                <div><Label>Description</Label><Input name="description" required /></div>
                <div><Label>Location</Label><Input name="location" required /></div>
                <div><Label>Type</Label>
                  <select name="item_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    <option value="glass">Glass</option>
                    <option value="brittle_plastic">Brittle Plastic</option>
                    <option value="ceramic">Ceramic</option>
                  </select>
                </div>
                <div><Label>Purpose</Label><Input name="purpose" placeholder="e.g. Gauge, Lamp cover" /></div>
                <Button type="submit" className="w-full">Register</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center"><p className="metric-label">Registered Items</p><p className="text-2xl font-bold mt-1">{register.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Breakage Incidents</p><p className="text-2xl font-bold text-severity-critical mt-1">{breakages.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">Open Investigations</p><p className="text-2xl font-bold mt-1">{breakages.filter(b => b.status === "investigating").length}</p></div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "register" ? "default" : "outline"} size="sm" onClick={() => setTab("register")}>Register</Button>
        <Button variant={tab === "breakages" ? "default" : "outline"} size="sm" onClick={() => setTab("breakages")}>Breakage Log</Button>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        {tab === "register" ? (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {register.filter(r => r.item_code?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.item_code}</TableCell>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell>{r.item_type}</TableCell>
                  <TableCell><span className={`status-badge ${r.status === "ok" ? "bg-[hsl(var(--status-closed)/0.15)] text-status-closed" : "bg-severity-critical/15 text-severity-critical"}`}>{r.status.toUpperCase()}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Qty</TableHead><TableHead>Product at Risk</TableHead><TableHead>Recovered</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {breakages.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{format(new Date(b.breakage_date), "PP")}</TableCell>
                  <TableCell>{b.location}</TableCell>
                  <TableCell>{b.quantity_broken}</TableCell>
                  <TableCell>{b.product_at_risk ?? "—"}</TableCell>
                  <TableCell>{b.all_fragments_recovered ? <span className="text-status-closed">Yes</span> : <span className="text-severity-critical">No</span>}</TableCell>
                  <TableCell><span className="status-badge">{b.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default GlassControl;
