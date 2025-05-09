import express, { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import passport from "passport";
import { storage } from "./storage";
import { Server } from "http";
import * as schema from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { generateVietQRURL } from "./payment-utils";
import { setupAuth } from "./auth";

const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  res.status(403).json({ error: "Forbidden" });
};

const imageFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Setup multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
      },
    }),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Authentication Routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        email,
        password, // Will be hashed in the storage layer
        role: "user",
        firstName: firstName,
        lastName: lastName,
        balance: 0,
        isActive: true,
        createdAt: new Date(),
      });

      // Log in the new user
      req.login(newUser, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to login after registration" });
        }
        return res.status(201).json(newUser);
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/user/is-admin", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isAdmin = req.user.role === "admin";
    res.json({ isAdmin });
  });

  // User Routes
  app.get("/api/users", ensureAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await storage.getAllUsers(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.get("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Update user profile for the logged-in user
  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Content Routes
  app.get("/api/content", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter: any = {};

      // Apply optional filters if provided
      if (req.query.type) {
        filter.type = req.query.type;
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const result = await storage.getAllContent(page, limit, filter);
      res.json(result);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to get content" });
    }
  });

  // Search content (basic search)
  app.get("/api/content/search", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const query = req.query.query as string;

      if (!query) {
        return res.json({ content: [], total: 0 });
      }

      const result = await storage.searchContent(query, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  // Advanced search content
  app.get("/api/content/search/advanced", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const searchParams: any = {};

      if (req.query.title) {
        searchParams.title = req.query.title as string;
      }

      if (req.query.type) {
        searchParams.type = req.query.type as "manga" | "novel";
      }

      if (req.query.status) {
        searchParams.status = req.query.status as
          | "ongoing"
          | "completed"
          | "hiatus";
      }

      if (req.query.genres) {
        const genreIds = (req.query.genres as string)
          .split(",")
          .map((id) => parseInt(id.trim()));
        searchParams.genreIds = genreIds;
      }

      if (req.query.sort) {
        searchParams.sort = req.query.sort as string;
      }

      const result = await storage.searchContentAdvanced(
        searchParams,
        page,
        limit,
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getContentWithDetails(id);

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Increment view count
      await storage.incrementContentViews(id);

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to get content" });
    }
  });

  app.post("/api/content", ensureAdmin, async (req, res) => {
    try {
      const contentData = req.body;
      const genreIds = contentData.genreIds || [];
      delete contentData.genreIds;

      const newContent = await storage.createContent(contentData, genreIds);
      res.status(201).json(newContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  // Hỗ trợ cả PATCH và PUT cho cập nhật nội dung
  const updateContentHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contentData = req.body;
      const genreIds = contentData.genreIds;
      delete contentData.genreIds;

      const updatedContent = await storage.updateContent(
        id,
        contentData,
        genreIds,
      );
      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  };

  app.patch("/api/content/:id", ensureAdmin, updateContentHandler);
  app.put("/api/content/:id", ensureAdmin, updateContentHandler);

  app.delete("/api/content/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Chapter Routes
  app.get("/api/content/:contentId/chapters", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const chapters = await storage.getChaptersByContent(contentId);
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chapters" });
    }
  });

  app.get("/api/chapters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getChapter(id);

      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      // Increment view count
      await storage.incrementChapterViews(id);

      const chapterContent = await storage.getChapterContentByChapter(id);

      // Check if chapter is locked and if the user has unlocked it
      let isUnlocked = !chapter.isLocked;

      if (chapter.isLocked && req.isAuthenticated()) {
        const userId = (req.user as any).id;
        isUnlocked = await storage.isChapterUnlocked(userId, id);
      }

      res.json({
        chapter,
        content: isUnlocked ? chapterContent : [],
        isUnlocked,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get chapter" });
    }
  });

  app.post(
    "/api/content/:contentId/chapters",
    ensureAdmin,
    async (req, res) => {
      try {
        const contentId = parseInt(req.params.contentId);
        const chapterData = {
          ...req.body,
          contentId,
        };

        const newChapter = await storage.createChapter(chapterData);
        res.status(201).json(newChapter);
      } catch (error) {
        res.status(500).json({ error: "Failed to create chapter" });
      }
    },
  );

  app.patch("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedChapter = await storage.updateChapter(id, req.body);

      if (!updatedChapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      res.json(updatedChapter);
    } catch (error) {
      res.status(500).json({ error: "Failed to update chapter" });
    }
  });

  app.delete("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChapter(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chapter" });
    }
  });

  // Chapter Content Routes
  app.post(
    "/api/chapters/:chapterId/content",
    ensureAdmin,
    async (req, res) => {
      try {
        const chapterId = parseInt(req.params.chapterId);
        const contentData = {
          ...req.body,
          chapterId,
        };

        const newContent = await storage.createChapterContent(contentData);
        res.status(201).json(newContent);
      } catch (error) {
        res.status(500).json({ error: "Failed to create chapter content" });
      }
    },
  );

  app.patch("/api/chapter-content/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedContent = await storage.updateChapterContent(id, req.body);

      if (!updatedContent) {
        return res.status(404).json({ error: "Chapter content not found" });
      }

      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update chapter content" });
    }
  });

  app.delete("/api/chapter-content/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChapterContent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chapter content" });
    }
  });

  // Unlock chapter route
  app.post(
    "/api/chapters/:id/unlock",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const chapterId = parseInt(req.params.id);
        const userId = (req.user as any).id;

        const chapter = await storage.getChapter(chapterId);
        if (!chapter) {
          return res.status(404).json({ error: "Chapter not found" });
        }

        if (!chapter.isLocked) {
          return res.status(400).json({ error: "Chapter is already unlocked" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!chapter.unlockPrice) {
          return res
            .status(400)
            .json({ error: "Chapter does not have an unlock price" });
        }

        if (user.balance < chapter.unlockPrice) {
          return res.status(400).json({ error: "Insufficient balance" });
        }

        // Check if already unlocked
        const alreadyUnlocked = await storage.isChapterUnlocked(
          userId,
          chapterId,
        );
        if (alreadyUnlocked) {
          return res
            .status(400)
            .json({ error: "Chapter already unlocked by this user" });
        }

        // Unlock the chapter and deduct balance
        await storage.unlockChapter(userId, chapterId);
        await storage.updateUserBalance(
          userId,
          user.balance - chapter.unlockPrice,
        );

        res.json({ success: true, message: "Chapter unlocked successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to unlock chapter" });
      }
    },
  );

  // Reading History Routes
  app.post("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { contentId, chapterId } = req.body;

      await storage.addReadingHistory(userId, contentId, chapterId);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add reading history" });
    }
  });

  app.get("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const history = await storage.getReadingHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reading history" });
    }
  });

  // Favorites Routes
  app.post("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { contentId } = req.body;

      const result = await storage.toggleFavorite(userId, contentId);
      res.json({ success: true, added: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  app.get("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  // Comment Routes
  app.post("/api/comments", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { contentId, chapterId, text } = req.body;

      const newComment = await storage.createComment({
        userId,
        contentId,
        chapterId,
        text,
        createdAt: new Date(),
      });

      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/content/:contentId/comments", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const comments = await storage.getCommentsByContent(contentId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.get("/api/chapters/:chapterId/comments", async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const comments = await storage.getCommentsByChapter(chapterId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.delete("/api/comments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getComment(id);

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === "admin";

      // Check if the user is the owner of the comment or an admin
      if (comment.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteComment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Report Routes
  app.post("/api/reports", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const report = {
        ...req.body,
        userId,
        createdAt: new Date(),
      };

      const newReport = await storage.createReport(report);
      res.status(201).json(newReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/reports", ensureAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await storage.getAllReports(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.delete("/api/reports/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Payment Routes
  app.post("/api/payments", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount, method } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Create a new payment
      const transactionId = createHash("sha256")
        .update(`${userId}-${Date.now()}`)
        .digest("hex")
        .substring(0, 12);

      const newPayment = await storage.createPayment({
        userId,
        amount,
        method: "bank_transfer", // Only support bank transfers
        transactionId,
        status: "pending",
        createdAt: new Date(),
      });

      // Get the payment settings for VietQR
      const settings = await storage.getPaymentSettings();

      if (!settings || !settings.vietQRConfig) {
        return res
          .status(500)
          .json({ error: "Payment settings not configured" });
      }

      // Generate VietQR URL
      const vietQRConfig = settings.vietQRConfig as any;
      const qrCodeURL = generateVietQRURL({
        bankId: vietQRConfig.bankId,
        accountNumber: vietQRConfig.accountNumber,
        accountName: vietQRConfig.accountName,
        template: vietQRConfig.template,
        amount,
        message: `NAPTIEN admin ${amount}`,
      });

      res.status(201).json({
        payment: newPayment,
        qrCodeURL,
        expiresAt: new Date(newPayment.createdAt.getTime() + 10 * 60 * 1000), // 10 minutes expiry
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.get("/api/payments", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === "admin";

      if (isAdmin && req.query.all === "true") {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await storage.getAllPayments(page, limit);
        return res.json(result);
      } else {
        const payments = await storage.getPaymentsByUser(userId);
        return res.json(payments);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get payments" });
    }
  });

  app.post(
    "/api/payments/:id/confirm",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const paymentId = parseInt(req.params.id);
        const userId = (req.user as any).id;

        // Get the payment
        const payment = await storage.getPayment(paymentId);

        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        // Check if the payment belongs to the user
        if (payment.userId !== userId) {
          return res.status(403).json({ error: "Forbidden" });
        }

        // Check if payment is already completed or failed
        if (payment.status !== "pending") {
          return res
            .status(400)
            .json({ error: `Payment is already ${payment.status}` });
        }

        // Check if payment is expired (10 minutes)
        const expiryTime = new Date(
          payment.createdAt.getTime() + 10 * 60 * 1000,
        );
        if (new Date() > expiryTime) {
          await storage.updatePaymentStatus(paymentId, "failed");
          return res.status(400).json({ error: "Payment expired" });
        }

        // Mark as completed (will be verified by admin)
        const updatedPayment = await storage.updatePaymentStatus(
          paymentId,
          "pending",
        );

        res.json({
          success: true,
          payment: updatedPayment,
          message:
            "Payment confirmation sent. Please wait for admin verification.",
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to confirm payment" });
      }
    },
  );

  app.patch("/api/payments/:id/status", ensureAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status } = req.body;
      type PaymentStatusType = "pending" | "completed" | "failed";
      if (!["pending", "completed", "failed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Get the payment
      const payment = await storage.getPayment(paymentId);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      let newStatus: PaymentStatusType = status as PaymentStatusType;
      const updatedPayment = await storage.updatePaymentStatus(
        paymentId,
        newStatus,
      );

      // If payment is completed, add the amount to the user's balance
      if (newStatus === "completed") {
        const user = await storage.getUser(payment.userId);
        if (user) {
          await storage.updateUserBalance(
            user.id,
            user.balance + payment.amount,
          );
        }
      }

      res.json({
        success: true,
        payment: updatedPayment,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  // Payment Settings Routes
  app.get("/api/payment-settings", ensureAdmin, async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payment settings" });
    }
  });

  app.patch("/api/payment-settings", ensureAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updatePaymentSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment settings" });
    }
  });

  app.get("/api/payment-settings/vietqr-config", async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }

      const vietQRConfig = settings.vietQRConfig as any;
      
      if (!vietQRConfig) {
        return res.status(404).json({ error: "VietQR config not found" });
      }

      // Return only necessary public info
      res.json({
        bankId: vietQRConfig.bankId,
        accountName: vietQRConfig.accountName,
        template: vietQRConfig.template,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get VietQR config" });
    }
  });

  app.get("/api/payment-settings/pricing", async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }

      const priceConfig = settings.priceConfig as any;
      
      res.json({
        priceConfig: priceConfig,
        discountTiers: priceConfig?.discountTiers || [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get pricing settings" });
    }
  });

  // Genre Routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ error: "Failed to get genres" });
    }
  });

  app.post("/api/genres", ensureAdmin, async (req, res) => {
    try {
      const newGenre = await storage.createGenre(req.body);
      res.status(201).json(newGenre);
    } catch (error) {
      res.status(500).json({ error: "Failed to create genre" });
    }
  });

  // Hỗ trợ cả PATCH và PUT cho cập nhật thể loại
  const updateGenreHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedGenre = await storage.updateGenre(id, req.body);

      if (!updatedGenre) {
        return res.status(404).json({ error: "Genre not found" });
      }

      res.json(updatedGenre);
    } catch (error) {
      res.status(500).json({ error: "Failed to update genre" });
    }
  };

  app.patch("/api/genres/:id", ensureAdmin, updateGenreHandler);
  app.put("/api/genres/:id", ensureAdmin, updateGenreHandler);

  app.delete("/api/genres/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGenre(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete genre" });
    }
  });

  // Author Routes
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await storage.getAllAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get authors" });
    }
  });

  app.post("/api/authors", ensureAdmin, async (req, res) => {
    try {
      const newAuthor = await storage.createAuthor(req.body);
      res.status(201).json(newAuthor);
    } catch (error) {
      res.status(500).json({ error: "Failed to create author" });
    }
  });

  // Hỗ trợ cả PATCH và PUT cho cập nhật tác giả
  const updateAuthorHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedAuthor = await storage.updateAuthor(id, req.body);

      if (!updatedAuthor) {
        return res.status(404).json({ error: "Author not found" });
      }

      res.json(updatedAuthor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update author" });
    }
  };

  app.patch("/api/authors/:id", ensureAdmin, updateAuthorHandler);
  app.put("/api/authors/:id", ensureAdmin, updateAuthorHandler);

  app.delete("/api/authors/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAuthor(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete author" });
    }
  });

  // Translation Group Routes
  app.get("/api/translation-groups", async (req, res) => {
    try {
      const groups = await storage.getAllTranslationGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get translation groups" });
    }
  });

  app.post("/api/translation-groups", ensureAdmin, async (req, res) => {
    try {
      const newGroup = await storage.createTranslationGroup(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: "Failed to create translation group" });
    }
  });

  // Hỗ trợ cả PATCH và PUT cho cập nhật nhóm dịch
  const updateTranslationGroupHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedGroup = await storage.updateTranslationGroup(id, req.body);

      if (!updatedGroup) {
        return res.status(404).json({ error: "Translation group not found" });
      }

      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ error: "Failed to update translation group" });
    }
  };

  app.patch(
    "/api/translation-groups/:id",
    ensureAdmin,
    updateTranslationGroupHandler,
  );
  app.put(
    "/api/translation-groups/:id",
    ensureAdmin,
    updateTranslationGroupHandler,
  );

  app.delete("/api/translation-groups/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTranslationGroup(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete translation group" });
    }
  });

  // Ad Routes
  app.get("/api/ads", async (req, res) => {
    try {
      const position = req.query.position as "banner" | "sidebar" | "popup";

      if (position) {
        const ads = await storage.getActiveAdvertisements(position);
        return res.json(ads);
      }

      // Default to admin view for testing
      if (req.query.all === "true") {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await storage.getAllAdvertisements(page, limit);
        return res.json(result);
      }

      // Return empty array for any other request to avoid error
      return res.json([]);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ error: "Failed to get ads" });
    }
  });

  app.post(
    "/api/ads",
    ensureAdmin,
    upload.single("image"),
    async (req, res) => {
      try {
        const { title, targetUrl, position, startDate, endDate } = req.body;

        if (!req.file) {
          return res.status(400).json({ error: "Image file is required" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        const newAd = await storage.createAdvertisement({
          title,
          imageUrl,
          targetUrl,
          position: position as "banner" | "sidebar" | "popup",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: true,
        });

        res.status(201).json(newAd);
      } catch (error) {
        res.status(500).json({ error: "Failed to create ad" });
      }
    },
  );

  app.patch(
    "/api/ads/:id",
    ensureAdmin,
    upload.single("image"),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const adData: any = { ...req.body };

        // Handle image update if provided
        if (req.file) {
          adData.imageUrl = `/uploads/${req.file.filename}`;
        }

        // Parse dates if provided
        if (adData.startDate) {
          adData.startDate = new Date(adData.startDate);
        }

        if (adData.endDate) {
          adData.endDate = new Date(adData.endDate);
        }

        // Parse boolean
        if (adData.isActive !== undefined) {
          adData.isActive = adData.isActive === "true";
        }

        const updatedAd = await storage.updateAdvertisement(id, adData);

        if (!updatedAd) {
          return res.status(404).json({ error: "Ad not found" });
        }

        res.json(updatedAd);
      } catch (error) {
        res.status(500).json({ error: "Failed to update ad" });
      }
    },
  );

  app.delete("/api/ads/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ad = await storage.getAdvertisement(id);

      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }

      // Delete the image file if it exists
      if (ad.imageUrl && ad.imageUrl.startsWith("/uploads/")) {
        const imagePath = path.join(process.cwd(), "public", ad.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await storage.deleteAdvertisement(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  app.post("/api/ads/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementAdViews(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to record ad view" });
    }
  });

  app.post("/api/ads/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementAdClicks(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to record ad click" });
    }
  });

  // Create HTTP server without starting it
  return new Server(app);
}
