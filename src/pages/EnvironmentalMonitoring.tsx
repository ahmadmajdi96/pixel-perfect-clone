import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, MapPin, TestTube, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { TableFilters } from "@/components/TableFilters";
import { format } from "date-fns";

type Zone = {
  id: string; zone_name: string; zone_number: string; zone_type: string;
  area_description: string | null; risk_level: string; status: string;
};
type SamplingPoint = {
  id: string; zone_id: string; point_code: string; location_description: string | null;
  surface_type: string | null; test_type: string; frequency: string; status: string;
  emp_zones?: { zone_name: string; zone_type: string } | null;
};
type SampleResult = {
  id: string; sampling_point_id: string; sample_date: string; result: string;
  organism_detected: string | null; cfu_count: number | null;
  corrective_action: string | null; corrective_action_status: string | null;
  notes: string | null;
  emp_sampling_points?: { point_code: string; location_description: string | null } | null;
};

const ZONE_TYPES = ["zone_1", "zone_2", "zone_3", "zone_4"];
const RISK_LEVELS = ["critical", "high", "medium", "low"];
const TEST_TYPES = ["swab", "air_plate", "contact_plate", "rinse_water"];
const FREQUENCIES = ["daily", "weekly", "bi-weekly", "monthly", "quarterly"];
const RESULTS = ["pass", "fail", "pending"];

