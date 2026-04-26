import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListAttendance, useCreateAttendance, useListEmployees, getListAttendanceQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "P", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "A", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "H", label: "Half Day", color: "bg-yellow-100 text-yellow-800" },
  { value: "L", label: "Leave", color: "bg-blue-100 text-blue-800" },
  { value: "SD", label: "Sunday Double", color: "bg-purple-100 text-purple-800" },
];

function isSunday(dateStr: string) {
  return new Date(dateStr).getDay() === 0;
}

function getDatesFromStartOfMonth(upToDate: string) {
  const d = new Date(upToDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const dates: string[] = [];
  for (let day = 1; day <= d.getDate(); day++) {
    const dt = new Date(year, month, day);
    dates.push(dt.toISOString().split("T")[0]);
  }
  return dates;
}

export default function Attendance() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);

  const { data: employees } = useListEmployees({});
  const { data: attendance } = useListAttendance({ date });

  const getStatus = (empId: number) => {
    if (localStatuses[empId] !== undefined) return localStatuses[empId];
    const rec = attendance?.find(a => a.employeeId === empId);
    return rec?.status || "";
  };

  const createMutation = useCreateAttendance({});

  const saveAll = async () => {
    if (!employees?.length) return;
    setSaving(true);
    let success = 0;
    for (const emp of employees) {
      const status = getStatus(emp.id);
      if (!status) continue;
      try {
        await new Promise<void>((resolve, reject) => {
          createMutation.mutate(
            { data: { employeeId: emp.id, date, status: status as any } },
            { onSuccess: () => resolve(), onError: reject }
          );
        });
        success++;
      } catch { }
    }
    setSaving(false);
    toast.success(`Saved attendance for ${success} employees`);
    qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
  };

  // Fill entire month up to today
  const fillMonth = async () => {
    if (!employees?.length) return;
    setFilling(true);

    const dates = getDatesFromStartOfMonth(today);
    let saved = 0;

    // Fetch all existing attendance for this month
    const year = new Date(today).getFullYear();
    const month = new Date(today).getMonth() + 1;

    for (const emp of employees) {
      for (const d of dates) {
        const sunday = isSunday(d);

        // Check if already marked
        const existing = attendance?.find(a => a.employeeId === emp.id && a.date === d);
        if (existing) continue; // skip already marked days

        // Determine status:
        // Sunday → mark as Present (P) — normal present, not double
        // Other days → mark as Absent (A)
        const status = sunday ? "P" : "A";

        try {
          await new Promise<void>((resolve, reject) => {
            createMutation.mutate(
              { data: { employeeId: emp.id, date: d, status: status as any } },
              { onSuccess: () => resolve(), onError: reject }
            );
          });
          saved++;
        } catch { }
      }
    }

    setFilling(false);
    toast.success(`Auto-filled ${saved} attendance records`);
    qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
  };

  const sundaySelected = isSunday(date);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm">Mark daily attendance for all employees.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fillMonth} disabled={filling}>
            {filling ? "Filling..." : "Auto-Fill Month"}
          </Button>
          <Button onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {sundaySelected && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-purple-800 text-sm font-medium">
          ⚠️ Today is <strong>Sunday</strong>. If an employee worked today, mark as <strong>SD (Sunday Double)</strong> for double salary. If not worked, mark as <strong>P (Present)</strong> — normal salary.
        </div>
      )}

      <div className="flex items-center gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => { setDate(e.target.value); setLocalStatuses({}); }} className="w-44" />
        </div>
        <div className="flex gap-3 flex-wrap pt-5">
          {STATUS_OPTIONS.map(s => (
            <span key={s.value} className={`text-xs px-2 py-1 rounded font-medium ${s.color}`}>{s.value} = {s.label}</span>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Daily Salary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map(emp => {
              const status = getStatus(emp.id);
              const opt = STATUS_OPTIONS.find(s => s.value === status);
              return (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>₹{emp.dailySalary}</TableCell>
                  <TableCell>
                    <Select
                      value={status}
                      onValueChange={v => setLocalStatuses(p => ({ ...p, [emp.id]: v }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Not marked">
                          {status && <span className={`px-2 py-0.5 rounded text-xs font-bold ${opt?.color}`}>{status} - {opt?.label}</span>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>{s.value}</span> {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {!employees?.length && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No employees found. Add employees first.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Auto-Fill Month: fills all unmarked days from start of month to today. Sundays → Present, other days → Absent.
        To mark someone worked on Sunday → select SD (Sunday Double) for double salary.
      </p>
    </div>
  );
}