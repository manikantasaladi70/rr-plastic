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

  const s = {
    wrap: { fontFamily: "Arial, sans-serif", padding: "40px", fontSize: "13px", color: "#000" },
    title: { textAlign: "right" as const, fontSize: "24px", fontWeight: "bold", marginBottom: "20px" },
    topRow: { display: "flex", justifyContent: "space-between", borderTop: "2px solid #000", borderBottom: "1px solid #000", padding: "8px 0", marginBottom: "24px" },
    topLabel: { fontWeight: "bold", fontSize: "11px", display: "block", marginBottom: "4px" },
    sectionTitle: { fontSize: "14px", fontWeight: "bold", marginBottom: "8px", marginTop: "24px", borderBottom: "1px solid #ccc", paddingBottom: "4px" },
    summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "24px" },
    summaryCard: { border: "1px solid #ccc", borderRadius: "6px", padding: "12px" },
    summaryLabel: { fontSize: "11px", color: "#666", marginBottom: "4px" },
    summaryValue: { fontSize: "20px", fontWeight: "bold" },
    table: { width: "100%", borderCollapse: "collapse" as const, marginBottom: "20px" },
    th: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "left" as const },
    thR: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "right" as const },
    thC: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "center" as const },
    td: { padding: "8px", border: "1px solid #ccc", fontSize: "12px" },
    tdR: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const },
    tdC: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "center" as const },
    tdBold: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", fontWeight: "bold" },
    tdBoldR: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", fontWeight: "bold", textAlign: "right" as const },
    tdTotal: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", fontWeight: "bold", textAlign: "right" as const, background: "#f5f5f5" },
    tdTotalLabel: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", fontWeight: "bold", textAlign: "right" as const, background: "#f5f5f5" },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    sig: { display: "flex", justifyContent: "space-between", marginTop: "60px", fontSize: "13px" },
  };

  const print = () => {
    if (!report) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const monthName = MONTHS[parseInt(month) - 1];

    const stockInRows = report.stockInByMaterial.map((s, i) =>
      `<tr><td style="padding:8px;border:1px solid #ccc">${i+1}</td><td style="padding:8px;border:1px solid #ccc">${s.materialName}</td><td style="padding:8px;border:1px solid #ccc;text-align:right">${Number(s.totalQty).toFixed(3)}</td></tr>`
    ).join("") || `<tr><td colspan="3" style="padding:8px;border:1px solid #ccc;text-align:center;color:#999">No data</td></tr>`;

    const stockOutRows = report.stockOutByMaterial.map((s, i) =>
      `<tr><td style="padding:8px;border:1px solid #ccc">${i+1}</td><td style="padding:8px;border:1px solid #ccc">${s.materialName}</td><td style="padding:8px;border:1px solid #ccc;text-align:right">${Number(s.totalQty).toFixed(3)}</td></tr>`
    ).join("") || `<tr><td colspan="3" style="padding:8px;border:1px solid #ccc;text-align:center;color:#999">No data</td></tr>`;

    const salaryRows = report.salaryReport.map((r, i) =>
      `<tr>
        <td style="padding:8px;border:1px solid #ccc">${i+1}</td>
        <td style="padding:8px;border:1px solid #ccc">${r.employeeName}</td>
        <td style="padding:8px;border:1px solid #ccc">${r.role}</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:center">${r.presentDays}</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:center">${r.halfDays}</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:center">${r.absentDays}</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:right">₹${Number(r.dailySalary).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold">₹${r.finalSalary.toFixed(2)}</td>
      </tr>`
    ).join("") || `<tr><td colspan="8" style="padding:8px;border:1px solid #ccc;text-align:center;color:#999">No data</td></tr>`;

    const customerRows = report.customerSummary
      .filter(c => c.totalMaterialIssued > 0 || c.totalProductionReceived > 0)
      .map((c, i) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ccc">${i+1}</td>
          <td style="padding:8px;border:1px solid #ccc">${c.customerName}</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:right">${c.totalMaterialIssued.toFixed(3)}</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:right">${c.totalProductionReceived.toFixed(3)}</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;color:${c.balance > 0 ? "#c05c00" : "#1a7a1a"}">${c.balance.toFixed(3)}</td>
        </tr>`
      ).join("") || `<tr><td colspan="5" style="padding:8px;border:1px solid #ccc;text-align:center;color:#999">No customer activity this month</td></tr>`;

    w.document.write(`<html><head><title>Monthly Report - ${monthName} ${year}</title></head><body>
<div style="font-family:Arial,sans-serif;padding:40px;font-size:13px;color:#000">

  <div style="text-align:right;font-size:24px;font-weight:bold;margin-bottom:20px">Monthly Report</div>

  <div style="display:flex;justify-content:space-between;border-top:2px solid #000;border-bottom:1px solid #000;padding:8px 0;margin-bottom:24px">
    <div style="flex:1"><span style="font-weight:bold;font-size:11px;display:block;margin-bottom:4px">COMPANY</span>RR Plastics</div>
    <div style="flex:1"><span style="font-weight:bold;font-size:11px;display:block;margin-bottom:4px">PERIOD</span>${monthName} ${year}</div>
    <div style="flex:1"><span style="font-weight:bold;font-size:11px;display:block;margin-bottom:4px">TOTAL SALARY PAYABLE</span>₹${report.totalSalaryPayable.toFixed(2)}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="border:1px solid #ccc;border-radius:6px;padding:12px">
      <div style="font-size:11px;color:#666;margin-bottom:4px">Total Stock In</div>
      <div style="font-size:20px;font-weight:bold;color:#166534">${report.totalStockIn.toFixed(2)}</div>
    </div>
    <div style="border:1px solid #ccc;border-radius:6px;padding:12px">
      <div style="font-size:11px;color:#666;margin-bottom:4px">Total Stock Out</div>
      <div style="font-size:20px;font-weight:bold;color:#c2410c">${report.totalStockOut.toFixed(2)}</div>
    </div>
    <div style="border:1px solid #ccc;border-radius:6px;padding:12px">
      <div style="font-size:11px;color:#666;margin-bottom:4px">Material Balance</div>
      <div style="font-size:20px;font-weight:bold;color:${report.materialBalance >= 0 ? "#1d4ed8" : "#dc2626"}">${report.materialBalance.toFixed(2)}</div>
    </div>
    <div style="border:1px solid #ccc;border-radius:6px;padding:12px">
      <div style="font-size:11px;color:#666;margin-bottom:4px">Total Salary Payable</div>
      <div style="font-size:20px;font-weight:bold;color:#1d4ed8">₹${report.totalSalaryPayable.toFixed(2)}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
    <div>
      <div style="font-size:14px;font-weight:bold;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">Stock In by Material</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">#</th>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">Material</th>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Total Qty</th>
        </tr></thead>
        <tbody>${stockInRows}</tbody>
      </table>
    </div>
    <div>
      <div style="font-size:14px;font-weight:bold;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">Stock Out by Material</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">#</th>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">Material</th>
          <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Total Qty</th>
        </tr></thead>
        <tbody>${stockOutRows}</tbody>
      </table>
    </div>
  </div>

  <div style="margin-bottom:24px">
    <div style="font-size:14px;font-weight:bold;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">Employee Salary Report</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc">#</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">Employee</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">Role</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:center">Present</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:center">Half</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:center">Absent</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Daily Rate</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Final Salary</th>
      </tr></thead>
      <tbody>
        ${salaryRows}
        <tr>
          <td colspan="7" style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;background:#f5f5f5">TOTAL SALARY PAYABLE</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;background:#f5f5f5">₹${report.totalSalaryPayable.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="margin-bottom:24px">
    <div style="font-size:14px;font-weight:bold;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">Customer Summary</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc">#</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:left">Customer</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Material Issued</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Production Received</th>
        <th style="background:#f5f5f5;font-size:11px;font-weight:bold;padding:8px;border:1px solid #ccc;text-align:right">Balance</th>
      </tr></thead>
      <tbody>${customerRows}</tbody>
    </table>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:60px;font-size:13px">
    <div>Prepared by: _______________</div>
    <div>Authorised Signatory: _______________</div>
  </div>

</div>
</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monthly Report</h1>
          <p className="text-muted-foreground text-sm">Complete summary of stock, salary, and customer activity.</p>
        </div>
        <Button variant="outline" onClick={print} disabled={!report}>
          <Printer className="mr-2 h-4 w-4" />Print Report
        </Button>
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
                <div className="text-2xl font-bold text-blue-600">₹{report.totalSalaryPayable.toFixed(2)}</div>
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
                      <TableCell>₹{r.dailySalary}</TableCell>
                      <TableCell className="font-bold text-primary">₹{r.finalSalary.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot>
                  <tr className="bg-muted/50 border-t font-bold">
                    <td colSpan={5} className="px-4 py-3 text-sm">Total Salary Payable</td>
                    <td className="px-4 py-3 text-primary">₹{report.totalSalaryPayable.toFixed(2)}</td>
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