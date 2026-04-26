import { Router } from "express";
import { db, stockOutTable, materialsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { startDate, endDate, materialId } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (startDate) conditions.push(gte(stockOutTable.date, startDate));
  if (endDate) conditions.push(lte(stockOutTable.date, endDate));
  if (materialId) conditions.push(eq(stockOutTable.materialId, parseInt(materialId)));

  const items = await db
    .select({
      id: stockOutTable.id,
      materialId: stockOutTable.materialId,
      materialName: materialsTable.name,
      quantity: stockOutTable.quantity,
      date: stockOutTable.date,
      purpose: stockOutTable.purpose,
      remarks: stockOutTable.remarks,
      createdAt: stockOutTable.createdAt,
    })
    .from(stockOutTable)
    .leftJoin(materialsTable, eq(stockOutTable.materialId, materialsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${stockOutTable.date} desc`);

  res.json(items.map(i => ({ ...i, quantity: Number(i.quantity), materialName: i.materialName || "" })));
});

router.post("/", requireAuth, async (req, res) => {
  const { materialId, quantity, date, purpose, remarks } = req.body;
  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(materialId)));
  if (!mat) { res.status(404).json({ error: "Material not found" }); return; }
  if (Number(mat.currentStock) < Number(quantity)) {
    res.status(400).json({ error: `Insufficient stock. Available: ${Number(mat.currentStock)} ${mat.unit}` });
    return;
  }

  const [item] = await db.insert(stockOutTable).values({
    materialId: parseInt(materialId),
    quantity: String(quantity),
    date,
    purpose,
    remarks,
  }).returning();

  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric - ${quantity}::numeric WHERE id = ${materialId}`);
  res.status(201).json({ ...item, quantity: Number(item.quantity), materialName: mat.name });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(stockOutTable).where(eq(stockOutTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { materialId, quantity, date, purpose, remarks } = req.body;
  const diff = Number(existing.quantity) - Number(quantity);

  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(materialId)));
  if (!mat) { res.status(404).json({ error: "Material not found" }); return; }
  if (Number(mat.currentStock) + diff < 0) {
    res.status(400).json({ error: "Insufficient stock" });
    return;
  }

  const [item] = await db
    .update(stockOutTable)
    .set({ materialId: parseInt(materialId), quantity: String(quantity), date, purpose, remarks })
    .where(eq(stockOutTable.id, id))
    .returning();

  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric + ${diff}::numeric WHERE id = ${materialId}`);
  res.json({ ...item, quantity: Number(item.quantity), materialName: mat.name });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(stockOutTable).where(eq(stockOutTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(stockOutTable).where(eq(stockOutTable.id, id));
  await db.execute(sql`UPDATE materials SET current_stock = current_stock::numeric + ${Number(existing.quantity)}::numeric WHERE id = ${existing.materialId}`);
  res.status(204).send();
});

export default router;
