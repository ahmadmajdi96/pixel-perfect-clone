import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  in_progress: "bg-primary/15 text-primary border border-primary/30",
  accepted: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  rejected: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
  conditional: "bg-severity-high/15 text-severity-high border border-severity-high/30",
  hold_pending_lims: "bg-muted text-muted-foreground border border-border",
};

const IncomingInspectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inspection, setInspection] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data } = await supabase.from("incoming_inspections").select("*").eq("id", id).single();
    setInspection(data);
    if (data?.supplier_id) {
      const { data: sup } = await supabase.from("suppliers").select("name").eq("id", data.supplier_id).single();
      setSupplier(sup);
    }
    setLoading(false);
  };

  const updateField = async (updates: Record<string, any>) => {
    const { error } = await supabase.from("incoming_inspections").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); fetchData(); }
  };

  const updateStatus = async (status: string) => {
    const updates: any = { status };
    if (["accepted", "rejected", "conditional"].includes(status)) {
      updates.inspected_at = new Date().toISOString();
      updates.inspector_id = user?.id;
      updates.disposition = status;
    }
    await updateField(updates);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!inspection) return <div className="flex items-center justify-center h-64 text-muted-foreground">Inspection not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/incoming-inspection")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Inspections</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{inspection.inspection_number}</h1>
            <span className={`status-badge ${STATUS_COLORS[inspection.status] ?? ""}`}>{inspection.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-lg mt-1">{inspection.ingredient}</p>
          {supplier && <p className="text-sm text-muted-foreground mt-1">Supplier: {supplier.name}</p>}
        </div>
        <div className="flex gap-2">
          {inspection.status === "pending" && <Button onClick={() => updateStatus("in_progress")}>Start Inspection</Button>}
          {inspection.status === "in_progress" && (
            <>
              <Button onClick={() => updateStatus("accepted")}>Accept</Button>
              <Button variant="outline" onClick={() => updateStatus("conditional")}>Conditional</Button>
              <Button variant="destructive" onClick={() => updateStatus("rejected")}>Reject</Button>
            </>
          )}
          {inspection.status === "in_progress" && inspection.lims_required && (
            <Button variant="outline" onClick={() => updateStatus("hold_pending_lims")}>Hold for LIMS</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="data-card">
            <h3 className="metric-label mb-4">Inspection Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Lot Code:</span> <span className="ml-2 font-mono">{inspection.lot_code ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Quantity:</span> <span className="ml-2">{inspection.quantity != null ? `${inspection.quantity} ${inspection.quantity_unit ?? ""}` : "—"}</span></div>
              <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{format(new Date(inspection.created_at), "PPP")}</span></div>
              <div><span className="text-muted-foreground">Inspected:</span> <span className="ml-2">{inspection.inspected_at ? format(new Date(inspection.inspected_at), "PPP") : "—"}</span></div>
              <div><span className="text-muted-foreground">Disposition:</span> <span className="ml-2 font-semibold">{inspection.disposition ?? "Pending"}</span></div>
              <div><span className="text-muted-foreground">LIMS Result:</span> <span className="ml-2">{inspection.lims_result ?? "—"}</span></div>
            </div>
          </div>

          <div className="data-card">
            <h3 className="metric-label mb-4">Inspection Checklist</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox checked={inspection.physical_check_passed ?? false}
                  onCheckedChange={(v) => updateField({ physical_check_passed: !!v })} />
                <Label>Physical check passed</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={inspection.coa_verified ?? false}
                  onCheckedChange={(v) => updateField({ coa_verified: !!v })} />
                <Label>CoA verified</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={inspection.lims_required ?? false}
                  onCheckedChange={(v) => updateField({ lims_required: !!v })} />
                <Label>LIMS testing required</Label>
              </div>
            </div>
          </div>

          {inspection.notes && (
            <div className="data-card">
              <h3 className="metric-label mb-3">Notes</h3>
              <p className="text-sm text-muted-foreground">{inspection.notes}</p>
            </div>
          )}
        </div>

        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {inspection.supplier_id && (
                <Button variant="outline" className="w-full" onClick={() => navigate(`/suppliers/${inspection.supplier_id}`)}>View Supplier →</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingInspectionDetail;
