import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ComplaintStatusBadge } from "@/components/StatusBadge";
import { Plus, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PARETO_COLORS = [
  "hsl(0 84% 60%)", "hsl(25 95% 53%)", "hsl(48 96% 53%)",
  "hsl(210 100% 56%)", "hsl(142 71% 45%)", "hsl(280 67% 60%)",
  "hsl(215 12% 50%)", "hsl(340 75% 55%)", "hsl(170 70% 40%)",
];

const ComplaintList = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [complaintByType, setComplaintByType] = useState<any[]>([]);
  const [cpmuByProduct, setCpmuByProduct] = useState<any[]>([]);

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    const all = data ?? [];
    setComplaints(all);
    setLoading(false);

    // Pareto by type
    const byType: Record<string, number> = {};
    all.forEach((c) => { byType[c.complaint_type] = (byType[c.complaint_type] || 0) + 1; });
    setComplaintByType(
      Object.entries(byType)
        .map(([type, count]) => ({
          type: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    );

    // CPMU by product (30d)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = all.filter((c) => new Date(c.created_at).getTime() > thirtyDaysAgo);
    const byProduct: Record<string, number> = {};
    recent.forEach((c) => { byProduct[c.product] = (byProduct[c.product] || 0) + 1; });
    setCpmuByProduct(
      Object.entries(byProduct)
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    );
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
          <p className="metric-label mt-1">Track and manage complaint lifecycle</p>
        </div>
        <Button onClick={() => navigate("/complaints/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Log Complaint
        </Button>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="data-card">
          <h3 className="metric-label mb-3">Complaint Type Breakdown</h3>
          {complaintByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={complaintByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis type="number" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} />
                <YAxis dataKey="type" type="category" width={100} tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 90%)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {complaintByType.map((_, i) => (
                    <Cell key={i} fill={PARETO_COLORS[i % PARETO_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No data</p>
          )}
        </div>

        <div className="data-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <h3 className="metric-label">CPMU by Product (30d)</h3>
          </div>
          {cpmuByProduct.length > 0 ? (
            <div className="space-y-2">
              {cpmuByProduct.map((p) => (
                <div key={p.product} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px]">{p.product}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (p.count / (cpmuByProduct[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold w-6 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No data</p>
          )}
        </div>
      </div>

      <Input placeholder="Search by ID, product, or batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="data-card p-0 overflow-hidden">
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
                <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/complaints/${c.id}`)}>
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
      </div>
    </div>
  );
};

export default ComplaintList;
