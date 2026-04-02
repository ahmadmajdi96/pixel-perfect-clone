import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ComplaintStatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<any>(null);
  const [investigation, setInvestigation] = useState<any>(null);
  const [invForm, setInvForm] = useState({ probable_cause: "", contributing_factors: "", findings: "", recommendations: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [compRes, invRes] = await Promise.all([
      supabase.from("complaints").select("*").eq("id", id).single(),
      supabase.from("complaint_investigations").select("*").eq("complaint_id", id).order("created_at", { ascending: false }).limit(1),
    ]);
    setComplaint(compRes.data);
    if (invRes.data?.[0]) {
      setInvestigation(invRes.data[0]);
      setInvForm({
        probable_cause: invRes.data[0].probable_cause ?? "",
        contributing_factors: invRes.data[0].contributing_factors ?? "",
        findings: invRes.data[0].findings ?? "",
        recommendations: invRes.data[0].recommendations ?? "",
      });
    }
    setLoading(false);
  };

  const updateStatus = async (status: "logged" | "investigating" | "resolved" | "closed") => {
    const { error } = await supabase.from("complaints").update({
      status,
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${status}`);
    fetchData();
  };

  const saveInvestigation = async () => {
    if (investigation) {
      await supabase.from("complaint_investigations").update(invForm).eq("id", investigation.id);
    } else {
      await supabase.from("complaint_investigations").insert({
        complaint_id: id,
        investigator_id: user?.id,
        ...invForm,
      });
    }
    toast.success("Investigation saved");
    fetchData();
  };

  const createLinkedCapa = async () => {
    const { data, error } = await supabase.from("capas").insert({
      title: `CAPA from complaint ${complaint.complaint_number}`,
      description: `Auto-generated from complaint: ${complaint.description}`,
      severity: complaint.severity,
      source_type: "customer_complaint",
      source_reference: complaint.complaint_number,
      product_line: complaint.product,
      owner_id: user?.id,
      capa_number: "",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("complaints").update({ capa_id: data.id }).eq("id", id);
    toast.success("CAPA created and linked");
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!complaint) return <div className="flex items-center justify-center h-64 text-muted-foreground">Complaint not found</div>;

  const typeLabel = complaint.complaint_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/complaints")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Complaints
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{complaint.complaint_number}</h1>
            <SeverityBadge severity={complaint.severity} />
            <ComplaintStatusBadge status={complaint.status} />
            {complaint.regulatory_flag && (
              <Badge className="bg-severity-critical text-white border-transparent">
                <AlertTriangle className="mr-1 h-3 w-3" />Regulatory
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{complaint.product} · Batch: {complaint.batch_number ?? "N/A"}</p>
        </div>
        <div className="flex gap-2">
          {complaint.status === "logged" && (
            <Button size="sm" onClick={() => updateStatus("investigating")}>Start Investigation</Button>
          )}
          {complaint.status === "investigating" && (
            <Button size="sm" onClick={() => updateStatus("resolved")}>Mark Resolved</Button>
          )}
          {complaint.status === "resolved" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("closed")}>Close</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Complaint Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Type:</span> {typeLabel}</div>
                <div><span className="text-muted-foreground">Source:</span> {complaint.source}</div>
                <div><span className="text-muted-foreground">Complainant:</span> {complaint.complainant_name ?? "—"}</div>
                <div><span className="text-muted-foreground">Contact:</span> {complaint.complainant_contact ?? "—"}</div>
                <div><span className="text-muted-foreground">Logged:</span> {format(new Date(complaint.created_at), "PPp")}</div>
                <div><span className="text-muted-foreground">Resolved:</span> {complaint.resolved_at ? format(new Date(complaint.resolved_at), "PPp") : "—"}</div>
              </div>
              <Separator />
              <p>{complaint.description}</p>
            </CardContent>
          </Card>

          {/* Investigation */}
          <Card>
            <CardHeader><CardTitle className="text-base">Investigation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Probable Cause</Label>
                <Textarea value={invForm.probable_cause} onChange={(e) => setInvForm({ ...invForm, probable_cause: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Contributing Factors</Label>
                <Textarea value={invForm.contributing_factors} onChange={(e) => setInvForm({ ...invForm, contributing_factors: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Findings</Label>
                <Textarea value={invForm.findings} onChange={(e) => setInvForm({ ...invForm, findings: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Recommendations</Label>
                <Textarea value={invForm.recommendations} onChange={(e) => setInvForm({ ...invForm, recommendations: e.target.value })} rows={3} />
              </div>
              <Button onClick={saveInvestigation}>Save Investigation</Button>
            </CardContent>
          </Card>
        </div>

        {/* CAPA Link */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">CAPA Link</CardTitle></CardHeader>
            <CardContent>
              {complaint.capa_id ? (
                <div>
                  <p className="text-sm mb-2">CAPA is linked to this complaint.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/capa/${complaint.capa_id}`)}>
                    View CAPA
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">No CAPA linked yet.</p>
                  <Button size="sm" onClick={createLinkedCapa}>Create Linked CAPA</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
