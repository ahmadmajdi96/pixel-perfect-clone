import {
  LayoutDashboard,
  AlertTriangle,
  Truck,
  MessageSquareWarning,
  Shield,
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CAPA", url: "/capa", icon: AlertTriangle },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Complaints", url: "/complaints", icon: MessageSquareWarning },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
            {!collapsed && (
              <p className="metric-label px-3 pb-2">Navigation</p>
            )}
            <SidebarMenu>
              {navItems.map((item) => (
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
