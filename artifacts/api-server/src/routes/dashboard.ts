import { Router } from "express";
import { db, materialsTable, stockInTable, stockOutTable, attendanceTable, employeesTable, customersTable, deliveryChallansTable } from "@workspace/db";
import { eq, sql, lt, gte, lte, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [totalMaterials] = await db.select({ count: sql<number>`count(*)::int` }).from(materialsTable);
  const [totalEmployees] = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable);
  const [totalCustomers] = await db.select({ count: sql<number>`count(*)::int` }).from(customersTable);

  const [stockInToday] = await db
    .select({ total: sql<number>`coalesce(sum(quantity::numeric), 0)` })
    .from(stockInTable)
    .where(eq(stockInTable.date, today));

  const [stockOutToday] = await db
    .select({ total: sql<number>`coalesce(sum(quantity::numeric), 0)` })
    .from(stockOutTable)
    .where(eq(stockOutTable.date, today));

  const [lowStockCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(materialsTable)
    .where(sql`current_stock::numeric <= low_stock_threshold::numeric`);

  const attendanceToday = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  const presentToday = attendanceToday.filter(a => a.status === "P" || a.status === "H").length;
  const absentToday = attendanceToday.filter(a => a.status === "A").length;

  const [challansToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deliveryChallansTable)
    .where(eq(deliveryChallansTable.date, today));

  res.json({
    totalMaterials: totalMaterials.count,
    totalStockInToday: Number(stockInToday.total) || 0,
    totalStockOutToday: Number(stockOutToday.total) || 0,
    lowStockCount: lowStockCount.count,
    presentToday,
    absentToday,
    totalEmployees: totalEmployees.count,
    totalCustomers: totalCustomers.count,
    totalChallansToday: challansToday.count,
  });
});

router.get("/low-stock", requireAuth, async (req, res) => {
  const items = await db
    .select()
    .from(materialsTable)
    .where(sql`current_stock::numeric <= low_stock_threshold::numeric`);
  res.json(items.map(m => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    currentStock: Number(m.currentStock),
    lowStockThreshold: Number(m.lowStockThreshold),
    createdAt: m.createdAt,
  })));
});

router.get("/recent-activity", requireAuth, async (req, res) => {
  const stockIn = await db
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
    .orderBy(sql`${stockInTable.createdAt} desc`)
    .limit(5);

  const stockOut = await db
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
    .orderBy(sql`${stockOutTable.createdAt} desc`)
    .limit(5);

  const challans = await db
    .select({
      id: deliveryChallansTable.id,
      challanNumber: deliveryChallansTable.challanNumber,
      customerId: deliveryChallansTable.customerId,
      customerName: customersTable.name,
      vehicleNumber: deliveryChallansTable.vehicleNumber,
      date: deliveryChallansTable.date,
      totalAmount: deliveryChallansTable.totalAmount,
      items: sql<any[]>`'[]'::json`,
      createdAt: deliveryChallansTable.createdAt,
    })
    .from(deliveryChallansTable)
    .leftJoin(customersTable, eq(deliveryChallansTable.customerId, customersTable.id))
    .orderBy(sql`${deliveryChallansTable.createdAt} desc`)
    .limit(5);

  res.json({
    stockIn: stockIn.map(s => ({ ...s, quantity: Number(s.quantity), materialName: s.materialName || "" })),
    stockOut: stockOut.map(s => ({ ...s, quantity: Number(s.quantity), materialName: s.materialName || "" })),
    challans: challans.map(c => ({ ...c, totalAmount: Number(c.totalAmount), customerName: c.customerName || "" })),
  });
});

export default router;
