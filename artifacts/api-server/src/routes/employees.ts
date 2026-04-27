import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

// FIX: import all tables that reference employeeId so we can delete them first
import {
  attendanceTable,
  // add any other tables that reference employeeId, e.g:
  // salaryRecordsTable,
} from "@workspace/db";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const search = req.query.search as string | undefined;
  const items = await db
    .select()
    .from(employeesTable)
    .where(search ? ilike(employeesTable.name, `%${search}%`) : undefined)
    .orderBy(employeesTable.name);
  res.json(items.map(e => ({ ...e, dailySalary: Number(e.dailySalary) })));
});

router.post("/", requireAuth, async (req, res) => {
  const { name, role, phone, dailySalary, isActive } = req.body;
  const [item] = await db.insert(employeesTable).values({
    name, role, phone, dailySalary: String(dailySalary), isActive: isActive ?? true,
  }).returning();
  res.status(201).json({ ...item, dailySalary: Number(item.dailySalary) });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, dailySalary: Number(item.dailySalary) });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, role, phone, dailySalary, isActive } = req.body;
  const [item] = await db
    .update(employeesTable)
    .set({ name, role, phone, dailySalary: String(dailySalary), isActive })
    .where(eq(employeesTable.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, dailySalary: Number(item.dailySalary) });
});

// FIX: delete all related records first, then delete the employee
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Step 1: delete attendance records for this employee
    await db.delete(attendanceTable).where(eq(attendanceTable.employeeId, id));

    // Step 2: if you have salary records table, delete those too:
    // await db.delete(salaryRecordsTable).where(eq(salaryRecordsTable.employeeId, id));

    // Step 3: now safely delete the employee
    const result = await db
      .delete(employeesTable)
      .where(eq(employeesTable.id, id))
      .returning();

    if (!result.length) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;