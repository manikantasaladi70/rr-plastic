import { Router } from "express";
import { db, productionTable, customersTable, materialsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { customerId, startDate, endDate } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (customerId) conditions.push(eq(productionTable.customerId, parseInt(customerId)));
  if (startDate) conditions.push(gte(productionTable.date, startDate));
  if (endDate) conditions.push(lte(productionTable.date, endDate));

  const items = await db
    .select({
      id: productionTable.id,
      customerId: productionTable.customerId,
      customerName: customersTable.name,
      materialId: productionTable.materialId,
      materialName: materialsTable.name,
      quantityIssued: productionTable.quantityIssued,
      quantityReceived: productionTable.quantityReceived,
      date: productionTable.date,
      remarks: productionTable.remarks,
      createdAt: productionTable.createdAt,
    })
    .from(productionTable)
    .leftJoin(customersTable, eq(productionTable.customerId, customersTable.id))
    .leftJoin(materialsTable, eq(productionTable.materialId, materialsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${productionTable.date} desc`);

  res.json(items.map(i => ({
    ...i,
    quantityIssued: Number(i.quantityIssued),
    quantityReceived: Number(i.quantityReceived),
    customerName: i.customerName || "",
    materialName: i.materialName || "",
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const { customerId, materialId, quantityIssued, quantityReceived, date, remarks } = req.body;
  const [item] = await db.insert(productionTable).values({
    customerId: parseInt(customerId),
    materialId: parseInt(materialId),
    quantityIssued: String(quantityIssued || 0),
    quantityReceived: String(quantityReceived || 0),
    date,
    remarks,
  }).returning();

  const [cust] = await db.select().from(customersTable).where(eq(customersTable.id, parseInt(customerId)));
  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(materialId)));

  res.status(201).json({
    ...item,
    quantityIssued: Number(item.quantityIssued),
    quantityReceived: Number(item.quantityReceived),
    customerName: cust?.name || "",
    materialName: mat?.name || "",
  });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { customerId, materialId, quantityIssued, quantityReceived, date, remarks } = req.body;
  const [item] = await db
    .update(productionTable)
    .set({
      customerId: parseInt(customerId),
      materialId: parseInt(materialId),
      quantityIssued: String(quantityIssued || 0),
      quantityReceived: String(quantityReceived || 0),
      date,
      remarks,
    })
    .where(eq(productionTable.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }

  const [cust] = await db.select().from(customersTable).where(eq(customersTable.id, parseInt(customerId)));
  const [mat] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(materialId)));

  res.json({
    ...item,
    quantityIssued: Number(item.quantityIssued),
    quantityReceived: Number(item.quantityReceived),
    customerName: cust?.name || "",
    materialName: mat?.name || "",
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productionTable).where(eq(productionTable.id, id));
  res.status(204).send();
});

export default router;
