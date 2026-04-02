import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const HaccpDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ccp, setCcp] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [ccpRes, recRes] = await Promise.all([
      supabase.from("haccp_ccps").select("*").eq("id", id).single(),
      supabase.from("ccp_monitoring_records").select("*").eq("ccp_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    setCcp(ccpRes.data);
    setRecords(recRes.data ?? []);
    setLoading(false);
  };

  const addRecord = async () => {
    if (!newValue) return;
    const val = Number(newValue);
    const withinLimits = (ccp.critical_limit_lower == null || val >= ccp.critical_limit_lower) &&
      (ccp.critical_limit_upper == null || val <= ccp.critical_limit_upper);
    const { error } = await supabase.from("ccp_monitoring_records").insert({
      ccp_id: id, value: val, within_limits: withinLimits,
      recorded_by: user?.id, notes: newNotes || null,
    });
    if (error) { toast.error(error.message); return; }
    if (!withinLimits) toast.error("⚠️ CRITICAL LIMIT BREACH — value outside limits!");
    else toast.success("Monitoring record added");
    setNewValue("");
    setNewNotes("");
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!ccp) return <div className="flex items-center justify-center h-64 text-muted-foreground">CCP not found</div>;

  const deviationCount = records.filter((r) => !r.within_limits).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/haccp")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to HACCP</Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ccp.ccp_number}</h1>
            <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
              ccp.hazard_type === "biological" ? "bg-severity-critical/20 text-severity-critical" :
              ccp.hazard_type === "chemical" ? "bg-severity-high/20 text-severity-high" : "bg-severity-medium/20 text-severity-medium"
            }`}>{ccp.hazard_type}</span>
          </div>
          <p className="text-muted-foreground mt-1">{ccp.process_step}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* CCP Details */}
          <div className="data-card">
            <h3 className="metric-label mb-4">CCP Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Critical Limits:</span> <span className="ml-2 font-mono">{ccp.critical_limit_lower ?? "—"} – {ccp.critical_limit_upper ?? "—"} {ccp.critical_limit_unit ?? ""}</span></div>
              <div><span className="text-muted-foreground">Monitoring:</span> <span className="ml-2">{ccp.monitoring_method ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Frequency:</span> <span className="ml-2">{ccp.monitoring_frequency ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Deviations:</span> <span className={`ml-2 font-bold ${deviationCount > 0 ? "text-severity-critical" : "text-status-closed"}`}>{deviationCount}</span></div>
            </div>
            {ccp.hazard_description && <p className="text-sm mt-3 text-muted-foreground">{ccp.hazard_description}</p>}
          </div>

          {/* Add Monitoring Record */}
          <div className="data-card">
            <h3 className="metric-label mb-4">Record Monitoring Value</h3>
            <div className="flex gap-3">
              <Input type="number" placeholder={`Value (${ccp.critical_limit_unit ?? ""})`} value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-32" />
              <Input placeholder="Notes (optional)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="flex-1" />
              <Button onClick={addRecord} disabled={!newValue}><Plus className="mr-2 h-4 w-4" />Record</Button>
            </div>
          </div>

          {/* Monitoring Records */}
          <div className="data-card p-0 overflow-hidden">
            <div className="p-4"><h3 className="metric-label">Monitoring Records</h3></div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No monitoring records</TableCell></TableRow>
                ) : records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{format(new Date(r.created_at), "PPp")}</TableCell>
                    <TableCell className="font-mono font-bold">{r.value} {ccp.critical_limit_unit ?? ""}</TableCell>
                    <TableCell>
                      {r.within_limits ? (
                        <span className="flex items-center gap-1 text-status-closed text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Within limits</span>
                      ) : (
                        <span className="flex items-center gap-1 text-severity-critical text-xs font-bold"><AlertTriangle className="h-3.5 w-3.5" /> DEVIATION</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Corrective Action Procedure */}
        <div>
          <div className="data-card">
            <h3 className="metric-label mb-4">Corrective Action Procedure</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ccp.corrective_action_procedure || "No corrective action procedure documented. Edit the CCP to add one."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HaccpDetail;
