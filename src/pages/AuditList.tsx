import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary border border-primary/30",
  in_progress: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  completed: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  cancelled: "bg-muted text-muted-foreground border border-border",
};

const AuditList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", audit_type: "internal", standard: "", scheduled_date: "", scope: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("audits").select("*").order("scheduled_date", { ascending: true });
    setAudits(data ?? []);
    setLoading(false);
  };

  const createAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("audits").insert({
      title: form.title, audit_type: form.audit_type as any,
      standard: form.standard || null,
      scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
      scope: form.scope || null, lead_auditor_id: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Audit scheduled");
    setDialogOpen(false);
    setForm({ title: "", audit_type: "internal", standard: "", scheduled_date: "", scope: "" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Management</h1>
          <p className="metric-label mt-1">Internal, external, and supplier audits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Schedule Audit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Audit</DialogTitle></DialogHeader>
            <form onSubmit={createAudit} className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.audit_type} onValueChange={(v) => setForm({ ...form, audit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Standard</Label><Input value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} placeholder="BRCGS, SQF, ISO..." /></div>
              </div>
              <div className="space-y-2"><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Scope</Label><Textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} /></div>
              <Button type="submit" className="w-full">Schedule Audit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Standard</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : audits.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No audits scheduled</TableCell></TableRow>
            ) : audits.map((a) => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/audits/${a.id}`)}>
                <TableCell className="font-mono text-sm">{a.audit_number}</TableCell>
                <TableCell>{a.title}</TableCell>
                <TableCell><span className="text-xs uppercase font-semibold">{a.audit_type}</span></TableCell>
                <TableCell className="text-sm">{a.standard ?? "—"}</TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[a.status] ?? ""}`}>{a.status.replace(/_/g, " ")}</span></TableCell>
                <TableCell className="text-sm">
                  {a.scheduled_date ? (
                    <span>
                      {format(new Date(a.scheduled_date), "PP")}
                      {new Date(a.scheduled_date) > new Date() && (
                        <span className="text-muted-foreground ml-1">({formatDistanceToNow(new Date(a.scheduled_date))})</span>
                      )}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="font-mono">{a.score != null ? `${a.score}%` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditList;
