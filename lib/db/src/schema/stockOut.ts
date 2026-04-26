import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";

export const stockOutTable = pgTable("stock_out", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  date: date("date").notNull(),
  purpose: text("purpose"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockOutSchema = createInsertSchema(stockOutTable).omit({ id: true, createdAt: true });
export type InsertStockOut = z.infer<typeof insertStockOutSchema>;
export type StockOut = typeof stockOutTable.$inferSelect;
