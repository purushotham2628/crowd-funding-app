import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalAmount: decimal("goal_amount", { precision: 18, scale: 8 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 18, scale: 8 }).notNull().default('0'),
  deadline: timestamp("deadline").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  withdrawn: boolean("withdrawn").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  transactions: many(transactions),
  refundRequests: many(refundRequests),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  currentAmount: true,
  isActive: true,
  withdrawn: true,
  createdAt: true,
}).extend({
  goalAmount: z.string().min(1, "Goal amount is required"),
  deadline: z.string().min(1, "Deadline is required"),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Transactions table (supports both real blockchain and demo transactions)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").notNull().references(() => projects.id),
  donorId: varchar("donor_id").references(() => users.id),
  donorWalletAddress: text("donor_wallet_address"),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  transactionType: varchar("transaction_type", { length: 10 }).notNull(), // 'real' or 'demo'
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  donor: one(users, {
    fields: [transactions.donorId],
    references: [users.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().min(1, "Amount is required"),
  transactionType: z.enum(['real', 'demo']),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Refund requests table
export const refundRequests = pgTable("refund_requests", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").notNull().references(() => projects.id),
  transactionId: serial("transaction_id").notNull().references(() => transactions.id),
  donorId: varchar("donor_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  project: one(projects, {
    fields: [refundRequests.projectId],
    references: [projects.id],
  }),
  transaction: one(transactions, {
    fields: [refundRequests.transactionId],
    references: [transactions.id],
  }),
  donor: one(users, {
    fields: [refundRequests.donorId],
    references: [users.id],
  }),
}));

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  processedAt: true,
});

export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
