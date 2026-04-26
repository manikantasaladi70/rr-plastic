import { Router } from "express";
import { db, materialsTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const search = req.query.search as string | undefined;
  const items = await db
    .select()
    .from(materialsTable)
    .where(search ? ilike(materialsTable.name, `%${search}%`) : undefined)
    .orderBy(materialsTable.name);
  res.json(items.map(m => ({
    ...m,
    currentStock: Number(m.currentStock),
    lowStockThreshold: Number(m.lowStockThreshold),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const { name, unit, currentStock, lowStockThreshold } = req.body;
  const [item] = await db.insert(materialsTable).values({
    name,
    unit,
    currentStock: String(currentStock ?? 0),
    lowStockThreshold: String(lowStockThreshold ?? 0),
  }).returning();
  res.status(201).json({ ...item, currentStock: Number(item.currentStock), lowStockThreshold: Number(item.lowStockThreshold) });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(materialsTable).where(eq(materialsTable.id, id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, currentStock: Number(item.currentStock), lowStockThreshold: Number(item.lowStockThreshold) });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, unit, currentStock, lowStockThreshold } = req.body;
  const [item] = await db
    .update(materialsTable)
    .set({ name, unit, currentStock: String(currentStock), lowStockThreshold: String(lowStockThreshold) })
    .where(eq(materialsTable.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, currentStock: Number(item.currentStock), lowStockThreshold: Number(item.lowStockThreshold) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(materialsTable).where(eq(materialsTable.id, id));
  res.status(204).send();
});

export default router;
