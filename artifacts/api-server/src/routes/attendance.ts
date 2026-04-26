import { Router } from "express";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { employeeId, month, year, date } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (employeeId) conditions.push(eq(attendanceTable.employeeId, parseInt(employeeId)));
  if (date) conditions.push(eq(attendanceTable.date, date));
  if (month && year) {
    conditions.push(sql`EXTRACT(MONTH FROM ${attendanceTable.date}::date) = ${parseInt(month)}`);
    conditions.push(sql`EXTRACT(YEAR FROM ${attendanceTable.date}::date) = ${parseInt(year)}`);
  }

  const items = await db
    .select({
      id: attendanceTable.id,
      employeeId: attendanceTable.employeeId,
      employeeName: employeesTable.name,
      date: attendanceTable.date,
      status: attendanceTable.status,
      createdAt: attendanceTable.createdAt,
    })
    .from(attendanceTable)
    .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(attendanceTable.date, employeesTable.name);

  res.json(items.map(i => ({ ...i, employeeName: i.employeeName || "" })));
});

router.post("/", requireAuth, async (req, res) => {
  const { employeeId, date, status } = req.body;
  const [item] = await db
    .insert(attendanceTable)
    .values({ employeeId: parseInt(employeeId), date, status })
    .onConflictDoUpdate({
      target: [attendanceTable.employeeId, attendanceTable.date],
      set: { status },
    })
    .returning();

  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, parseInt(employeeId)));
  res.json({ ...item, employeeName: emp?.name || "" });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(attendanceTable).where(eq(attendanceTable.id, id));
  res.status(204).send();
});

export default router;
