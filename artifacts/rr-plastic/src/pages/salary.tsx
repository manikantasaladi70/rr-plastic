import { useState } from "react";
import { useGetSalaryReport } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Salary() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: report, isLoading } = useGetSalaryReport({
    month: parseInt(month),
    year: parseInt(year)
  });

  const years = Array.from({ length: 5 }, (_, i) =>
    String(now.getFullYear() - i)
  );

  // ✅ Total salary (safe)
  const totalSalary =
    report?.reduce((sum, r) => sum + (r.finalSalary || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Salary Report</h1>
          <p className="text-muted-foreground text-sm">
            Monthly salary calculation based on attendance.
          </p>
        </div>

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <Label>Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Total Days</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Half Day</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-center">Leave</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead className="font-bold">Final Salary</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {report?.map((r) => (
              <TableRow key={r.employeeId}>
                <TableCell className="font-medium">
                  {r.employeeName}
                </TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell className="text-center">
                  {r.totalDays}
                </TableCell>
                <TableCell className="text-center text-green-700 font-medium">
                  {r.presentDays}
                </TableCell>
                <TableCell className="text-center text-yellow-700 font-medium">
                  {r.halfDays}
                </TableCell>
                <TableCell className="text-center text-red-700 font-medium">
                  {r.absentDays}
                </TableCell>
                <TableCell className="text-center text-blue-700 font-medium">
                  {r.leaveDays}
                </TableCell>
                <TableCell>₹{r.dailySalary}</TableCell>
                <TableCell className="font-bold text-primary">
                  ₹{r.finalSalary.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && report?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {/* Footer */}
          {(report?.length ?? 0) > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-bold border-t">
                <td colSpan={8} className="px-4 py-3 text-sm">
                  Total Salary Payable
                </td>
                <td className="px-4 py-3 text-primary font-bold">
                  ₹{totalSalary.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Salary formula: (Present × rate) + (Half × 0.5 × rate)
      </p>
    </div>
  );
}