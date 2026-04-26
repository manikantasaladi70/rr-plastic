import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { materialsTable } from "./materials";

export const deliveryChallansTable = pgTable("delivery_challans", {
  id: serial("id").primaryKey(),
  challanNumber: text("challan_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  vehicleNumber: text("vehicle_number").notNull(),
  date: date("date").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryChallanItemsTable = pgTable("delivery_challan_items", {
  id: serial("id").primaryKey(),
  challanId: integer("challan_id").notNull().references(() => deliveryChallansTable.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  description: text("description"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

export const insertDeliveryChallanSchema = createInsertSchema(deliveryChallansTable).omit({ id: true, createdAt: true });
export const insertDeliveryChallanItemSchema = createInsertSchema(deliveryChallanItemsTable).omit({ id: true });
export type InsertDeliveryChallan = z.infer<typeof insertDeliveryChallanSchema>;
export type DeliveryChallan = typeof deliveryChallansTable.$inferSelect;
export type DeliveryChallanItem = typeof deliveryChallanItemsTable.$inferSelect;
