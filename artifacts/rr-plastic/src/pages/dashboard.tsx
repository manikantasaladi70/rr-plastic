import { useGetDashboardSummary, useGetDashboardLowStock, useGetDashboardRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, ArrowDownToLine, ArrowUpFromLine, Users, Briefcase, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: lowStock, isLoading: isLoadingLowStock } = useGetDashboardLowStock();
  const { data: activity, isLoading: isLoadingActivity } = useGetDashboardRecentActivity();

  if (isLoadingSummary || isLoadingLowStock || isLoadingActivity) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of factory operations today.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMaterials}</div>
              <p className="text-xs text-destructive flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {summary.lowStockCount} low stock
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock Movements Today</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{summary.totalStockInToday}</div>
              <div className="text-sm font-medium text-destructive">-{summary.totalStockOutToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Workforce Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.presentToday} / {summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.absentToday} absent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Business Activity</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalChallansToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                challans generated today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock && lowStock.length > 0 ? (
              <div className="space-y-4">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold} {item.unit}</div>
                    </div>
                    <div className="text-destructive font-bold bg-destructive/10 px-2 py-1 rounded">
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No low stock alerts.</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center text-green-600">
                    <ArrowDownToLine className="mr-2 h-4 w-4" /> Recent Stock In
                  </h3>
                  <div className="space-y-2">
                    {activity.stockIn.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-muted/30 p-2 rounded">
                        <span>{item.materialName}</span>
                        <span className="font-medium text-green-600">+{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center text-destructive">
                    <ArrowUpFromLine className="mr-2 h-4 w-4" /> Recent Stock Out
                  </h3>
                  <div className="space-y-2">
                    {activity.stockOut.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-muted/30 p-2 rounded">
                        <span>{item.materialName}</span>
                        <span className="font-medium text-destructive">-{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
