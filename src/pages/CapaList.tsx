import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CapaStatusBadge } from "@/components/StatusBadge";
import { Plus } from "lucide-react";
import { CAPA_STAGES, CAPA_STAGE_LABELS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { TableFilters } from "@/components/TableFilters";

const CapaList = () => {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ severity: "all", status: "all", source: "all" });

  useEffect(() => { fetchCapas(); }, []);

  const fetchCapas = async () => {
    const { data } = await supabase.from("capas").select("*").order("created_at", { ascending: false });
    setCapas(data ?? []);
    setLoading(false);
  };

  const filtered = capas.filter((c) => {
    if (filters.severity !== "all" && c.severity !== filters.severity) return false;
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (filters.source !== "all" && c.source_type !== filters.source) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.capa_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || (c.source_reference ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const capasByStage = CAPA_STAGES.reduce((acc, stage) => {
    acc[stage] = filtered.filter((c) => c.status === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const sources = [...new Set(capas.map(c => c.source_type))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CAPA Management</h1>
          <p className="metric-label mt-1">Corrective and Preventive Actions</p>
        </div>
        <Button onClick={() => navigate("/capa/new")}><Plus className="mr-2 h-4 w-4" />Create CAPA</Button>
      </div>

      <TableFilters
        search={search} onSearchChange={setSearch}
        searchPlaceholder="Search by CAPA #, title, or reference..."
        filters={[
          { key: "severity", label: "Severity", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
          { key: "status", label: "Status", options: CAPA_STAGES.map(s => ({ value: s, label: CAPA_STAGE_LABELS[s] })) },
          { key: "source", label: "Source", options: sources.map(s => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })) },
        ]}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        resultCount={filtered.length}
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="data-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CAPA #</TableHead><TableHead>Title</TableHead><TableHead>Source</TableHead>
                  <TableHead>Severity</TableHead><TableHead>Status</TableHead><TableHead>Age</TableHead><TableHead>SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No CAPAs found</TableCell></TableRow>
                ) : filtered.map((capa) => (
                  <TableRow key={capa.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/capa/${capa.id}`)}>
                    <TableCell className="font-mono text-sm">{capa.capa_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{capa.title}</TableCell>
                    <TableCell className="text-sm">{capa.source_type}</TableCell>
                    <TableCell><SeverityBadge severity={capa.severity} /></TableCell>
                    <TableCell><CapaStatusBadge status={capa.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(capa.created_at), { addSuffix: false })}</TableCell>
                    <TableCell className="text-sm">{capa.sla_deadline ? formatDistanceToNow(new Date(capa.sla_deadline), { addSuffix: true }) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {CAPA_STAGES.map((stage) => (
              <div key={stage} className="data-card min-w-[220px] flex-shrink-0">
                <h4 className="metric-label mb-3">{CAPA_STAGE_LABELS[stage]}<span className="ml-2 text-foreground">({capasByStage[stage]?.length ?? 0})</span></h4>
                <div className="space-y-2">
                  {(capasByStage[stage] ?? []).map((capa: any) => (
                    <div key={capa.id} className="rounded-md border border-border p-2 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/capa/${capa.id}`)}>
                      <p className="text-xs font-mono">{capa.capa_number}</p>
                      <p className="text-sm truncate">{capa.title}</p>
                      <div className="mt-1"><SeverityBadge severity={capa.severity} /></div>
                    </div>
                  ))}
                  {(capasByStage[stage] ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Empty</p>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CapaList;
