import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CapaList from "./pages/CapaList";
import CapaNew from "./pages/CapaNew";
import CapaDetail from "./pages/CapaDetail";
import SupplierList from "./pages/SupplierList";
import SupplierDetail from "./pages/SupplierDetail";
import ComplaintList from "./pages/ComplaintList";
import ComplaintNew from "./pages/ComplaintNew";
import ComplaintDetail from "./pages/ComplaintDetail";
import HaccpList from "./pages/HaccpList";
import HaccpDetail from "./pages/HaccpDetail";
import IncomingInspectionList from "./pages/IncomingInspectionList";
import IncomingInspectionDetail from "./pages/IncomingInspectionDetail";
import DeviationList from "./pages/DeviationList";
import DeviationDetail from "./pages/DeviationDetail";
import AuditList from "./pages/AuditList";
import AuditDetail from "./pages/AuditDetail";
import ChangeControlList from "./pages/ChangeControlList";
import ChangeControlDetail from "./pages/ChangeControlDetail";
import DocumentList from "./pages/DocumentList";
import CalibrationList from "./pages/CalibrationList";
import CalibrationDetail from "./pages/CalibrationDetail";
import TrainingList from "./pages/TrainingList";
import TrainingDetail from "./pages/TrainingDetail";
import RiskRegister from "./pages/RiskRegister";
import AllergenControl from "./pages/AllergenControl";
import TraceabilityRecall from "./pages/TraceabilityRecall";
import ReportsHub from "./pages/ReportsHub";
import Administration from "./pages/Administration";
import EnvironmentalMonitoring from "./pages/EnvironmentalMonitoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/capa" element={<CapaList />} />
              <Route path="/capa/new" element={<CapaNew />} />
              <Route path="/capa/:id" element={<CapaDetail />} />
              <Route path="/suppliers" element={<SupplierList />} />
              <Route path="/suppliers/:id" element={<SupplierDetail />} />
              <Route path="/complaints" element={<ComplaintList />} />
              <Route path="/complaints/new" element={<ComplaintNew />} />
              <Route path="/complaints/:id" element={<ComplaintDetail />} />
              <Route path="/haccp" element={<HaccpList />} />
              <Route path="/haccp/:id" element={<HaccpDetail />} />
              <Route path="/incoming-inspection" element={<IncomingInspectionList />} />
              <Route path="/incoming-inspection/:id" element={<IncomingInspectionDetail />} />
              <Route path="/deviations" element={<DeviationList />} />
              <Route path="/deviations/:id" element={<DeviationDetail />} />
              <Route path="/audits" element={<AuditList />} />
              <Route path="/audits/:id" element={<AuditDetail />} />
              <Route path="/change-control" element={<ChangeControlList />} />
              <Route path="/change-control/:id" element={<ChangeControlDetail />} />
              <Route path="/documents" element={<DocumentList />} />
              <Route path="/calibration" element={<CalibrationList />} />
              <Route path="/calibration/:id" element={<CalibrationDetail />} />
              <Route path="/training" element={<TrainingList />} />
              <Route path="/training/:id" element={<TrainingDetail />} />
              <Route path="/risk" element={<RiskRegister />} />
              <Route path="/allergens" element={<AllergenControl />} />
              <Route path="/traceability" element={<TraceabilityRecall />} />
              <Route path="/reports" element={<ReportsHub />} />
              <Route path="/admin" element={<Administration />} />
              <Route path="/environmental-monitoring" element={<EnvironmentalMonitoring />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
