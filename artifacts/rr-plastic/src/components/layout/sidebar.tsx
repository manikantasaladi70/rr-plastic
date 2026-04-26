import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Box,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  CalendarCheck,
  Banknote,
  Briefcase,
  Factory,
  FileText,
  LineChart,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Materials", href: "/materials", icon: Box },
  { name: "Stock In", href: "/stock-in", icon: ArrowDownToLine },
  { name: "Stock Out", href: "/stock-out", icon: ArrowUpFromLine },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Salary", href: "/salary", icon: Banknote },
  { name: "Customers", href: "/customers", icon: Briefcase },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Delivery Challans", href: "/delivery-challans", icon: FileText },
  { name: "Reports", href: "/reports", icon: LineChart },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 shrink-0 items-center px-6 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
        <span className="font-bold text-lg tracking-tight">RR Plastics</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-bold shrink-0">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sidebar-foreground truncate">{user?.username}</span>
            <span className="text-xs text-sidebar-foreground/70 truncate capitalize">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}
