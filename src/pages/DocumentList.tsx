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
import { Plus, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DOC_TYPE_LABELS: Record<string, string> = {
  food_safety_plan: "Food Safety Plan", haccp_plan: "HACCP Plan", sop: "SOP",
  quality_plan: "Quality Plan", specification: "Specification", prp: "PRP", ewi: "EWI",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  pending_approval: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  approved: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  superseded: "bg-muted text-muted-foreground border border-border",
};

const DocumentList = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", doc_type: "sop", content: "" });
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  };

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let fileUrl: string | null = null;
    if (file) {
      const path = `docs/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("qms-documents").upload(path, file);
      if (upErr) { toast.error(upErr.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("qms-documents").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from("documents").insert({
      title: form.title, doc_type: form.doc_type as any,
      content: form.content || null, file_url: fileUrl,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    toast.success("Document created");
    setDialogOpen(false);
    setForm({ title: "", doc_type: "sop", content: "" });
    setFile(null);
    setUploading(false);
    fetchData();
  };

  const approveDocument = async (id: string) => {
    const { error } = await supabase.from("documents").update({
      status: "approved" as any, approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Document approved"); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Control</h1>
          <p className="metric-label mt-1">SOPs, HACCP plans, specifications, and work instructions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Document</DialogTitle></DialogHeader>
            <form onSubmit={createDocument} className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
                </div>
              </div>
              <div className="space-y-2"><Label>Content / Description</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={uploading}>{uploading ? "Uploading..." : "Create Document"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : documents.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No documents</TableCell></TableRow>
            ) : documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="text-sm">{DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type}</TableCell>
                <TableCell className="font-mono">v{d.version}</TableCell>
                <TableCell><span className={`status-badge ${STATUS_COLORS[d.status] ?? ""}`}>{d.status.replace(/_/g, " ")}</span></TableCell>
                <TableCell>
                  {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline"><FileText className="h-4 w-4" /></a> : "—"}
                </TableCell>
                <TableCell className="text-sm">{format(new Date(d.created_at), "PP")}</TableCell>
                <TableCell>
                  {d.status === "draft" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => approveDocument(d.id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />Approve
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

export default DocumentList;
