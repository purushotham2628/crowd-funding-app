import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  text,
  sqliteTable,
  real,
  integer,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // Store JSON as text in SQLite
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  // Store password hash for local auth (optional)
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Projects table
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default('other'), // tech, art, social, environment, other
  goalAmount: text("goal_amount").notNull(), // Store decimal as text
  currentAmount: text("current_amount").notNull().default('0'),
  deadline: integer("deadline", { mode: 'timestamp' }).notNull(),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  withdrawn: integer("withdrawn", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
  // Accept deadline as a string (ISO or numeric), number (unix seconds or ms), or Date.
  // Coerce to an integer number of seconds since epoch during parsing.
  deadline: z.preprocess((val) => {
    if (typeof val === 'string') {
      // numeric string?
      if (/^\d+$/.test(val)) return parseInt(val, 10);
      // try ISO date string
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
      return val;
    }
    if (typeof val === 'number') {
      // treat large numbers as ms, small as seconds
      return val > 1e12 ? Math.floor(val / 1000) : Math.floor(val);
    }
    if (val instanceof Date) {
      return Math.floor(val.getTime() / 1000);
    }
    return val;
  }, z.number().int().positive()),
  // category optional with default to 'other'
  category: z.enum(['tech', 'art', 'social', 'environment', 'other']).optional().default('other'),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  donorId: text("donor_id").references(() => users.id),
  donorWalletAddress: text("donor_wallet_address"),
  amount: text("amount").notNull(), // Store decimal as text
  transactionType: text("transaction_type").notNull().default('demo'), // 'real' or 'demo'
  transactionHash: text("transaction_hash"), // For real blockchain transactions
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Refund Requests table
export const refundRequests = sqliteTable("refund_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  donorId: text("donor_id").notNull().references(() => users.id),
  // Optionally reference the original transaction and include requested amount
  transactionId: integer("transaction_id").references(() => transactions.id),
  amount: text("amount").notNull(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  approved: integer("approved", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  project: one(projects, {
    fields: [refundRequests.projectId],
    references: [projects.id],
  }),
  donor: one(users, {
    fields: [refundRequests.donorId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [refundRequests.creatorId],
    references: [users.id],
  }),
}));

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  approved: true,
  createdAt: true,
});

export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
