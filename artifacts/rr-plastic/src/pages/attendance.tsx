import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAttendance,
  useCreateAttendance,
  useListEmployees,
  getListAttendanceQueryKey,
} from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "P",  label: "Present",        color: "bg-green-100 text-green-800"  },
  { value: "A",  label: "Absent",         color: "bg-red-100 text-red-800"      },
  { value: "H",  label: "Half Day",       color: "bg-yellow-100 text-yellow-800"},
  { value: "L",  label: "Leave",          color: "bg-blue-100 text-blue-800"    },
  { value: "SD", label: "Sunday Double",  color: "bg-purple-100 text-purple-800"},
];

function isSunday(dateStr: string) {
  return new Date(dateStr).getDay() === 0;
}

// Returns every date from 1st of month up to today
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
  // localStatuses: changes made this session before saving
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);

  const { data: employees } = useListEmployees({});

  // FIX: fetch attendance for the selected date (used for display & save merge)
  const { data: attendance } = useListAttendance({ date });

  // FIX: also fetch ALL attendance for the month so fillMonth can check duplicates properly
  const firstOfMonth = date.slice(0, 7) + "-01";
  const { data: monthAttendance } = useListAttendance({
    startDate: firstOfMonth,
    endDate: today,
  } as any);

  const getStatus = (empId: number) => {
    // Local changes take priority over server data
    if (localStatuses[empId] !== undefined) return localStatuses[empId];
    const rec = attendance?.find((a) => a.employeeId === empId);
    return rec?.status || "";
  };

  const createMutation = useCreateAttendance({});

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });

  /* ── SAVE ── */
  const saveAll = async () => {
    if (!employees?.length) return;
    setSaving(true);
    let success = 0;

    for (const emp of employees) {
      // FIX: use local change OR already-saved server status — don't skip if server has a value
      const serverStatus = attendance?.find((a) => a.employeeId === emp.id)?.status;
      const status = localStatuses[emp.id] !== undefined
        ? localStatuses[emp.id]
        : serverStatus;

      // Only skip if truly nothing is set for this employee
      if (!status) continue;

      try {
        await new Promise<void>((resolve, reject) => {
          createMutation.mutate(
            { data: { employeeId: emp.id, date, status: status as any } },
            { onSuccess: () => resolve(), onError: reject }
          );
        });
        success++;
      } catch {
        // continue saving others even if one fails
      }
    }

    setSaving(false);
    toast.success(`Saved attendance for ${success} employee${success !== 1 ? "s" : ""}`);
    setLocalStatuses({});
    invalidate();
  };

  /* ── AUTO-FILL MONTH ── */
  const fillMonth = async () => {
    if (!employees?.length) return;
    setFilling(true);

    const dates = getDatesFromStartOfMonth(today);
    let saved = 0;

    for (const emp of employees) {
      for (const d of dates) {
        const sunday = isSunday(d);

        // FIX: check monthAttendance (full month) not attendance (single day)
        const existing = monthAttendance?.some(
          (a) => a.employeeId === emp.id && a.date === d
        );
        if (existing) continue;

        // FIX: Sunday → SD (double pay), weekday → P (present)
        // Previously was sunday?"P":"A" which was wrong — defaulting to Absent is too harsh
        const status = sunday ? "SD" : "P";

        try {
          await new Promise<void>((resolve, reject) => {
            createMutation.mutate(
              { data: { employeeId: emp.id, date: d, status: status as any } },
              { onSuccess: () => resolve(), onError: reject }
            );
          });
          saved++;
        } catch {
          // continue
        }
      }
    }

    setFilling(false);
    toast.success(`Auto-filled ${saved} attendance records`);
    invalidate();
  };

  const sundaySelected = isSunday(date);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm">
            Mark daily attendance for all employees.
          </p>
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

      {/* Sunday warning */}
      {sundaySelected && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-purple-800 text-sm font-medium">
          ⚠️ Today is <strong>Sunday</strong>. Mark <strong>SD</strong> if employee worked (double pay). Mark <strong>P</strong> if present without double pay.
        </div>
      )}

      {/* Date + Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setLocalStatuses({});
            }}
            className="w-44"
          />
        </div>
        <div className="flex gap-2 flex-wrap pt-5">
          {STATUS_OPTIONS.map((s) => (
            <span
              key={s.value}
              className={`text-xs px-2 py-1 rounded font-medium ${s.color}`}
            >
              {s.value} = {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
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
            {employees?.map((emp) => {
              const status = getStatus(emp.id);
              const opt = STATUS_OPTIONS.find((s) => s.value === status);
              return (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>₹{Number(emp.dailySalary).toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={status}
                      onValueChange={(v) =>
                        setLocalStatuses((p) => ({ ...p, [emp.id]: v }))
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Not marked">
                          {status && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${opt?.color}`}>
                              {status} – {opt?.label}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>
                              {s.value}
                            </span>{" "}
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}

            {!employees?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No employees found. Add employees first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Auto-Fill fills all unmarked days from the 1st of month to today. Sundays → SD (double pay), weekdays → Present.
        Override any day manually then click Save.
      </p>
    </div>
  );
}