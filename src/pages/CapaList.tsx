import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CapaStatusBadge } from "@/components/StatusBadge";
import { Plus } from "lucide-react";
import { CAPA_STAGES, CAPA_STAGE_LABELS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

const CapaList = () => {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapas();
  }, []);

  const fetchCapas = async () => {
    const { data } = await supabase
      .from("capas")
      .select("*")
      .order("created_at", { ascending: false });
    setCapas(data ?? []);
    setLoading(false);
  };

  const capasByStage = CAPA_STAGES.reduce((acc, stage) => {
    acc[stage] = capas.filter((c) => c.status === stage);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CAPA Management</h1>
          <p className="text-sm text-muted-foreground">Corrective and Preventive Actions</p>
        </div>
        <Button onClick={() => navigate("/capa/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create CAPA
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CAPA #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>SLA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : capas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No CAPAs found</TableCell>
                    </TableRow>
                  ) : (
                    capas.map((capa) => (
                      <TableRow
                        key={capa.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/capa/${capa.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{capa.capa_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{capa.title}</TableCell>
                        <TableCell className="text-sm">{capa.source_type}</TableCell>
                        <TableCell><SeverityBadge severity={capa.severity} /></TableCell>
                        <TableCell><CapaStatusBadge status={capa.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(capa.created_at), { addSuffix: false })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {capa.sla_deadline
                            ? formatDistanceToNow(new Date(capa.sla_deadline), { addSuffix: true })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {CAPA_STAGES.map((stage) => (
              <Card key={stage} className="min-w-[220px] flex-shrink-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {CAPA_STAGE_LABELS[stage]}
                    <span className="ml-2 text-muted-foreground">({capasByStage[stage]?.length ?? 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(capasByStage[stage] ?? []).map((capa: any) => (
                    <div
                      key={capa.id}
                      className="rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/capa/${capa.id}`)}
                    >
                      <p className="text-xs font-mono">{capa.capa_number}</p>
                      <p className="text-sm truncate">{capa.title}</p>
                      <div className="mt-1"><SeverityBadge severity={capa.severity} /></div>
                    </div>
                  ))}
                  {(capasByStage[stage] ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CapaList;
