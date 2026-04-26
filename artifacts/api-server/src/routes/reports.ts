import { Router } from "express";
import { db, stockInTable, stockOutTable, materialsTable, employeesTable, attendanceTable, customersTable, productionTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/monthly", requireAuth, async (req, res) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  if (!month || !year) {
    res.status(400).json({ error: "month and year required" });
    return;
  }

  const monthCondition = (dateField: any) => and(
    sql`EXTRACT(MONTH FROM ${dateField}::date) = ${month}`,
    sql`EXTRACT(YEAR FROM ${dateField}::date) = ${year}`,
  );

  const [stockInTotal] = await db
    .select({ total: sql<number>`coalesce(sum(quantity::numeric), 0)` })
    .from(stockInTable)
    .where(monthCondition(stockInTable.date));

  const [stockOutTotal] = await db
    .select({ total: sql<number>`coalesce(sum(quantity::numeric), 0)` })
    .from(stockOutTable)
    .where(monthCondition(stockOutTable.date));

  const stockInByMaterial = await db
    .select({
      materialId: stockInTable.materialId,
      materialName: materialsTable.name,
      totalQty: sql<number>`coalesce(sum(${stockInTable.quantity}::numeric), 0)`,
    })
    .from(stockInTable)
    .leftJoin(materialsTable, eq(stockInTable.materialId, materialsTable.id))
    .where(monthCondition(stockInTable.date))
    .groupBy(stockInTable.materialId, materialsTable.name);

  const stockOutByMaterial = await db
    .select({
      materialId: stockOutTable.materialId,
      materialName: materialsTable.name,
      totalQty: sql<number>`coalesce(sum(${stockOutTable.quantity}::numeric), 0)`,
    })
    .from(stockOutTable)
    .leftJoin(materialsTable, eq(stockOutTable.materialId, materialsTable.id))
    .where(monthCondition(stockOutTable.date))
    .groupBy(stockOutTable.materialId, materialsTable.name);

  const employees = await db.select().from(employeesTable).where(eq(employeesTable.isActive, true));
  const daysInMonth = new Date(year, month, 0).getDate();
  const attendanceRecords = await db
    .select()
    .from(attendanceTable)
    .where(monthCondition(attendanceTable.date));

  let totalSalaryPayable = 0;
  const salaryReport = employees.map(emp => {
    const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id);
    const presentDays = empAttendance.filter(a => a.status === "P").length;
    const halfDays = empAttendance.filter(a => a.status === "H").length;
    const leaveDays = empAttendance.filter(a => a.status === "L").length;
    const absentDays = empAttendance.filter(a => a.status === "A").length;
    const salary = Number(emp.dailySalary);
    const finalSalary = (presentDays * salary) + (halfDays * 0.5 * salary);
    totalSalaryPayable += finalSalary;
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      dailySalary: salary,
      totalDays: daysInMonth,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      finalSalary: Math.round(finalSalary * 100) / 100,
    };
  });

  const customers = await db.select().from(customersTable);
  const customerSummary = await Promise.all(customers.map(async (cust) => {
    const [totals] = await db
      .select({
        totalIssued: sql<number>`coalesce(sum(quantity_issued::numeric), 0)`,
        totalReceived: sql<number>`coalesce(sum(quantity_received::numeric), 0)`,
      })
      .from(productionTable)
      .where(and(eq(productionTable.customerId, cust.id), monthCondition(productionTable.date)));
    const totalMaterialIssued = Number(totals.totalIssued) || 0;
    const totalProductionReceived = Number(totals.totalReceived) || 0;
    return {
      customerId: cust.id,
      customerName: cust.name,
      totalMaterialIssued,
      totalProductionReceived,
      balance: totalMaterialIssued - totalProductionReceived,
    };
  }));

  const totalStockIn = Number(stockInTotal.total) || 0;
  const totalStockOut = Number(stockOutTotal.total) || 0;

  res.json({
    month,
    year,
    totalStockIn,
    totalStockOut,
    materialBalance: totalStockIn - totalStockOut,
    totalSalaryPayable: Math.round(totalSalaryPayable * 100) / 100,
    stockInByMaterial: stockInByMaterial.map(i => ({ ...i, materialName: i.materialName || "", totalQty: Number(i.totalQty) })),
    stockOutByMaterial: stockOutByMaterial.map(i => ({ ...i, materialName: i.materialName || "", totalQty: Number(i.totalQty) })),
    customerSummary,
    salaryReport,
  });
});

export default router;
