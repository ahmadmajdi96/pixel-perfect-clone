import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    const notifs = data ?? [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.is_read).length);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    fetchNotifications();
  };

  const typeStyles: Record<string, string> = {
    critical: "border-l-severity-critical bg-severity-critical/5",
    warning: "border-l-severity-medium bg-severity-medium/5",
    info: "border-l-primary bg-primary/5",
  };

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-severity-critical text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-3 py-2.5 border-l-2 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                            typeStyles[n.type] || typeStyles.info
                          } ${n.is_read ? "opacity-60" : ""}`}
                          onClick={() => {
                            if (n.link) navigate(n.link);
                          }}
                        >
                          <p className="text-xs font-medium">{n.title}</p>
                          {n.message && <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
