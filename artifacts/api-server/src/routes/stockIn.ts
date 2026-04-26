import { Router } from "express";
import { db, stockInTable, materialsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { startDate, endDate, materialId } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (startDate) conditions.push(gte(stockInTable.date, startDate));
  if (endDate) conditions.push(lte(stockInTable.date, endDate));
  if (materialId) conditions.push(eq(stockInTable.materialId, parseInt(materialId)));

  const items = await db
    .select({
      id: stockInTable.id,
      materialId: stockInTable.materialId,
      materialName: materialsTable.name,
      quantity: stockInTable.quantity,
      date: stockInTable.date,
      supplier: stockInTable.supplier,
      remarks: stockInTable.remarks,
      createdAt: stockInTable.createdAt,
    })
    .from(stockInTable)
    .leftJoin(materialsTable, eq(stockInTable.materialId, materialsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${stockInTable.date} desc`);

  res.json(items.map(i => ({ ...i, quantity: Number(i.quantity), materialName: i.materialName || "" })));
});

router.post("/", requireAuth, async (req, res) => {
  const { materialId, quantity, date, supplier, remarks } = req.body;
  const [item] = await db.insert(stockInTable).values({
    materialId: parseInt(materialId),
    quantity: String(quantity),
    date,
    supplier,
    remarks,
  }).returning();

  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric + ${quantity}::numeric WHERE id = ${materialId}`);

  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, materialId));
  res.status(201).json({ ...item, quantity: Number(item.quantity), materialName: mat?.name || "" });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(stockInTable).where(eq(stockInTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { materialId, quantity, date, supplier, remarks } = req.body;
  const diff = Number(quantity) - Number(existing.quantity);

  const [item] = await db
    .update(stockInTable)
    .set({ materialId: parseInt(materialId), quantity: String(quantity), date, supplier, remarks })
    .where(eq(stockInTable.id, id))
    .returning();

  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric + ${diff}::numeric WHERE id = ${materialId}`);

  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, materialId));
  res.json({ ...item, quantity: Number(item.quantity), materialName: mat?.name || "" });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(stockInTable).where(eq(stockInTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(stockInTable).where(eq(stockInTable.id, id));
  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric - ${Number(existing.quantity)}::numeric WHERE id = ${existing.materialId}`);
  res.status(204).send();
});

export default router;
