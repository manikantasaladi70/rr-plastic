import { useState } from "react";
import { useGetSalaryReport } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Salary() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: report, isLoading } = useGetSalaryReport({ month: parseInt(month), year: parseInt(year) });
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const totalSalary = report?.reduce((sum, r) => sum + (r.finalSalary || 0), 0) ?? 0;

  const computedSalary = (r: any) =>
    (r.presentDays ?? 0) * (r.dailySalary ?? 0) +
    (r.halfDays ?? 0) * 0.5 * (r.dailySalary ?? 0) +
    (r.sundayDays ?? 0) * 2 * (r.dailySalary ?? 0);

  const print = () => {
    const el = document.getElementById("salary-print");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Salary Report</title></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const s = {
    wrap: { fontFamily: "Arial, sans-serif", padding: "40px", fontSize: "13px", color: "#000" },
    title: { textAlign: "right" as const, fontSize: "24px", fontWeight: "bold", marginBottom: "20px" },
    topRow: { display: "flex", justifyContent: "space-between", borderTop: "2px solid #000", borderBottom: "1px solid #000", padding: "8px 0", marginBottom: "20px" },
    topLabel: { fontWeight: "bold", fontSize: "11px", display: "block", marginBottom: "4px" },
    table: { width: "100%", borderCollapse: "collapse" as const, marginTop: "10px" },
    th: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "left" as const },
    thR: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "right" as const },
    thC: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "center" as const },
    td: { padding: "8px", border: "1px solid #ccc", fontSize: "12px" },
    tdC: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "center" as const },
    tdR: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const },
    tdTotal: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const, fontWeight: "bold", background: "#f5f5f5" },
    tdTotalLabel: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const, fontWeight: "bold", background: "#f5f5f5" },
    sig: { display: "flex", justifyContent: "space-between", marginTop: "60px", fontSize: "13px" },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Salary Report</h1>
          <p className="text-muted-foreground text-sm">Monthly salary calculation based on attendance.</p>
        </div>
        <Button variant="outline" onClick={print}>
          <Printer className="mr-2 h-4 w-4" />Print
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
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

      {/* Screen Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Total Days</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Half Day</TableHead>
              <TableHead className="text-center">Sunday (SD)</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-center">Leave</TableHead>
              <TableHead className="text-right">Daily Rate</TableHead>
              <TableHead className="text-right font-bold">Final Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8">Loading...</TableCell></TableRow>}
            {report?.map((r) => {
              const calc = computedSalary(r);
              const displaySalary = r.finalSalary ?? calc;
              return (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.employeeName}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell className="text-center">{r.totalDays}</TableCell>
                  <TableCell className="text-center text-green-700 font-medium">{r.presentDays}</TableCell>
                  <TableCell className="text-center text-yellow-700 font-medium">{r.halfDays}</TableCell>
                  <TableCell className="text-center text-purple-700 font-medium">{(r as any).sundayDays ?? 0}</TableCell>
                  <TableCell className="text-center text-red-700 font-medium">{r.absentDays}</TableCell>
                  <TableCell className="text-center text-blue-700 font-medium">{r.leaveDays}</TableCell>
                  <TableCell className="text-right">₹{Number(r.dailySalary).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">₹{displaySalary.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
            {!isLoading && report?.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No data for this period.</TableCell></TableRow>}
          </TableBody>
          {(report?.length ?? 0) > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-bold border-t">
                <td colSpan={9} className="px-4 py-3 text-sm">Total Salary Payable</td>
                <td className="px-4 py-3 text-right text-primary font-bold">₹{totalSalary.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Formula: (Present × rate) + (Half Day × 0.5 × rate) + (Sunday SD × 2 × rate)
      </p>

      {/* Hidden Print View */}
      <div id="salary-print" style={{ display: "none" }}>
        <div style={s.wrap}>
          <div style={s.title}>Salary Report</div>
          <div style={s.topRow}>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>COMPANY</span>
              RR Plastics
            </div>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>MONTH / YEAR</span>
              {MONTHS[parseInt(month) - 1]} {year}
            </div>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>TOTAL PAYABLE</span>
              ₹{totalSalary.toFixed(2)}
            </div>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Employee</th>
                <th style={s.th}>Role</th>
                <th style={s.thC}>Present</th>
                <th style={s.thC}>Half</th>
                <th style={s.thC}>Sunday(SD)</th>
                <th style={s.thC}>Absent</th>
                <th style={s.thC}>Leave</th>
                <th style={s.thR}>Daily Rate</th>
                <th style={s.thR}>Final Salary</th>
              </tr>
            </thead>
            <tbody>
              {report?.map((r, i) => {
                const calc = computedSalary(r);
                const displaySalary = r.finalSalary ?? calc;
                return (
                  <tr key={r.employeeId}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}>{r.employeeName}</td>
                    <td style={s.td}>{r.role}</td>
                    <td style={s.tdC}>{r.presentDays}</td>
                    <td style={s.tdC}>{r.halfDays}</td>
                    <td style={s.tdC}>{(r as any).sundayDays ?? 0}</td>
                    <td style={s.tdC}>{r.absentDays}</td>
                    <td style={s.tdC}>{r.leaveDays}</td>
                    <td style={s.tdR}>₹{Number(r.dailySalary).toFixed(2)}</td>
                    <td style={s.tdR}>₹{displaySalary.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={9} style={s.tdTotalLabel}>TOTAL SALARY PAYABLE</td>
                <td style={s.tdTotal}>₹{totalSalary.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={s.sig}>
            <div>Prepared by: _______________</div>
            <div>Authorized Signatory: _______________</div>
          </div>
        </div>
      </div>
    </div>
  );
}