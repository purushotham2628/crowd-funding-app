import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Validate request body
      const validatedData = insertProjectSchema.parse({
        ...req.body,
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
      res.json(transactions);
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
      const currentAmount = parseFloat(project.currentAmount);
      const newAmount = (currentAmount + amountNum).toString();
      await storage.updateProjectAmount(projectId, newAmount);

      res.status(201).json(transaction);
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
      res.json(refunds);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      res.status(500).json({ message: "Failed to fetch refund requests" });
    }
  });

  app.post('/api/refund-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId, transactionId, amount } = req.body;

      const refund = await storage.createRefundRequest({
        projectId: parseInt(projectId),
        transactionId: parseInt(transactionId),
        donorId: userId,
        amount: amount.toString(),
      });

      res.status(201).json(refund);
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
