import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Settings, UserPlus, Trash2 } from "lucide-react";
import { TableFilters } from "@/components/TableFilters";
import { toast } from "sonner";
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";

const ROLES = Constants.public.Enums.app_role;

const ROLE_LABELS: Record<string, string> = {
  qa_manager: "QA Manager",
  food_safety_manager: "Food Safety Manager",
  quality_technician: "Quality Technician",
  food_technologist: "Food Technologist",
  supplier_quality_manager: "Supplier Quality Manager",
  plant_manager: "Plant Manager",
  system_admin: "System Admin",
};

const Administration = () => {
  const { user, roles: myRoles } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const isAdmin = myRoles.includes("system_admin");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    setProfiles(profilesRes.data ?? []);
    setUserRoles(rolesRes.data ?? []);
    setLoading(false);
  };

  const getUserRoles = (userId: string) =>
    userRoles.filter(r => r.user_id === userId).map(r => r.role);

  const assignRole = async () => {
    if (!selectedUserId || !selectedRole) { toast.error("Select user and role"); return; }
    const existing = userRoles.find(r => r.user_id === selectedUserId && r.role === selectedRole);
    if (existing) { toast.error("User already has this role"); return; }
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUserId, role: selectedRole as any,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Role assigned");
    setRoleDialogOpen(false);
    setSelectedUserId(""); setSelectedRole("");
    fetchData();
  };

  const removeRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast.error(error.message); return; }
    toast.success("Role removed");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">User management, role assignment & system configuration</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="metric-label">Total Users</p><p className="text-2xl font-bold">{profiles.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">Roles Assigned</p><p className="text-2xl font-bold text-primary">{userRoles.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="metric-label">Your Role</p><p className="text-2xl font-bold text-status-closed">{myRoles.length > 0 ? myRoles.map(r => ROLE_LABELS[r] || r).join(", ") : "None"}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users & Roles</TabsTrigger>
          <TabsTrigger value="config"><Settings className="mr-2 h-4 w-4" />Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!isAdmin}><UserPlus className="mr-2 h-4 w-4" />Assign Role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Role to User</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {profiles.map(p => (
                          <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={assignRole}>Assign Role</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {!isAdmin && <p className="text-sm text-severity-medium">You need System Admin role to manage user roles.</p>}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
                ) : profiles.map(p => {
                  const roles = getUserRoles(p.user_id);
                  const roleEntries = userRoles.filter(r => r.user_id === p.user_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.department || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roles.length === 0 ? <span className="text-xs text-muted-foreground">No roles</span> :
                            roles.map(r => (
                              <span key={r} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary border border-primary/30">
                                {ROLE_LABELS[r] || r}
                              </span>
                            ))
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            {roleEntries.map(re => (
                              <Button key={re.id} size="sm" variant="ghost" className="h-6 text-xs text-severity-critical" onClick={() => removeRole(re.id)}>
                                <Trash2 className="h-3 w-3 mr-1" />{ROLE_LABELS[re.role] || re.role}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">CAPA Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Default SLA (days from creation)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {[{ label: "Critical", value: "3" }, { label: "High", value: "7" }, { label: "Medium", value: "14" }, { label: "Low", value: "30" }].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <Input className="text-center h-8" defaultValue={s.value} readOnly />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Effectiveness Check Periods</Label>
                  <p className="text-sm">30 / 60 / 90 days post-closure</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">System Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Complaint Auto-Escalation</Label>
                  <p className="text-sm">Critical complaints auto-flagged for regulatory review</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Audit Score Threshold</Label>
                  <p className="text-sm">Minimum passing score: 80%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Calibration Alert Window</Label>
                  <p className="text-sm">Alert 30 days before due date</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
