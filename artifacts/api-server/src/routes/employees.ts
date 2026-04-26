import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

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

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.status(204).send();
});

export default router;
