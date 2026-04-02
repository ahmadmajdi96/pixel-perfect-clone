import {
  LayoutDashboard,
  AlertTriangle,
  Truck,
  MessageSquareWarning,
  Shield,
  ShieldAlert,
  ClipboardCheck,
  GitPullRequest,
  FileText,
  Wrench,
  GraduationCap,
  TriangleAlert,
  ClipboardList,
  PackageSearch,
  Wheat,
  GitBranch,
  BarChart3,
  Settings,
  Microscope,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const coreNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CAPA", url: "/capa", icon: AlertTriangle },
  { title: "Complaints", url: "/complaints", icon: MessageSquareWarning },
  { title: "Deviations", url: "/deviations", icon: TriangleAlert },
];

const qualityNav = [
  { title: "HACCP", url: "/haccp", icon: ShieldAlert },
  { title: "Allergens", url: "/allergens", icon: Wheat },
  { title: "Inspections", url: "/incoming-inspection", icon: ClipboardCheck },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Audits", url: "/audits", icon: ClipboardList },
  { title: "Traceability", url: "/traceability", icon: GitBranch },
  { title: "EMP", url: "/environmental-monitoring", icon: Microscope },
];

const systemNav = [
  { title: "Change Control", url: "/change-control", icon: GitPullRequest },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Calibration", url: "/calibration", icon: Wrench },
  { title: "Training", url: "/training", icon: GraduationCap },
  { title: "Risk Register", url: "/risk", icon: PackageSearch },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Admin", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderNavGroup = (label: string, items: typeof coreNav) => (
    <>
      {!collapsed && <p className="metric-label px-3 pb-1 pt-3">{label}</p>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                end={item.url === "/dashboard"}
                className="hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div>
                  <span className="text-sm font-bold tracking-wide text-sidebar-accent-foreground">QMS</span>
                  <p className="text-[10px] text-sidebar-foreground leading-none mt-0.5">Quality Management</p>
                </div>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavGroup("Core", coreNav)}
            {renderNavGroup("Quality", qualityNav)}
            {renderNavGroup("System", systemNav)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
