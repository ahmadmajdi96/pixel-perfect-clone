import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { TableFilters } from "@/components/TableFilters";

const COMMON_ALLERGENS = [
  "Milk", "Eggs", "Fish", "Crustacean Shellfish", "Tree Nuts", "Peanuts",
  "Wheat", "Soybeans", "Sesame", "Mustard", "Celery", "Lupin", "Mollusks", "Sulfites"
];

const LABEL_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  verified: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  needs_review: "bg-severity-high/15 text-severity-high border border-severity-high/30",
};

const riskColor = (score: number) => {
  if (score >= 7) return "text-severity-critical";
  if (score >= 4) return "text-severity-high";
  if (score >= 2) return "text-severity-medium";
  return "text-status-closed";
};

const AllergenControl = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    product_name: "", product_code: "",
    contains: [] as string[], may_contain: [] as string[], free_from: [] as string[],
    cross_contact_risk_score: 0, cross_contact_notes: "", label_status: "draft",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("allergen_profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  const toggleAllergen = (list: "contains" | "may_contain" | "free_from", allergen: string) => {
    setForm(prev => {
      const current = prev[list];
      const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
      return { ...prev, [list]: updated };
    });
  };

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("allergen_profiles").insert({
      product_name: form.product_name, product_code: form.product_code || null,
      contains: form.contains, may_contain: form.may_contain, free_from: form.free_from,
      cross_contact_risk_score: form.cross_contact_risk_score,
      cross_contact_notes: form.cross_contact_notes || null,
      label_status: form.label_status, created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Allergen profile created");
    setDialogOpen(false);
    setForm({ product_name: "", product_code: "", contains: [], may_contain: [], free_from: [], cross_contact_risk_score: 0, cross_contact_notes: "", label_status: "draft" });
    fetchData();
  };

  const verifyLabel = async (id: string) => {
    await supabase.from("allergen_profiles").update({
      label_status: "verified", label_last_verified_at: new Date().toISOString(), label_verified_by: user?.id,
    }).eq("id", id);
    toast.success("Label verified");
    fetchData();
  };

  const allergenFilters = [
    { key: "label_status", label: "Label Status", options: [
      { value: "draft", label: "Draft" },
      { value: "verified", label: "Verified" },
      { value: "needs_review", label: "Needs Review" },
    ]},
  ];

  const filtered = profiles.filter(p => {
    if (search && !p.product_name?.toLowerCase().includes(search.toLowerCase()) && !p.product_code?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterValues.label_status && filterValues.label_status !== "all" && p.label_status !== filterValues.label_status) return false;
    return true;
  });

  const stats = {
    total: profiles.length,
    verified: profiles.filter(p => p.label_status === "verified").length,
    highRisk: profiles.filter(p => (p.cross_contact_risk_score ?? 0) >= 7).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Allergen & Label Control</h1>
          <p className="text-sm text-muted-foreground">Product allergen profiles, label validation & cross-contact risk</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Allergen Profile</DialogTitle></DialogHeader>
            <form onSubmit={createProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} required /></div>
                <div><Label>Product Code</Label><Input value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} /></div>
              </div>

              {(["contains", "may_contain", "free_from"] as const).map(list => (
                <div key={list}>
                  <Label className="capitalize">{list.replace("_", " ")}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {COMMON_ALLERGENS.map(a => (
                      <button key={a} type="button" onClick={() => toggleAllergen(list, a)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${form[list].includes(a)
                          ? list === "contains" ? "bg-severity-critical/20 text-severity-critical border-severity-critical/40"
                            : list === "may_contain" ? "bg-severity-medium/20 text-severity-medium border-severity-medium/40"
                            : "bg-[hsl(var(--status-closed)/0.2)] text-status-closed border-[hsl(var(--status-closed)/0.4)]"
                          : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cross-Contact Risk Score (0-10)</Label>
                  <Input type="number" min={0} max={10} value={form.cross_contact_risk_score}
                    onChange={e => setForm(f => ({ ...f, cross_contact_risk_score: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Label Status</Label>
                  <Select value={form.label_status} onValueChange={v => setForm(f => ({ ...f, label_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="needs_review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Cross-Contact Notes</Label><Textarea value={form.cross_contact_notes} onChange={e => setForm(f => ({ ...f, cross_contact_notes: e.target.value }))} /></div>
              <Button type="submit" className="w-full">Create Profile</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="metric-label">Total Profiles</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">Labels Verified</p><p className="text-2xl font-bold text-status-closed">{stats.verified}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">High Risk Products</p><p className="text-2xl font-bold text-severity-critical">{stats.highRisk}</p></CardContent></Card>
      </div>

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search allergen profiles..."
        filters={allergenFilters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        resultCount={filtered.length}
      />

      <div className="data-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contains</TableHead>
              <TableHead>May Contain</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Label Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No allergen profiles found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.product_name}</TableCell>
                <TableCell className="text-muted-foreground">{p.product_code || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(p.contains || []).map((a: string) => (
                      <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-severity-critical/15 text-severity-critical">{a}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(p.may_contain || []).map((a: string) => (
                      <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-severity-medium/15 text-severity-medium">{a}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell><span className={`font-bold ${riskColor(p.cross_contact_risk_score ?? 0)}`}>{p.cross_contact_risk_score ?? 0}/10</span></TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${LABEL_COLORS[p.label_status] || LABEL_COLORS.draft}`}>
                    {p.label_status?.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  {p.label_status !== "verified" && (
                    <Button size="sm" variant="outline" onClick={() => verifyLabel(p.id)}>
                      <ShieldCheck className="mr-1 h-3 w-3" />Verify
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AllergenControl;
