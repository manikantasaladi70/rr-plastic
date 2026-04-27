import { Router } from "express";
import { db, employeesTable, attendanceTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/report", requireAuth, async (req, res) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  if (!month || !year) {
    res.status(400).json({ error: "month and year required" });
    return;
  }

  const employees = await db.select().from(employeesTable).where(eq(employeesTable.isActive, true));
  const daysInMonth = new Date(year, month, 0).getDate();

  const attendanceRecords = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${attendanceTable.date}::date) = ${month}`,
        sql`EXTRACT(YEAR FROM ${attendanceTable.date}::date) = ${year}`,
      )
    );

  const report = employees.map(emp => {
    const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id);

    const presentDays   = empAttendance.filter(a => a.status === "P").length;
    const halfDays      = empAttendance.filter(a => a.status === "H").length;
    const leaveDays     = empAttendance.filter(a => a.status === "L").length;
    const absentDays    = empAttendance.filter(a => a.status === "A").length;
    const sundayDays    = empAttendance.filter(a => a.status === "SD").length;

    const salary = Number(emp.dailySalary);

    // Formula:
    // Present (P)       = 1x daily salary
    // Half Day (H)      = 0.5x daily salary
    // Sunday Double(SD) = 2x daily salary
    // Absent (A)        = 0
    // Leave (L)         = 0
   const finalSalary =
  (presentDays * salary) +
  (halfDays    * 0.5 * salary) +
  (sundayDays  * 2   * salary) +
  (leaveDays   * 1   * salary);
  
    return {
      employeeId:   emp.id,
      employeeName: emp.name,
      role:         emp.role,
      dailySalary:  salary,
      totalDays:    daysInMonth,
      presentDays,
      halfDays,
      sundayDays,
      absentDays,
      leaveDays,
      finalSalary: Math.round(finalSalary * 100) / 100,
    };
  });

  res.json(report);
});

export default router;