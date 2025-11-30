import {
  users,
  projects,
  transactions,
  refundRequests,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Transaction,
  type InsertTransaction,
  type RefundRequest,
  type InsertRefundRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectWithCreator(id: number): Promise<any>;
  getProjectsByCreator(creatorId: string): Promise<any[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectAmount(id: number, amount: string): Promise<void>;
  markProjectWithdrawn(id: number): Promise<void>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByProject(projectId: number): Promise<Transaction[]>;
  
  // Refund operations
  createRefundRequest(refund: InsertRefundRequest): Promise<RefundRequest>;
  getRefundRequestsByCreator(creatorId: string): Promise<RefundRequest[]>;
  processRefundRequest(id: number, approved: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For SQLite, we need to handle upsert differently
    const existingById = await this.getUser(userData.id);

    if (existingById) {
      // Update existing user by id
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id));

      const [updated] = await db.select().from(users).where(eq(users.id, userData.id));
      return updated;
    }

    // If no user with this id exists, try to find by email to avoid unique constraint
    if (userData.email) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, userData.email));
      if (existingByEmail) {
        await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email));

        const [updated] = await db.select().from(users).where(eq(users.email, userData.email));
        return updated;
      }
    }

    // Otherwise insert new user
    const [created] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  // Helper to find user by email (used for local login)
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectWithCreator(id: number): Promise<any> {
    const [result] = await db
      .select({
        id: projects.id,
        creatorId: projects.creatorId,
        title: projects.title,
        description: projects.description,
        goalAmount: projects.goalAmount,
        currentAmount: projects.currentAmount,
        deadline: projects.deadline,
        imageUrl: projects.imageUrl,
        isActive: projects.isActive,
        withdrawn: projects.withdrawn,
        createdAt: projects.createdAt,
        creator: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .where(eq(projects.id, id));
    return result;
  }

  async getProjectsByCreator(creatorId: string): Promise<any[]> {
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.creatorId, creatorId))
      .orderBy(desc(projects.createdAt));

    // Get transactions and backer counts for each project
    const projectsWithStats = await Promise.all(
      projectsList.map(async (project) => {
        const projectTransactions = await this.getTransactionsByProject(project.id);
        const backersCount = new Set(
          projectTransactions
            .map((t) => t.donorId || t.donorWalletAddress)
            .filter(Boolean)
        ).size;

        return {
          ...project,
          transactions: projectTransactions,
          backersCount,
        };
      })
    );

    return projectsWithStats;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    // Drizzle expects timestamp columns to be provided as Date for SQLite.
    const dataToInsert = {
      ...projectData,
      deadline: typeof projectData.deadline === 'number'
        ? new Date(projectData.deadline * 1000)
        : projectData.deadline,
    } as any;

    const [project] = await db
      .insert(projects)
      .values(dataToInsert)
      .returning();
    return project;
  }

  async updateProjectAmount(id: number, amount: string): Promise<void> {
    await db
      .update(projects)
      .set({ currentAmount: amount })
      .where(eq(projects.id, id));
  }

  async markProjectWithdrawn(id: number): Promise<void> {
    await db
      .update(projects)
      .set({ withdrawn: true })
      .where(eq(projects.id, id));
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getTransactionsByProject(projectId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.projectId, projectId))
      .orderBy(desc(transactions.createdAt));
  }

  // Refund operations
  async createRefundRequest(refundData: InsertRefundRequest): Promise<RefundRequest> {
    const [refund] = await db
      .insert(refundRequests)
      .values(refundData)
      .returning();
    return refund;
  }

  async getRefundRequestsByCreator(creatorId: string): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.creatorId, creatorId))
      .orderBy(desc(refundRequests.createdAt));
  }

  async processRefundRequest(id: number, approved: boolean): Promise<void> {
    await db
      .update(refundRequests)
      .set({
        approved,
      })
      .where(eq(refundRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
