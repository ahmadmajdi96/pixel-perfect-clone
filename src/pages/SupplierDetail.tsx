import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupplierStatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState<any>(null);
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [coas, setCoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coaDialogOpen, setCoaDialogOpen] = useState(false);
  const [scorecardDialogOpen, setScorecardDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coaForm, setCoaForm] = useState({ ingredient: "", lot_number: "", issue_date: "", expiry_date: "" });
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [scorecardForm, setScorecardForm] = useState({
    period: "", quality_score: "0", delivery_score: "0", documentation_score: "0",
    responsiveness_score: "0", compliance_score: "0", notes: "",
  });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [supRes, scRes, coaRes] = await Promise.all([
      supabase.from("suppliers").select("*").eq("id", id).single(),
      supabase.from("supplier_scorecards").select("*").eq("supplier_id", id).order("created_at", { ascending: false }),
      supabase.from("supplier_coas").select("*").eq("supplier_id", id).order("created_at", { ascending: false }),
    ]);
    setSupplier(supRes.data);
    setScorecards(scRes.data ?? []);
    setCoas(coaRes.data ?? []);
    setLoading(false);
  };

  const updateStatus = async (status: "approved" | "conditional" | "suspended" | "rejected" | "pending") => {
    const { error } = await supabase.from("suppliers").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Supplier ${status}`);
    fetchData();
  };

  const uploadCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let documentUrl: string | null = null;

    if (coaFile) {
      const ext = coaFile.name.split(".").pop();
      const path = `${id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("supplier-coa-documents")
        .upload(path, coaFile);
      if (uploadErr) { toast.error(uploadErr.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("supplier-coa-documents").getPublicUrl(path);
      documentUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("supplier_coas").insert({
      supplier_id: id,
      ingredient: coaForm.ingredient,
      lot_number: coaForm.lot_number || null,
      issue_date: coaForm.issue_date || null,
      expiry_date: coaForm.expiry_date || null,
      document_url: documentUrl,
      uploaded_by: user?.id,
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    toast.success("COA uploaded");
    setCoaDialogOpen(false);
    setCoaForm({ ingredient: "", lot_number: "", issue_date: "", expiry_date: "" });
    setCoaFile(null);
    setUploading(false);
    fetchData();
  };

  const addScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    const scores = {
      quality_score: Number(scorecardForm.quality_score),
      delivery_score: Number(scorecardForm.delivery_score),
      documentation_score: Number(scorecardForm.documentation_score),
      responsiveness_score: Number(scorecardForm.responsiveness_score),
      compliance_score: Number(scorecardForm.compliance_score),
    };
    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

    const { error } = await supabase.from("supplier_scorecards").insert({
      supplier_id: id,
      period: scorecardForm.period,
      ...scores,
      overall_score: Math.round(overall * 10) / 10,
      notes: scorecardForm.notes || null,
      scored_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Scorecard added");
    setScorecardDialogOpen(false);
    setScorecardForm({ period: "", quality_score: "0", delivery_score: "0", documentation_score: "0", responsiveness_score: "0", compliance_score: "0", notes: "" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!supplier) return <div className="flex items-center justify-center h-64 text-muted-foreground">Supplier not found</div>;

  const latestScorecard = scorecards[0];
  const radarData = latestScorecard
    ? [
        { metric: "Quality", score: Number(latestScorecard.quality_score) },
        { metric: "Delivery", score: Number(latestScorecard.delivery_score) },
        { metric: "Documentation", score: Number(latestScorecard.documentation_score) },
        { metric: "Responsiveness", score: Number(latestScorecard.responsiveness_score) },
        { metric: "Compliance", score: Number(latestScorecard.compliance_score) },
      ]
    : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/suppliers")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Suppliers
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <SupplierStatusBadge status={supplier.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{supplier.code ?? "No code"} · {supplier.country ?? "Unknown"}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => updateStatus("approved")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => updateStatus("conditional")}>Conditional</Button>
          <Button size="sm" variant="outline" onClick={() => updateStatus("suspended")} className="text-severity-high">Suspend</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="data-card">
            <h3 className="metric-label mb-4">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Contact:</span> {supplier.contact_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {supplier.contact_email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {supplier.contact_phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Categories:</span> {(supplier.categories ?? []).join(", ") || "—"}</div>
              {supplier.notes && <><Separator className="col-span-2" /><p className="col-span-2">{supplier.notes}</p></>}
            </div>
          </div>

          {/* COA Library */}
          <div className="data-card p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="metric-label">COA / Specification Library</h3>
              <Dialog open={coaDialogOpen} onOpenChange={setCoaDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Upload className="mr-2 h-3 w-3" />Upload COA</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Upload Certificate of Analysis</DialogTitle></DialogHeader>
                  <form onSubmit={uploadCoa} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Ingredient *</Label>
                      <Input value={coaForm.ingredient} onChange={(e) => setCoaForm({ ...coaForm, ingredient: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lot Number</Label>
                        <Input value={coaForm.lot_number} onChange={(e) => setCoaForm({ ...coaForm, lot_number: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Document</Label>
                        <Input type="file" ref={fileInputRef} onChange={(e) => setCoaFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.jpg,.png" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input type="date" value={coaForm.issue_date} onChange={(e) => setCoaForm({ ...coaForm, issue_date: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input type="date" value={coaForm.expiry_date} onChange={(e) => setCoaForm({ ...coaForm, expiry_date: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload COA"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Doc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No COAs uploaded</TableCell></TableRow>
                ) : coas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.ingredient}</TableCell>
                    <TableCell className="font-mono text-sm">{c.lot_number ?? "—"}</TableCell>
                    <TableCell className="capitalize">{c.status}</TableCell>
                    <TableCell>{c.issue_date ? format(new Date(c.issue_date), "PP") : "—"}</TableCell>
                    <TableCell>{c.expiry_date ? format(new Date(c.expiry_date), "PP") : "—"}</TableCell>
                    <TableCell>
                      {c.document_url ? (
                        <a href={c.document_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          <FileText className="h-4 w-4" />
                        </a>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Scorecard History */}
          <div className="data-card p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="metric-label">Scorecard History</h3>
              <Dialog open={scorecardDialogOpen} onOpenChange={setScorecardDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-2 h-3 w-3" />Add Scorecard</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Performance Scorecard</DialogTitle></DialogHeader>
                  <form onSubmit={addScorecard} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Period *</Label>
                      <Input value={scorecardForm.period} onChange={(e) => setScorecardForm({ ...scorecardForm, period: e.target.value })} placeholder="e.g. Q1 2026" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "quality_score", label: "Quality (0-100)" },
                        { key: "delivery_score", label: "Delivery (0-100)" },
                        { key: "documentation_score", label: "Documentation (0-100)" },
                        { key: "responsiveness_score", label: "Responsiveness (0-100)" },
                        { key: "compliance_score", label: "Compliance (0-100)" },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number" min="0" max="100"
                            value={scorecardForm[key as keyof typeof scorecardForm]}
                            onChange={(e) => setScorecardForm({ ...scorecardForm, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={scorecardForm.notes} onChange={(e) => setScorecardForm({ ...scorecardForm, notes: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full">Add Scorecard</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Overall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecards.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No scorecards yet</TableCell></TableRow>
                ) : scorecards.map((sc) => (
                  <TableRow key={sc.id}>
                    <TableCell>{sc.period}</TableCell>
                    <TableCell className="font-mono">{Number(sc.quality_score).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{Number(sc.delivery_score).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{Number(sc.documentation_score).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{Number(sc.responsiveness_score).toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{Number(sc.compliance_score).toFixed(1)}</TableCell>
                    <TableCell className="font-mono font-bold">{Number(sc.overall_score).toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Scorecard Radar */}
        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Performance Radar</h3>
            {radarData ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220 14% 18%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar dataKey="score" stroke="hsl(210 100% 56%)" fill="hsl(210 100% 56%)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No scorecard data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
