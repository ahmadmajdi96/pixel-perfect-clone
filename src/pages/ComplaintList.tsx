import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ComplaintStatusBadge } from "@/components/StatusBadge";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const ComplaintList = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    setComplaints(data ?? []);
    setLoading(false);
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.complaint_number.toLowerCase().includes(q) ||
      c.product.toLowerCase().includes(q) ||
      (c.batch_number ?? "").toLowerCase().includes(q);
  });

  const complaintTypeLabel = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Complaints</h1>
          <p className="text-sm text-muted-foreground">Track and manage complaint lifecycle</p>
        </div>
        <Button onClick={() => navigate("/complaints/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Log Complaint
        </Button>
      </div>

      <Input placeholder="Search by ID, product, or batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>CAPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No complaints found</TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/complaints/${c.id}`)}>
                    <TableCell className="font-mono text-sm">{c.complaint_number}</TableCell>
                    <TableCell>{c.product}</TableCell>
                    <TableCell className="font-mono text-sm">{c.batch_number ?? "—"}</TableCell>
                    <TableCell className="text-sm">{complaintTypeLabel(c.complaint_type)}</TableCell>
                    <TableCell><SeverityBadge severity={c.severity} /></TableCell>
                    <TableCell><ComplaintStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm">{format(new Date(c.created_at), "PP")}</TableCell>
                    <TableCell className="text-sm">{c.capa_id ? "Linked" : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintList;
