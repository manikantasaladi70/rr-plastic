import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Materials from "@/pages/materials";
import StockIn from "@/pages/stock-in";
import StockOut from "@/pages/stock-out";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Salary from "@/pages/salary";
import Customers from "@/pages/customers";
import Production from "@/pages/production";
import DeliveryChallans from "@/pages/delivery-challans";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/materials" component={Materials} />
      <ProtectedRoute path="/stock-in" component={StockIn} />
      <ProtectedRoute path="/stock-out" component={StockOut} />
      <ProtectedRoute path="/employees" component={Employees} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/salary" component={Salary} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/production" component={Production} />
      <ProtectedRoute path="/delivery-challans" component={DeliveryChallans} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
