import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TableFilters } from "@/components/TableFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  compliant: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  at_risk: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  non_compliant: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
};

const RegulatoryCompliance = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [skuCompliance, setSkuCompliance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showSkuDialog, setShowSkuDialog] = useState(false);
  const [tab, setTab] = useState<"rules" | "sku">("rules");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [r1, r2] = await Promise.all([
      supabase.from("regulatory_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("sku_compliance").select("*").order("created_at", { ascending: false }),
    ]);
    setRules(r1.data ?? []);
    setSkuCompliance(r2.data ?? []);
    setLoading(false);
  };

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("regulatory_rules").insert({
      rule_reference: fd.get("rule_reference") as string,
      title: fd.get("title") as string,
      market: fd.get("market") as string,
      description: fd.get("description") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Rule added"); setShowRuleDialog(false); fetchData(); }
  };

  const handleCreateSku = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("sku_compliance").insert({
      product_name: fd.get("product_name") as string,
      product_code: fd.get("product_code") as string,
      market: fd.get("market") as string,
      compliance_status: fd.get("compliance_status") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("SKU compliance added"); setShowSkuDialog(false); fetchData(); }
  };

  const filteredRules = rules.filter(r =>
    (r.title?.toLowerCase().includes(search.toLowerCase()) || r.rule_reference?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || r.status === statusFilter)
  );

  const filteredSku = skuCompliance.filter(s =>
    (s.product_name?.toLowerCase().includes(search.toLowerCase()) || s.product_code?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || s.compliance_status === statusFilter)
  );

  const compliantCount = skuCompliance.filter(s => s.compliance_status === "compliant").length;
  const atRiskCount = skuCompliance.filter(s => s.compliance_status === "at_risk").length;
  const nonCompliantCount = skuCompliance.filter(s => s.compliance_status === "non_compliant").length;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regulatory Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track regulatory rules and per-SKU compliance status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="data-card text-center">
          <p className="metric-label">Active Rules</p>
          <p className="text-2xl font-bold mt-1">{rules.length}</p>
        </div>
        <div className="data-card text-center">
          <CheckCircle className="h-4 w-4 text-status-closed mx-auto" />
          <p className="metric-label">Compliant SKUs</p>
          <p className="text-2xl font-bold text-status-closed mt-1">{compliantCount}</p>
        </div>
        <div className="data-card text-center">
          <AlertTriangle className="h-4 w-4 text-severity-medium mx-auto" />
          <p className="metric-label">At Risk</p>
          <p className="text-2xl font-bold text-severity-medium mt-1">{atRiskCount}</p>
        </div>
        <div className="data-card text-center">
          <Shield className="h-4 w-4 text-severity-critical mx-auto" />
          <p className="metric-label">Non-Compliant</p>
          <p className="text-2xl font-bold text-severity-critical mt-1">{nonCompliantCount}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "rules" ? "default" : "outline"} size="sm" onClick={() => setTab("rules")}>Regulatory Rules</Button>
        <Button variant={tab === "sku" ? "default" : "outline"} size="sm" onClick={() => setTab("sku")}>SKU Compliance</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        {tab === "rules" ? (
          <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Rule</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Regulatory Rule</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateRule} className="space-y-3">
                <div><Label>Reference</Label><Input name="rule_reference" required /></div>
                <div><Label>Title</Label><Input name="title" required /></div>
                <div><Label>Market</Label><Input name="market" defaultValue="US" /></div>
                <div><Label>Description</Label><Input name="description" /></div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={showSkuDialog} onOpenChange={setShowSkuDialog}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add SKU</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add SKU Compliance Record</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateSku} className="space-y-3">
                <div><Label>Product Name</Label><Input name="product_name" required /></div>
                <div><Label>Product Code</Label><Input name="product_code" /></div>
                <div><Label>Market</Label><Input name="market" defaultValue="US" /></div>
                <div><Label>Status</Label>
                  <select name="compliance_status" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    <option value="compliant">Compliant</option>
                    <option value="at_risk">At Risk</option>
                    <option value="non_compliant">Non-Compliant</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tab === "rules" ? (
        <div className="data-card p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredRules.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.rule_reference}</TableCell>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.market}</TableCell>
                  <TableCell><span className="status-badge">{r.status}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</TableCell>
                </TableRow>
              ))}
              {filteredRules.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No rules found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="data-card p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredSku.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.product_name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.product_code ?? "—"}</TableCell>
                  <TableCell>{s.market}</TableCell>
                  <TableCell><span className={`status-badge ${STATUS_COLORS[s.compliance_status] ?? ""}`}>{s.compliance_status?.replace("_", " ")}</span></TableCell>
                  <TableCell className="text-xs">{s.deadline ? format(new Date(s.deadline), "PP") : "—"}</TableCell>
                </TableRow>
              ))}
              {filteredSku.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RegulatoryCompliance;
