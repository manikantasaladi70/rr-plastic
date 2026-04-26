import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { materialsTable } from "./materials";

export const productionTable = pgTable("production", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  quantityIssued: numeric("quantity_issued", { precision: 12, scale: 3 }).notNull().default("0"),
  quantityReceived: numeric("quantity_received", { precision: 12, scale: 3 }).notNull().default("0"),
  date: date("date").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductionSchema = createInsertSchema(productionTable).omit({ id: true, createdAt: true });
export type InsertProduction = z.infer<typeof insertProductionSchema>;
export type Production = typeof productionTable.$inferSelect;
