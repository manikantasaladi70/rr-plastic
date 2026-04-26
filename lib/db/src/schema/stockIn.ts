import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";

export const stockInTable = pgTable("stock_in", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  date: date("date").notNull(),
  supplier: text("supplier"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockInSchema = createInsertSchema(stockInTable).omit({ id: true, createdAt: true });
export type InsertStockIn = z.infer<typeof insertStockInSchema>;
export type StockIn = typeof stockInTable.$inferSelect;
