import { Router } from "express";
import { db, customersTable, productionTable, materialsTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const search = req.query.search as string | undefined;
  const items = await db
    .select()
    .from(customersTable)
    .where(search ? ilike(customersTable.name, `%${search}%`) : undefined)
    .orderBy(customersTable.name);
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const { name, phone, gst, address } = req.body;
  const [item] = await db.insert(customersTable).values({ name, phone, gst, address }).returning();
  res.status(201).json(item);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, gst, address } = req.body;
  const [item] = await db
    .update(customersTable)
    .set({ name, phone, gst, address })
    .where(eq(customersTable.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.status(204).send();
});

router.get("/:id/summary", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) { res.status(404).json({ error: "Not found" }); return; }

  const [totals] = await db
    .select({
      totalIssued: sql<number>`coalesce(sum(quantity_issued::numeric), 0)`,
      totalReceived: sql<number>`coalesce(sum(quantity_received::numeric), 0)`,
    })
    .from(productionTable)
    .where(eq(productionTable.customerId, id));

  const totalMaterialIssued = Number(totals.totalIssued) || 0;
  const totalProductionReceived = Number(totals.totalReceived) || 0;

  res.json({
    customerId: id,
    customerName: customer.name,
    totalMaterialIssued,
    totalProductionReceived,
    balance: totalMaterialIssued - totalProductionReceived,
  });
});

export default router;
