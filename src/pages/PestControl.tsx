import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Bug, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ACTIVITY_COLORS: Record<string, string> = {
  low: "bg-[hsl(var(--status-closed)/0.15)] text-status-closed border border-[hsl(var(--status-closed)/0.3)]",
  medium: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
  high: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
};

const PestControl = () => {
  const [sightings, setSightings] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sightings" | "stations">("sightings");
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [r1, r2] = await Promise.all([
      supabase.from("pest_sightings").select("*").order("sighting_date", { ascending: false }),
      supabase.from("pest_bait_stations").select("*").order("station_code"),
    ]);
    setSightings(r1.data ?? []);
    setStations(r2.data ?? []);
    setLoading(false);
  };

  const handleLogSighting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("pest_sightings").insert({
      pest_type: fd.get("pest_type") as string,
      location: fd.get("location") as string,
      activity_level: fd.get("activity_level") as string,
      immediate_action: fd.get("immediate_action") as string,
    });
    if (error) toast.error(error.message);
    else { toast.success("Sighting logged"); setShowDialog(false); fetchData(); }
  };

  const filtered = tab === "sightings"
    ? sightings.filter(s => s.pest_type?.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()))
    : stations.filter(s => s.station_code?.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pest Control Program</h1>
          <p className="text-muted-foreground text-sm mt-1">Pest sightings, bait station management, and activity trending</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Bug className="mr-2 h-4 w-4" /> Log Sighting</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Pest Sighting</DialogTitle></DialogHeader>
            <form onSubmit={handleLogSighting} className="space-y-3">
              <div><Label>Pest Type</Label><Input name="pest_type" required placeholder="e.g. Rodent, Flying insect" /></div>
              <div><Label>Location</Label><Input name="location" required /></div>
              <div><Label>Activity Level</Label>
                <select name="activity_level" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div><Label>Immediate Action</Label><Input name="immediate_action" /></div>
              <Button type="submit" className="w-full">Log Sighting</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center"><p className="metric-label">Total Sightings</p><p className="text-2xl font-bold mt-1">{sightings.length}</p></div>
        <div className="data-card text-center"><p className="metric-label">High Activity</p><p className="text-2xl font-bold text-severity-critical mt-1">{sightings.filter(s => s.activity_level === "high").length}</p></div>
        <div className="data-card text-center"><MapPin className="h-5 w-5 mx-auto text-primary" /><p className="metric-label mt-1">Bait Stations</p><p className="text-2xl font-bold mt-1">{stations.length}</p></div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "sightings" ? "default" : "outline"} size="sm" onClick={() => { setTab("sightings"); setSelected(null); }}>Pest Sightings</Button>
        <Button variant={tab === "stations" ? "default" : "outline"} size="sm" onClick={() => { setTab("stations"); setSelected(null); }}>Bait Stations</Button>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="data-card p-0 overflow-hidden">
        {tab === "sightings" ? (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Pest Type</TableHead><TableHead>Location</TableHead><TableHead>Activity</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(filtered as any[]).map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected({ ...s, _type: "sighting" })}>
                  <TableCell className="text-xs">{format(new Date(s.sighting_date), "PP")}</TableCell>
                  <TableCell className="font-medium">{s.pest_type}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell><span className={`status-badge ${ACTIVITY_COLORS[s.activity_level] ?? ""}`}>{s.activity_level}</span></TableCell>
                  <TableCell><span className="status-badge">{s.status}</span></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sightings</TableCell></TableRow>}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Last Inspected</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(filtered as any[]).map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected({ ...s, _type: "station" })}>
                  <TableCell className="font-mono text-xs">{s.station_code}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>{s.station_type}</TableCell>
                  <TableCell><span className="status-badge">{s.status}</span></TableCell>
                  <TableCell className="text-xs">{s.last_inspected_at ? format(new Date(s.last_inspected_at), "PP") : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No stations</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </div>

      {selected && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="metric-label">{selected._type === "sighting" ? "Sighting Detail" : "Station Detail"}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          {selected._type === "sighting" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Pest Type:</span> <span className="ml-2 font-medium">{selected.pest_type}</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="ml-2">{selected.location}</span></div>
              <div><span className="text-muted-foreground">Activity Level:</span> <span className="ml-2">{selected.activity_level}</span></div>
              <div><span className="text-muted-foreground">Quantity Estimate:</span> <span className="ml-2">{selected.quantity_estimate ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="ml-2">{format(new Date(selected.sighting_date), "PPP")}</span></div>
              {selected.immediate_action && <div className="col-span-full"><span className="text-muted-foreground">Immediate Action:</span> <span className="ml-2">{selected.immediate_action}</span></div>}
              {selected.corrective_action && <div className="col-span-full"><span className="text-muted-foreground">Corrective Action:</span> <span className="ml-2">{selected.corrective_action}</span> <span className="text-xs text-muted-foreground ml-2">({selected.corrective_action_status})</span></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Code:</span> <span className="ml-2 font-mono">{selected.station_code}</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="ml-2">{selected.location}</span></div>
              <div><span className="text-muted-foreground">Type:</span> <span className="ml-2">{selected.station_type}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selected.status}</span></div>
              <div><span className="text-muted-foreground">Contractor:</span> <span className="ml-2">{selected.contractor ?? "—"}</span></div>
              {selected.last_inspected_at && <div><span className="text-muted-foreground">Last Inspected:</span> <span className="ml-2">{format(new Date(selected.last_inspected_at), "PPP")}</span></div>}
              {selected.next_inspection_due && <div><span className="text-muted-foreground">Next Due:</span> <span className="ml-2">{format(new Date(selected.next_inspection_due), "PPP")}</span></div>}
              {selected.notes && <div className="col-span-full"><span className="text-muted-foreground">Notes:</span> <span className="ml-2">{selected.notes}</span></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PestControl;
