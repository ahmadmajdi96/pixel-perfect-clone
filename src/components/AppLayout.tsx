import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { profile, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              <span className="text-sm font-medium text-foreground">Quality Management System</span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="pulse-dot bg-status-running" />
                <span className="text-xs text-muted-foreground">System Active</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-severity-critical text-[10px] font-bold text-white">
                  0
                </span>
              </Button>
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                  <User className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-foreground leading-none">{profile?.full_name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground">Quality Team</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
