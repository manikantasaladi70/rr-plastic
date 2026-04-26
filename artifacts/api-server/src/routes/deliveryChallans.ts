import { Router } from "express";
import { db, deliveryChallansTable, deliveryChallanItemsTable, customersTable, materialsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getChallanWithItems(id: number) {
  const [challan] = await db
    .select({
      id: deliveryChallansTable.id,
      challanNumber: deliveryChallansTable.challanNumber,
      customerId: deliveryChallansTable.customerId,
      customerName: customersTable.name,
      vehicleNumber: deliveryChallansTable.vehicleNumber,
      date: deliveryChallansTable.date,
      totalAmount: deliveryChallansTable.totalAmount,
      createdAt: deliveryChallansTable.createdAt,
    })
    .from(deliveryChallansTable)
    .leftJoin(customersTable, eq(deliveryChallansTable.customerId, customersTable.id))
    .where(eq(deliveryChallansTable.id, id));

  if (!challan) return null;

  const items = await db
    .select({
      id: deliveryChallanItemsTable.id,
      materialId: deliveryChallanItemsTable.materialId,
      materialName: materialsTable.name,
      description: deliveryChallanItemsTable.description,
      quantity: deliveryChallanItemsTable.quantity,
      rate: deliveryChallanItemsTable.rate,
      amount: deliveryChallanItemsTable.amount,
    })
    .from(deliveryChallanItemsTable)
    .leftJoin(materialsTable, eq(deliveryChallanItemsTable.materialId, materialsTable.id))
    .where(eq(deliveryChallanItemsTable.challanId, id));

  return {
    ...challan,
    customerName: challan.customerName || "",
    totalAmount: Number(challan.totalAmount),
    items: items.map(i => ({
      ...i,
      materialName: i.materialName || "",
      quantity: Number(i.quantity),
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { customerId, startDate, endDate } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (customerId) conditions.push(eq(deliveryChallansTable.customerId, parseInt(customerId)));
  if (startDate) conditions.push(gte(deliveryChallansTable.date, startDate));
  if (endDate) conditions.push(lte(deliveryChallansTable.date, endDate));

  const challans = await db
    .select({
      id: deliveryChallansTable.id,
      challanNumber: deliveryChallansTable.challanNumber,
      customerId: deliveryChallansTable.customerId,
      customerName: customersTable.name,
      vehicleNumber: deliveryChallansTable.vehicleNumber,
      date: deliveryChallansTable.date,
      totalAmount: deliveryChallansTable.totalAmount,
      createdAt: deliveryChallansTable.createdAt,
    })
    .from(deliveryChallansTable)
    .leftJoin(customersTable, eq(deliveryChallansTable.customerId, customersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${deliveryChallansTable.date} desc`);

  res.json(challans.map(c => ({ ...c, customerName: c.customerName || "", totalAmount: Number(c.totalAmount), items: [] })));
});

router.post("/", requireAuth, async (req, res) => {
  const { customerId, vehicleNumber, date, items } = req.body;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveryChallansTable);
  const challanNumber = `DC-${String(countResult.count + 1).padStart(4, "0")}`;

  const totalAmount = (items as any[]).reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.rate)), 0);

  const [challan] = await db.insert(deliveryChallansTable).values({
    challanNumber,
    customerId: parseInt(customerId),
    vehicleNumber,
    date,
    totalAmount: String(totalAmount),
  }).returning();

  for (const item of items as any[]) {
    const amount = Number(item.quantity) * Number(item.rate);
    await db.insert(deliveryChallanItemsTable).values({
      challanId: challan.id,
      materialId: parseInt(item.materialId),
      description: item.description,
      quantity: String(item.quantity),
      rate: String(item.rate),
      amount: String(amount),
    });
  }

  const result = await getChallanWithItems(challan.id);
  res.status(201).json(result);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await getChallanWithItems(id);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { customerId, vehicleNumber, date, items } = req.body;

  const totalAmount = (items as any[]).reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.rate)), 0);

  await db
    .update(deliveryChallansTable)
    .set({ customerId: parseInt(customerId), vehicleNumber, date, totalAmount: String(totalAmount) })
    .where(eq(deliveryChallansTable.id, id));

  await db.delete(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, id));

  for (const item of items as any[]) {
    const amount = Number(item.quantity) * Number(item.rate);
    await db.insert(deliveryChallanItemsTable).values({
      challanId: id,
      materialId: parseInt(item.materialId),
      description: item.description,
      quantity: String(item.quantity),
      rate: String(item.rate),
      amount: String(amount),
    });
  }

  const result = await getChallanWithItems(id);
  res.json(result);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, id));
  await db.delete(deliveryChallansTable).where(eq(deliveryChallansTable.id, id));
  res.status(204).send();
});

export default router;
