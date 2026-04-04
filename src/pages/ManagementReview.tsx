import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const ManagementReview = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [r1, r2] = await Promise.all([
      supabase.from("management_reviews").select("*").order("review_date", { ascending: false }),
      supabase.from("review_action_items").select("*").order("created_at", { ascending: false }),
    ]);
    setReviews(r1.data ?? []);
    setActionItems(r2.data ?? []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("management_reviews").insert({
      title: fd.get("title") as string,
      review_date: fd.get("review_date") as string || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Review scheduled"); setShowDialog(false); fetchData(); }
  };

  const nextReview = reviews.find(r => r.status === "scheduled" && r.review_date);
  const daysUntilNext = nextReview ? differenceInDays(new Date(nextReview.review_date), new Date()) : null;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Management Review</h1>
          <p className="text-muted-foreground text-sm mt-1">Periodic management review scheduling and tracking</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Schedule Review</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Management Review</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Title</Label><Input name="title" required placeholder="Q1 2026 Management Review" /></div>
              <div><Label>Review Date</Label><Input name="review_date" type="date" /></div>
              <Button type="submit" className="w-full">Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card text-center">
          <Calendar className="h-5 w-5 mx-auto text-primary" />
          <p className="metric-label mt-2">Next Review</p>
          <p className="text-lg font-bold mt-1">{daysUntilNext !== null ? `${daysUntilNext} days` : "Not scheduled"}</p>
          {daysUntilNext !== null && (
            <span className={`text-xs ${daysUntilNext < 14 ? "text-severity-critical" : daysUntilNext < 30 ? "text-severity-medium" : "text-status-closed"}`}>
              {daysUntilNext < 14 ? "Urgent" : daysUntilNext < 30 ? "Approaching" : "On Track"}
            </span>
          )}
        </div>
        <div className="data-card text-center">
          <p className="metric-label">Total Reviews</p>
          <p className="text-2xl font-bold mt-1">{reviews.length}</p>
        </div>
        <div className="data-card text-center">
          <p className="metric-label">Open Action Items</p>
          <p className="text-2xl font-bold mt-1">{actionItems.filter(a => a.status === "open").length}</p>
        </div>
      </div>

      <div className="data-card p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {reviews.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedReview(r)}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.review_date ? format(new Date(r.review_date), "PP") : "TBD"}</TableCell>
                <TableCell><span className="status-badge">{r.status}</span></TableCell>
                <TableCell>{actionItems.filter(a => a.review_id === r.id).length} items</TableCell>
              </TableRow>
            ))}
            {reviews.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No reviews scheduled</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selectedReview && (
        <div className="data-card">
          <h3 className="metric-label mb-3">Review Detail: {selectedReview.title}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-muted-foreground">Date:</span> <span className="ml-2 font-medium">{selectedReview.review_date ? format(new Date(selectedReview.review_date), "PPP") : "TBD"}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selectedReview.status}</span></div>
          </div>
          {selectedReview.minutes && <p className="text-sm text-muted-foreground">{selectedReview.minutes}</p>}
          <h4 className="text-sm font-semibold mt-4 mb-2">Action Items</h4>
          {actionItems.filter(a => a.review_id === selectedReview.id).length === 0 ? (
            <p className="text-sm text-muted-foreground">No action items</p>
          ) : (
            <div className="space-y-2">
              {actionItems.filter(a => a.review_id === selectedReview.id).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-md bg-accent/30">
                  {a.status === "closed" ? <CheckCircle className="h-4 w-4 text-status-closed" /> : <Clock className="h-4 w-4 text-severity-medium" />}
                  <span className="text-sm flex-1">{a.description}</span>
                  <span className="text-xs text-muted-foreground">{a.owner ?? "Unassigned"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagementReview;
