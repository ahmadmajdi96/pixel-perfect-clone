import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierStatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<any>(null);
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [coas, setCoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Card>
            <CardHeader><CardTitle className="text-base">Supplier Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Contact:</span> {supplier.contact_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {supplier.contact_email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {supplier.contact_phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Categories:</span> {(supplier.categories ?? []).join(", ") || "—"}</div>
              {supplier.notes && <><Separator className="col-span-2" /><p className="col-span-2">{supplier.notes}</p></>}
            </CardContent>
          </Card>

          {/* COA Library */}
          <Card>
            <CardHeader><CardTitle className="text-base">COA / Specification Library</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No COAs uploaded</TableCell></TableRow>
                  ) : coas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.ingredient}</TableCell>
                      <TableCell className="font-mono text-sm">{c.lot_number ?? "—"}</TableCell>
                      <TableCell className="capitalize">{c.status}</TableCell>
                      <TableCell>{c.issue_date ? format(new Date(c.issue_date), "PP") : "—"}</TableCell>
                      <TableCell>{c.expiry_date ? format(new Date(c.expiry_date), "PP") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Scorecard History */}
          <Card>
            <CardHeader><CardTitle className="text-base">Scorecard History</CardTitle></CardHeader>
            <CardContent className="p-0">
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
                      <TableCell>{Number(sc.quality_score).toFixed(1)}</TableCell>
                      <TableCell>{Number(sc.delivery_score).toFixed(1)}</TableCell>
                      <TableCell>{Number(sc.documentation_score).toFixed(1)}</TableCell>
                      <TableCell>{Number(sc.responsiveness_score).toFixed(1)}</TableCell>
                      <TableCell>{Number(sc.compliance_score).toFixed(1)}</TableCell>
                      <TableCell className="font-bold">{Number(sc.overall_score).toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Scorecard Radar */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Performance Radar</CardTitle></CardHeader>
            <CardContent>
              {radarData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  No scorecard data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
