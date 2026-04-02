import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SeverityBadge } from "@/components/SeverityBadge";
import { toast } from "sonner";
import { COMPLAINT_TYPES, getAutoSeverity } from "@/lib/constants";

const ComplaintNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product: "",
    batch_number: "",
    complaint_type: "other" as string,
    source: "customer",
    description: "",
    complainant_name: "",
    complainant_contact: "",
    regulatory_flag: false,
  });

  const autoSeverity = getAutoSeverity(form.complaint_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .insert([{
          product: form.product,
          batch_number: form.batch_number || null,
          complaint_type: form.complaint_type as any,
          source: form.source,
          description: form.description,
          complainant_name: form.complainant_name || null,
          complainant_contact: form.complainant_contact || null,
          regulatory_flag: form.regulatory_flag,
          severity: autoSeverity as any,
          complaint_number: "",
          logged_by: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;
      toast.success("Complaint logged successfully");
      navigate(`/complaints/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log Complaint</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Complaint Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Complaint Type *</Label>
                <Select value={form.complaint_type} onValueChange={(v) => setForm({ ...form, complaint_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Auto-Severity</Label>
                <div className="pt-2"><SeverityBadge severity={autoSeverity} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complainant Name</Label>
                <Input value={form.complainant_name} onChange={(e) => setForm({ ...form, complainant_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Complainant Contact</Label>
              <Input value={form.complainant_contact} onChange={(e) => setForm({ ...form, complainant_contact: e.target.value })} placeholder="Email or phone" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.regulatory_flag} onCheckedChange={(v) => setForm({ ...form, regulatory_flag: v })} />
              <Label>Regulatory Escalation Required</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Logging..." : "Log Complaint"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/complaints")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintNew;
