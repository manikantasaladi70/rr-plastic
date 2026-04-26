import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  if (!token) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