const EnvironmentalMonitoring = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [points, setPoints] = useState<SamplingPoint[]>([]);
  const [results, setResults] = useState<SampleResult[]>([]);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showPointDialog, setShowPointDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [zoneForm, setZoneForm] = useState({ zone_name: "", zone_number: "", zone_type: "zone_1", area_description: "", risk_level: "medium" });
  const [pointForm, setPointForm] = useState({ zone_id: "", point_code: "", location_description: "", surface_type: "", test_type: "swab", frequency: "weekly" });
  const [resultForm, setResultForm] = useState({ sampling_point_id: "", result: "pending", organism_detected: "", cfu_count: "", corrective_action: "", notes: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [z, p, r] = await Promise.all([
      supabase.from("emp_zones").select("*").order("zone_number"),
      supabase.from("emp_sampling_points").select("*, emp_zones(zone_name, zone_type)").order("point_code"),
      supabase.from("emp_sample_results").select("*, emp_sampling_points(point_code, location_description)").order("sample_date", { ascending: false }).limit(100),
    ]);
    if (z.data) setZones(z.data);
    if (p.data) setPoints(p.data as any);
    if (r.data) setResults(r.data as any);
    setLoading(false);
  };

  const createZone = async () => {
    const { error } = await supabase.from("emp_zones").insert([zoneForm]);
    if (error) { toast.error(error.message); return; }
    toast.success("Zone created");
    setShowZoneDialog(false);
    setZoneForm({ zone_name: "", zone_number: "", zone_type: "zone_1", area_description: "", risk_level: "medium" });
    fetchAll();
  };

  const createPoint = async () => {
    if (!pointForm.zone_id) { toast.error("Select a zone"); return; }
    const { error } = await supabase.from("emp_sampling_points").insert([pointForm]);
    if (error) { toast.error(error.message); return; }
    toast.success("Sampling point created");
    setShowPointDialog(false);
    setPointForm({ zone_id: "", point_code: "", location_description: "", surface_type: "", test_type: "swab", frequency: "weekly" });
    fetchAll();
  };

  const createResult = async () => {
    if (!resultForm.sampling_point_id) { toast.error("Select a sampling point"); return; }
    const payload: any = {
      sampling_point_id: resultForm.sampling_point_id,
      result: resultForm.result,
      organism_detected: resultForm.organism_detected || null,
      cfu_count: resultForm.cfu_count ? Number(resultForm.cfu_count) : null,
      corrective_action: resultForm.corrective_action || null,
      corrective_action_status: resultForm.result === "fail" ? "required" : "none",
      notes: resultForm.notes || null,
    };
    const { error } = await supabase.from("emp_sample_results").insert([payload]);
    if (error) { toast.error(error.message); return; }
    toast.success("Sample result recorded");
    if (resultForm.result === "fail") {
      toast.warning("⚠️ Failed result — corrective action triggered!", { duration: 5000 });
    }
    setShowResultDialog(false);
    setResultForm({ sampling_point_id: "", result: "pending", organism_detected: "", cfu_count: "", corrective_action: "", notes: "" });
    fetchAll();
  };

  const failCount = results.filter(r => r.result === "fail").length;
  const passCount = results.filter(r => r.result === "pass").length;
  const pendingCount = results.filter(r => r.result === "pending").length;

  const zoneFilters = [
    { key: "zone_type", label: "Zone Type", options: ZONE_TYPES.map(t => ({ value: t, label: t.replace("_", " ").toUpperCase() })) },
    { key: "risk_level", label: "Risk", options: RISK_LEVELS.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })) },
  ];

  const filteredZones = zones.filter(z => {
    if (search && !z.zone_name.toLowerCase().includes(search.toLowerCase()) && !z.zone_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterValues.zone_type && filterValues.zone_type !== "all" && z.zone_type !== filterValues.zone_type) return false;
    if (filterValues.risk_level && filterValues.risk_level !== "all" && z.risk_level !== filterValues.risk_level) return false;
    return true;
  });

  const filteredPoints = points.filter(p => {
    if (search && !p.point_code.toLowerCase().includes(search.toLowerCase()) && !(p.location_description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredResults = results.filter(r => {
    if (search && !(r.emp_sampling_points?.point_code || "").toLowerCase().includes(search.toLowerCase()) && !(r.organism_detected || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Environmental Monitoring</h1>
          <p className="text-sm text-muted-foreground">Zone definitions, sampling schedules & corrective actions</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Zones", value: zones.length, icon: MapPin },
          { label: "Sample Points", value: points.length, icon: TestTube },
          { label: "Pass", value: passCount, icon: CheckCircle },
          { label: "Fail", value: failCount, icon: XCircle },
          { label: "Pending", value: pendingCount, icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="data-card p-4">
            <div className="flex items-center gap-2">
              <k.icon className="h-4 w-4 text-muted-foreground" />
              <p className="metric-label">{k.label}</p>
            </div>
            <p className="text-2xl font-bold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="points">Sampling Points</TabsTrigger>
          <TabsTrigger value="results">Sample Results</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search zones..."
              filters={zoneFilters}
              filterValues={filterValues}
              onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
              resultCount={filteredZones.length}
            />
            <Button size="sm" onClick={() => setShowZoneDialog(true)}><Plus className="mr-1 h-4 w-4" />Add Zone</Button>
          </div>
          <div className="data-card overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Zone #</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead>
                <TableHead>Area</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredZones.map(z => (
                  <TableRow key={z.id}>
                    <TableCell className="font-mono">{z.zone_number}</TableCell>
                    <TableCell className="font-medium">{z.zone_name}</TableCell>
                    <TableCell><Badge variant="outline">{z.zone_type.replace("_", " ").toUpperCase()}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{z.area_description || "—"}</TableCell>
                    <TableCell><SeverityBadge severity={z.risk_level} /></TableCell>
                    <TableCell><Badge variant={z.status === "active" ? "default" : "secondary"}>{z.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {filteredZones.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No zones found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowPointDialog(true)}><Plus className="mr-1 h-4 w-4" />Add Point</Button>
          </div>
          <div className="data-card overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Code</TableHead><TableHead>Zone</TableHead><TableHead>Location</TableHead>
                <TableHead>Surface</TableHead><TableHead>Test</TableHead><TableHead>Frequency</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredPoints.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.point_code}</TableCell>
                    <TableCell>{p.emp_zones?.zone_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.location_description || "—"}</TableCell>
                    <TableCell>{p.surface_type || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{p.test_type.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{p.frequency}</TableCell>
                  </TableRow>
                ))}
                {filteredPoints.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sampling points found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowResultDialog(true)}><Plus className="mr-1 h-4 w-4" />Record Result</Button>
          </div>
          <div className="data-card overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Point</TableHead><TableHead>Result</TableHead>
                <TableHead>Organism</TableHead><TableHead>CFU</TableHead><TableHead>Corrective Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredResults.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.sample_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-mono">{r.emp_sampling_points?.point_code || "—"}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={r.result === "fail" ? "critical" : r.result === "pass" ? "low" : "medium"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.organism_detected || "—"}</TableCell>
                    <TableCell>{r.cfu_count ?? "—"}</TableCell>
                    <TableCell>
                      {r.corrective_action_status === "required" ? (
                        <span className="text-xs text-destructive font-medium">⚠ Required</span>
                      ) : r.corrective_action_status === "completed" ? (
                        <span className="text-xs text-status-closed font-medium">✓ Done</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredResults.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No results found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Zone Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Zone</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Zone Number</Label><Input value={zoneForm.zone_number} onChange={e => setZoneForm(f => ({ ...f, zone_number: e.target.value }))} placeholder="Z-01" /></div>
              <div><Label>Zone Name</Label><Input value={zoneForm.zone_name} onChange={e => setZoneForm(f => ({ ...f, zone_name: e.target.value }))} placeholder="Production Hall A" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Zone Type</Label>
                <Select value={zoneForm.zone_type} onValueChange={v => setZoneForm(f => ({ ...f, zone_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ZONE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ").toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Risk Level</Label>
                <Select value={zoneForm.risk_level} onValueChange={v => setZoneForm(f => ({ ...f, risk_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Area Description</Label><Textarea value={zoneForm.area_description} onChange={e => setZoneForm(f => ({ ...f, area_description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={createZone}>Create Zone</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Point Dialog */}
      <Dialog open={showPointDialog} onOpenChange={setShowPointDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sampling Point</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Zone</Label>
              <Select value={pointForm.zone_id} onValueChange={v => setPointForm(f => ({ ...f, zone_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.zone_number} — {z.zone_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Point Code</Label><Input value={pointForm.point_code} onChange={e => setPointForm(f => ({ ...f, point_code: e.target.value }))} placeholder="SP-001" /></div>
              <div><Label>Surface Type</Label><Input value={pointForm.surface_type} onChange={e => setPointForm(f => ({ ...f, surface_type: e.target.value }))} placeholder="Stainless steel" /></div>
            </div>
            <div><Label>Location</Label><Input value={pointForm.location_description} onChange={e => setPointForm(f => ({ ...f, location_description: e.target.value }))} placeholder="Conveyor belt junction" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Test Type</Label>
                <Select value={pointForm.test_type} onValueChange={v => setPointForm(f => ({ ...f, test_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Frequency</Label>
                <Select value={pointForm.frequency} onValueChange={v => setPointForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={createPoint}>Create Point</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Sample Result</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Sampling Point</Label>
              <Select value={resultForm.sampling_point_id} onValueChange={v => setResultForm(f => ({ ...f, sampling_point_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select point" /></SelectTrigger>
                <SelectContent>{points.map(p => <SelectItem key={p.id} value={p.id}>{p.point_code} — {p.location_description || p.emp_zones?.zone_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Result</Label>
                <Select value={resultForm.result} onValueChange={v => setResultForm(f => ({ ...f, result: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>CFU Count</Label><Input type="number" value={resultForm.cfu_count} onChange={e => setResultForm(f => ({ ...f, cfu_count: e.target.value }))} placeholder="0" /></div>
            </div>
            <div><Label>Organism Detected</Label><Input value={resultForm.organism_detected} onChange={e => setResultForm(f => ({ ...f, organism_detected: e.target.value }))} placeholder="e.g. Listeria monocytogenes" /></div>
            {resultForm.result === "fail" && (
              <div><Label>Corrective Action</Label><Textarea value={resultForm.corrective_action} onChange={e => setResultForm(f => ({ ...f, corrective_action: e.target.value }))} placeholder="Describe corrective action taken..." /></div>
            )}
            <div><Label>Notes</Label><Textarea value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={createResult}>Record Result</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnvironmentalMonitoring;
