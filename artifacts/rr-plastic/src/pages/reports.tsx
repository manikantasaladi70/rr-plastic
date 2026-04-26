import { useState } from "react";
import { useGetMonthlyReport } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: report, isLoading } = useGetMonthlyReport({ month: parseInt(month), year: parseInt(year) });

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monthly Report</h1>
          <p className="text-muted-foreground text-sm">Complete summary of stock, salary, and customer activity.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print Report</Button>
      </div>

      <div className="flex gap-4">
        <div>
          <Label>Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading report...</div>}

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{report.totalStockIn.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{MONTHS[parseInt(month)-1]} {year}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{report.totalStockOut.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Material Balance</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.materialBalance >= 0 ? "text-primary" : "text-destructive"}`}>{report.materialBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Salary Payable</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">&#8377;{report.totalSalaryPayable.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-3">Stock In by Material</h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.stockInByMaterial.map(s => (
                      <TableRow key={s.materialId}>
                        <TableCell>{s.materialName}</TableCell>
                        <TableCell className="text-right font-medium text-green-700">{Number(s.totalQty).toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                    {!report.stockInByMaterial.length && <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Stock Out by Material</h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.stockOutByMaterial.map(s => (
                      <TableRow key={s.materialId}>
                        <TableCell>{s.materialName}</TableCell>
                        <TableCell className="text-right font-medium text-orange-700">{Number(s.totalQty).toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                    {!report.stockOutByMaterial.length && <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Employee Salary Report</h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Half Day</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead className="font-bold">Final Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.salaryReport.map(r => (
                    <TableRow key={r.employeeId}>
                      <TableCell className="font-medium">{r.employeeName}</TableCell>
                      <TableCell className="text-center text-green-700">{r.presentDays}</TableCell>
                      <TableCell className="text-center text-yellow-700">{r.halfDays}</TableCell>
                      <TableCell className="text-center text-red-700">{r.absentDays}</TableCell>
                      <TableCell>&#8377;{r.dailySalary}</TableCell>
                      <TableCell className="font-bold text-primary">&#8377;{r.finalSalary.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot>
                  <tr className="bg-muted/50 border-t font-bold">
                    <td colSpan={5} className="px-4 py-3 text-sm">Total Salary Payable</td>
                    <td className="px-4 py-3 text-primary">&#8377;{report.totalSalaryPayable.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Customer Summary</h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Material Issued</TableHead>
                    <TableHead className="text-right">Production Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.customerSummary.filter(c => c.totalMaterialIssued > 0 || c.totalProductionReceived > 0).map(c => (
                    <TableRow key={c.customerId}>
                      <TableCell className="font-medium">{c.customerName}</TableCell>
                      <TableCell className="text-right">{c.totalMaterialIssued.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{c.totalProductionReceived.toFixed(3)}</TableCell>
                      <TableCell className={`text-right font-medium ${c.balance > 0 ? "text-orange-600" : "text-green-600"}`}>{c.balance.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                  {!report.customerSummary.some(c => c.totalMaterialIssued > 0 || c.totalProductionReceived > 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No customer activity this month</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
