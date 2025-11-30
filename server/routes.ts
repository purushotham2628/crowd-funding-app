import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { initDb } from "./db";
import { insertProjectSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure DB schema exists before routes that may query it
  await initDb();

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProjectWithCreator(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Normalize incoming fields
      let { deadline, goalAmount, category } = req.body;

      // Coerce goalAmount to string
      if (typeof goalAmount === 'number') goalAmount = goalAmount.toString();
      if (goalAmount === undefined || goalAmount === null) goalAmount = '';

      // Coerce deadline to seconds-since-epoch integer or leave for schema preprocessing
      if (typeof deadline === 'string' && /^\d+$/.test(deadline)) {
        // numeric string
        deadline = parseInt(deadline, 10);
      } else if (typeof deadline === 'string') {
        const d = new Date(deadline);
        if (!Number.isNaN(d.getTime())) deadline = Math.floor(d.getTime() / 1000);
      } else if (deadline instanceof Date) {
        deadline = Math.floor(deadline.getTime() / 1000);
      }

      // Provide category default if missing
      if (!category) category = 'other';

      // Validate request body
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        deadline,
        goalAmount,
        category,
        creatorId: userId,
      });

      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Transaction routes
  app.get('/api/projects/:id/transactions', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

        const transactions = await storage.getTransactionsByProject(id);
        // Normalize createdAt to ISO strings so client date parsing is consistent
        const normalized = transactions.map((t: any) => {
          let dateTime = t.createdAt;
          if (typeof dateTime === 'number') {
            // SQLite stores seconds, JS needs milliseconds; check if it's already in ms
            dateTime = dateTime > 1e12 ? dateTime : dateTime * 1000;
            dateTime = new Date(dateTime).toISOString();
          } else if (typeof dateTime === 'string') {
            dateTime = new Date(dateTime).toISOString();
          } else {
            dateTime = null;
          }
          return { ...t, createdAt: dateTime };
        });
        res.json(normalized);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/projects/:id/fund', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const userId = req.user.claims.sub;
      const { amount, transactionType, transactionHash, donorWalletAddress } = req.body;

      // Validate transaction type
      if (!['real', 'demo'].includes(transactionType)) {
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Get project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if project is still active and deadline hasn't passed
      const now = new Date();
      const deadline = new Date(project.deadline);
      if (now > deadline) {
        return res.status(400).json({ message: "Project deadline has passed" });
      }

      if (!project.isActive) {
        return res.status(400).json({ message: "Project is not active" });
      }

      // Check if goal has been reached (block further transactions)
      const currentAmount = parseFloat(project.currentAmount);
      const goalAmount = parseFloat(project.goalAmount);
      if (currentAmount >= goalAmount) {
        return res.status(400).json({ message: "Funding goal has been reached. No more transactions accepted." });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        projectId,
        donorId: userId,
        donorWalletAddress: donorWalletAddress || null,
        amount: amount.toString(),
        transactionType,
        transactionHash: transactionHash || null,
      });

      // Update project current amount
      const newAmount = (currentAmount + amountNum).toString();
      await storage.updateProjectAmount(projectId, newAmount);

      // Normalize transaction response
      const normalized = {
        ...transaction,
        createdAt: (() => {
          if (!transaction.createdAt) return null;
          let dt: any = transaction.createdAt;
          if (typeof dt === 'number') {
            dt = dt > 1e12 ? dt : dt * 1000;
            return new Date(dt).toISOString();
          }
          return typeof dt === 'string' ? new Date(dt).toISOString() : null;
        })(),
      };

      res.status(201).json(normalized);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Withdraw funds
  app.post('/api/projects/:id/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const userId = req.user.claims.sub;

      // Get project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify creator
      if (project.creatorId !== userId) {
        return res.status(403).json({ message: "Only the project creator can withdraw funds" });
      }

      // Check if already withdrawn
      if (project.withdrawn) {
        return res.status(400).json({ message: "Funds already withdrawn" });
      }

      // Check if goal is met
      const currentAmount = parseFloat(project.currentAmount);
      const goalAmount = parseFloat(project.goalAmount);
      if (currentAmount < goalAmount) {
        return res.status(400).json({ message: "Funding goal not met" });
      }

      // Check if deadline hasn't passed
      const now = new Date();
      const deadline = new Date(project.deadline);
      if (now > deadline) {
        return res.status(400).json({ message: "Cannot withdraw after deadline" });
      }

      // Mark project as withdrawn
      await storage.markProjectWithdrawn(projectId);

      res.json({ message: "Funds withdrawn successfully" });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      res.status(500).json({ message: "Failed to withdraw funds" });
    }
  });

  // My projects
  app.get('/api/my-projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjectsByCreator(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching my projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Refund routes
  app.get('/api/refund-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const refunds = await storage.getRefundRequestsByCreator(userId);
      const normalized = refunds.map((r: any) => {
        let dateTime = r.createdAt;
        if (typeof dateTime === 'number') {
          dateTime = dateTime > 1e12 ? dateTime : dateTime * 1000;
          dateTime = new Date(dateTime).toISOString();
        } else if (typeof dateTime === 'string') {
          dateTime = new Date(dateTime).toISOString();
        } else {
          dateTime = null;
        }
        return { ...r, createdAt: dateTime };
      });
      res.json(normalized);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      res.status(500).json({ message: "Failed to fetch refund requests" });
    }
  });

  app.post('/api/refund-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId, transactionId, amount } = req.body;

      const pid = parseInt(projectId);
      if (isNaN(pid)) return res.status(400).json({ message: 'Invalid projectId' });

      const txId = transactionId ? parseInt(transactionId) : null;

      const project = await storage.getProject(pid);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const refund = await storage.createRefundRequest({
        projectId: pid,
        transactionId: txId,
        donorId: userId,
        creatorId: project.creatorId,
        amount: amount.toString(),
      });

      // Normalize createdAt
      const normalized = {
        ...refund,
        createdAt: (() => {
          if (!refund.createdAt) return null;
          let dt: any = refund.createdAt;
          if (typeof dt === 'number') {
            dt = dt > 1e12 ? dt : dt * 1000;
            return new Date(dt).toISOString();
          }
          return typeof dt === 'string' ? new Date(dt).toISOString() : null;
        })(),
      };

      res.status(201).json(normalized);
    } catch (error) {
      console.error("Error creating refund request:", error);
      res.status(500).json({ message: "Failed to create refund request" });
    }
  });

  app.post('/api/refund-requests/:id/process', isAuthenticated, async (req: any, res) => {
    try {
      const refundId = parseInt(req.params.id);
      if (isNaN(refundId)) {
        return res.status(400).json({ message: "Invalid refund request ID" });
      }

      const { approved } = req.body;

      // If approving, adjust project currentAmount accordingly (only once)
      if (approved) {
        // Read refund to get amount and projectId
        const [refund] = await (async () => {
          const list = await storage.getRefundRequestsByCreator(req.user.claims.sub);
          return list.filter((r: any) => r.id === refundId);
        })();

        if (refund && !refund.approved) {
          // Deduct amount from project
          const project = await storage.getProject(refund.projectId);
          if (project) {
            const currentAmount = parseFloat(project.currentAmount || '0');
            const deduct = parseFloat(refund.amount || '0');
            const newAmount = Math.max(0, currentAmount - deduct).toString();
            await storage.updateProjectAmount(refund.projectId, newAmount);
          }
        }
      }

      await storage.processRefundRequest(refundId, approved);

      res.json({ message: "Refund request processed successfully" });
    } catch (error) {
      console.error("Error processing refund request:", error);
      res.status(500).json({ message: "Failed to process refund request" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
