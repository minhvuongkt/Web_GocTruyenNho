import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  insertGenreSchema,
  insertAuthorSchema, 
  insertTranslationGroupSchema,
  insertContentSchema,
  insertChapterSchema,
  insertChapterContentSchema,
  insertCommentSchema,
  insertReportSchema,
  insertPaymentSchema,
  insertPaymentSettingsSchema,
  insertAdvertisementSchema
} from "@shared/schema";

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to ensure user is admin
const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

// Configure multer storage for cover image uploads
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/covers');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'cover-' + uniqueSuffix + ext);
  }
});

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp hình ảnh!'), false);
  }
};

// Create the upload middleware
const uploadCover = multer({ 
  storage: coverStorage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);

  // Serve static files from public folder
  app.use(express.static('public'));

  // API routes
  
  // Genre routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Error fetching genres", error });
    }
  });

  app.post("/api/genres", ensureAdmin, async (req, res) => {
    try {
      const validData = insertGenreSchema.parse(req.body);
      const genre = await storage.createGenre(validData);
      res.status(201).json(genre);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/genres/:id", async (req, res) => {
    try {
      const genre = await storage.getGenre(parseInt(req.params.id));
      if (!genre) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      res.status(500).json({ message: "Error fetching genre", error });
    }
  });

  app.put("/api/genres/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertGenreSchema.partial().parse(req.body);
      const genre = await storage.updateGenre(parseInt(req.params.id), validData);
      if (!genre) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/genres/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteGenre(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.status(200).json({ success: true, message: "Genre deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting genre", error });
    }
  });

  // Author routes
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await storage.getAllAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching authors", error });
    }
  });

  app.post("/api/authors", ensureAdmin, async (req, res) => {
    try {
      const validData = insertAuthorSchema.parse(req.body);
      const author = await storage.createAuthor(validData);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/authors/:id", async (req, res) => {
    try {
      const author = await storage.getAuthor(parseInt(req.params.id));
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }
      res.json(author);
    } catch (error) {
      res.status(500).json({ message: "Error fetching author", error });
    }
  });

  app.put("/api/authors/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertAuthorSchema.partial().parse(req.body);
      const author = await storage.updateAuthor(parseInt(req.params.id), validData);
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }
      res.json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/authors/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteAuthor(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Author not found" });
      }
      res.status(200).json({ success: true, message: "Author deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting author", error });
    }
  });

  // Translation Group routes
  app.get("/api/translation-groups", async (req, res) => {
    try {
      const groups = await storage.getAllTranslationGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching translation groups", error });
    }
  });

  app.post("/api/translation-groups", ensureAdmin, async (req, res) => {
    try {
      const validData = insertTranslationGroupSchema.parse(req.body);
      const group = await storage.createTranslationGroup(validData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/translation-groups/:id", async (req, res) => {
    try {
      const group = await storage.getTranslationGroup(parseInt(req.params.id));
      if (!group) {
        return res.status(404).json({ message: "Translation group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Error fetching translation group", error });
    }
  });

  app.put("/api/translation-groups/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertTranslationGroupSchema.partial().parse(req.body);
      const group = await storage.updateTranslationGroup(parseInt(req.params.id), validData);
      if (!group) {
        return res.status(404).json({ message: "Translation group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/translation-groups/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTranslationGroup(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Translation group not found" });
      }
      res.status(200).json({ success: true, message: "Translation group deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting translation group", error });
    }
  });

  // Content routes
  app.get("/api/content", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Handle filters
      const filter: any = {};
      if (req.query.type) filter.type = req.query.type;
      if (req.query.authorId) filter.authorId = parseInt(req.query.authorId as string);
      if (req.query.status) filter.status = req.query.status;
      
      const result = await storage.getAllContent(page, limit, filter);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content", error });
    }
  });

  // Upload cover image
  app.post("/api/upload/cover", ensureAdmin, uploadCover.single('coverImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên" });
      }
      
      // Return the path to the uploaded file
      const filePath = `/uploads/covers/${req.file.filename}`;
      res.status(200).json({ coverImagePath: filePath });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi tải file", error });
    }
  });

  app.post("/api/content", ensureAdmin, async (req, res) => {
    try {
      const { genreIds, ...contentData } = req.body;
      const validData = insertContentSchema.parse(contentData);
      
      if (!Array.isArray(genreIds) || genreIds.length === 0) {
        return res.status(400).json({ message: "At least one genre is required" });
      }
      
      const content = await storage.createContent(validData, genreIds);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      // Increment view count
      await storage.incrementContentViews(parseInt(req.params.id));
      
      const contentDetails = await storage.getContentWithDetails(parseInt(req.params.id));
      if (!contentDetails) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Get chapters for this content
      const chapters = await storage.getChaptersByContent(parseInt(req.params.id));
      
      // Include chapters in the response
      const response = {
        ...contentDetails,
        chapters
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content", error });
    }
  });

  app.put("/api/content/:id", ensureAdmin, async (req, res) => {
    try {
      const { genreIds, ...contentData } = req.body;
      const validData = insertContentSchema.partial().parse(contentData);
      
      const content = await storage.updateContent(parseInt(req.params.id), validData, genreIds);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/content/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteContent(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.status(200).json({ success: true, message: "Content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting content", error });
    }
  });

  // Chapters routes
  app.get("/api/content/:contentId/chapters", async (req, res) => {
    try {
      const chapters = await storage.getChaptersByContent(parseInt(req.params.contentId));
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Error fetching chapters", error });
    }
  });

  app.post("/api/chapters", ensureAdmin, async (req, res) => {
    try {
      const validData = insertChapterSchema.parse(req.body);
      const chapter = await storage.createChapter(validData);
      res.status(201).json(chapter);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/chapters/:id", async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      
      // Get chapter details
      const chapter = await storage.getChapter(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      // Check if chapter is locked
      let isUnlocked = !chapter.isLocked; // Free chapters are already unlocked
      
      if (chapter.isLocked && req.isAuthenticated() && req.user) {
        // Check if user has unlocked this chapter
        isUnlocked = await storage.isChapterUnlocked(req.user.id, chapterId);
      }
      
      // If it's locked and the user hasn't unlocked it, return just the chapter info without content
      if (!isUnlocked) {
        return res.json({
          chapter,
          isUnlocked: false,
          content: null
        });
      }
      
      // Increment view count if chapter is being read
      await storage.incrementChapterViews(chapterId);
    
      
      // Chapter is unlocked or free, so get the content
      const chapterContent = await storage.getChapterContentByChapter(chapterId);
      
      // Get comments
      const comments = await storage.getCommentsByChapter(chapterId);
      
      // If authenticated, update reading history
      if (req.isAuthenticated() && req.user) {
        await storage.addReadingHistory(req.user.id, chapter.contentId, chapterId);
      }
      
      res.json({
        chapter,
        isUnlocked: true,
        content: chapterContent,
        comments
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching chapter", error });
    }
  });

  app.put("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertChapterSchema.partial().parse(req.body);
      const chapter = await storage.updateChapter(parseInt(req.params.id), validData);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/chapters/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteChapter(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.status(200).json({ success: true, message: "Chapter deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting chapter", error });
    }
  });

  // Chapter content routes
  app.post("/api/chapter-content", ensureAdmin, async (req, res) => {
    try {
      const validData = insertChapterContentSchema.parse(req.body);
      const content = await storage.createChapterContent(validData);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.put("/api/chapter-content/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertChapterContentSchema.partial().parse(req.body);
      const content = await storage.updateChapterContent(parseInt(req.params.id), validData);
      if (!content) {
        return res.status(404).json({ message: "Chapter content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/chapter-content/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteChapterContent(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Chapter content not found" });
      }
      res.status(200).json({ success: true, message: "Chapter content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting chapter content", error });
    }
  });

  // Chapter unlock route
  app.post("/api/chapters/:id/unlock", ensureAuthenticated, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if chapter is already unlocked
      const isUnlocked = await storage.isChapterUnlocked(userId, chapterId);
      if (isUnlocked) {
        return res.status(400).json({ message: "Chapter is already unlocked" });
      }
      
      // Get chapter details
      const chapter = await storage.getChapter(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      // Check if chapter is locked and has price
      if (!chapter.isLocked || !chapter.unlockPrice) {
        return res.status(400).json({ message: "Chapter is either not locked or does not have an unlock price" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < chapter.unlockPrice) {
        return res.status(400).json({ 
          message: "Insufficient balance", 
          balance: user.balance, 
          required: chapter.unlockPrice 
        });
      }
      
      // Deduct balance
      const updatedUser = await storage.updateUserBalance(userId, -chapter.unlockPrice);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }
      
      // Unlock the chapter
      const success = await storage.unlockChapter(userId, chapterId);
      if (!success) {
        // Refund if unlock fails
        await storage.updateUserBalance(userId, chapter.unlockPrice);
        return res.status(500).json({ message: "Failed to unlock chapter" });
      }
      
      res.json({
        message: "Chapter unlocked successfully",
        newBalance: updatedUser.balance
      });
    } catch (error) {
      res.status(500).json({ message: "Error unlocking chapter", error });
    }
  });

  // Chapter lock/unlock API (admin only)
  app.patch("/api/chapters/:id/lock", ensureAdmin, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const { isLocked, unlockPrice } = req.body;
      
      // Validate data
      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ message: "isLocked must be a boolean" });
      }
      
      // If locking, require a price
      if (isLocked && (typeof unlockPrice !== 'number' || unlockPrice <= 0)) {
        return res.status(400).json({ message: "unlockPrice must be a positive number when locking a chapter" });
      }
      
      // Get the current chapter
      const chapter = await storage.getChapter(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      // Update the chapter
      const updateData: any = { isLocked };
      if (isLocked) {
        updateData.unlockPrice = unlockPrice;
      } else {
        updateData.unlockPrice = null;
      }
      
      const updatedChapter = await storage.updateChapter(chapterId, updateData);
      if (!updatedChapter) {
        return res.status(500).json({ message: "Failed to update chapter" });
      }
      
      res.json({
        success: true,
        chapter: updatedChapter,
        message: isLocked ? "Chapter locked successfully" : "Chapter unlocked successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating chapter lock status", error });
    }
  });

  // User activity routes
  app.post("/api/favorites/:contentId", ensureAuthenticated, async (req, res) => {
    try {
      const result = await storage.toggleFavorite(req.user!.id, parseInt(req.params.contentId));
      res.json({ isFavorite: result });
    } catch (error) {
      res.status(500).json({ message: "Error toggling favorite", error });
    }
  });

  app.get("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const favorites = await storage.getFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Error fetching favorites", error });
    }
  });

  app.get("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const history = await storage.getReadingHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reading history", error });
    }
  });

  // Comments routes
  app.post("/api/comments", ensureAuthenticated, async (req, res) => {
    try {
      const validData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const comment = await storage.createComment(validData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/content/:contentId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByContent(parseInt(req.params.contentId));
      
      // Expand user info for each comment
      const commentsWithUser = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: user ? { 
            id: user.id, 
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
          } : undefined
        };
      }));
      
      res.json(commentsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments", error });
    }
  });

  app.delete("/api/comments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const comment = await storage.getComment(parseInt(req.params.id));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only admin or comment author can delete
      if (req.user!.role !== 'admin' && comment.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      const success = await storage.deleteComment(parseInt(req.params.id));
      if (!success) {
        return res.status(500).json({ message: "Failed to delete comment" });
      }
      
      res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting comment", error });
    }
  });

  // Reports routes
  app.post("/api/reports", ensureAuthenticated, async (req, res) => {
    try {
      const validData = insertReportSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const report = await storage.createReport(validData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/reports", ensureAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const result = await storage.getAllReports(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reports", error });
    }
  });

  app.delete("/api/reports/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteReport(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.status(200).json({ success: true, message: "Report deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting report", error });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const allowedFields = ['firstName', 'lastName', 'gender', 'darkMode', 'displayMode'];
      
      // Filter out any non-allowed fields
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", ensureAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const result = await storage.getAllUsers(page, limit);
      
      // Remove passwords from response
      const usersWithoutPassword = result.users.map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        users: usersWithoutPassword,
        total: result.total
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  });

  // Update user (admin only)
  app.put("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Get allowed fields from request body
      const allowedFields = ['firstName', 'lastName', 'email', 'role', 'isActive', 'balance'];
      
      // Filter out any non-allowed fields
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  // Disable/enable user (admin only)
  app.put("/api/users/:id/status", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deactivating yourself
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "Cannot change your own status" });
      }
      
      // Parse isActive from request body
      const isActive = Boolean(req.body.isActive);
      
      // Update user status
      const updatedUser = await storage.updateUser(userId, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  app.delete("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  });

  // Payment routes
  app.post("/api/payments", ensureAuthenticated, async (req, res) => {
    try {
      // Validate the amount
      const amount = parseInt(req.body.amount);
      if (isNaN(amount) || amount < 10000 || amount % 1000 !== 0) {
        return res.status(400).json({ 
          message: "Invalid amount. Must be at least 10,000 VND and divisible by 1,000" 
        });
      }
      
      // Generate transaction ID
      const transactionId = `TRX-${nanoid(10)}`;
      
      const validData = insertPaymentSchema.parse({
        userId: req.user!.id,
        transactionId,
        amount,
        method: req.body.method || 'bank_transfer',
        status: 'pending'
      });
      
      const payment = await storage.createPayment(validData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/payments", ensureAuthenticated, async (req, res) => {
    try {
      // Admin can view all payments, users can only view their own
      if (req.user!.role === 'admin' && req.query.all === 'true') {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        
        const result = await storage.getAllPayments(page, limit);
        res.json(result);
      } else {
        const payments = await storage.getPaymentsByUser(req.user!.id);
        res.json(payments);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments", error });
    }
  });

  // User route to confirm a payment (sends notification to admin)
  app.put("/api/payments/:transactionId/confirm", ensureAuthenticated, async (req, res) => {
    try {
      const transactionId = req.params.transactionId;
      
      // Get payment by transaction ID
      const payment = await storage.getPaymentByTransactionId(transactionId);
      if (!payment) {
        return res.status(404).json({ message: "Giao dịch không tồn tại" });
      }
      
      // Check if payment belongs to the user
      if (payment.userId !== req.user!.id) {
        return res.status(403).json({ message: "Không có quyền xác nhận giao dịch này" });
      }
      
      // Check if payment is already completed or failed
      if (payment.status === 'completed') {
        return res.status(400).json({ message: "Giao dịch đã được xác nhận trước đó" });
      }
      
      if (payment.status === 'failed') {
        return res.status(400).json({ message: "Giao dịch đã bị hủy hoặc thất bại" });
      }
      
      // Check if payment has expired (10 minutes)
      const paymentTime = new Date(payment.createdAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - paymentTime.getTime()) / (1000 * 60);
      
      if (diffMinutes > 10) {
        // Update payment status to failed due to timeout
        await storage.updatePaymentStatus(payment.id, 'failed');
        return res.status(400).json({ message: "Giao dịch đã hết hạn (quá 10 phút)" });
      }
      
      // Update payment status to pending (for admin verification)
      await storage.updatePaymentStatus(payment.id, 'pending');
      
      // Get user data
      const user = await storage.getUser(payment.userId);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
      }

      // Send notification to admin (in a real app, this would send an email)
      const adminEmail = "hlmvuong123@gmail.com";
      
      // Log notification information for testing purposes
      console.log(`[PAYMENT CONFIRMATION]
        Transaction ID: ${transactionId}
        User: ${user.username} (ID: ${user.id})
        Amount: ${payment.amount} VND
        Method: ${payment.method}
        Time: ${new Date().toISOString()}
        Status: Waiting for admin confirmation
        Admin Email: ${adminEmail}
      `);
      
      // In a real app with SendGrid integration:
      // await sendEmail({
      //   to: adminEmail,
      //   from: "no-reply@goctruyennho.com",
      //   subject: `[Xác nhận thanh toán] Giao dịch #${transactionId}`,
      //   html: `
      //     <h2>Thông báo xác nhận thanh toán</h2>
      //     <p>Một người dùng đã xác nhận đã thanh toán và đang chờ duyệt.</p>
      //     <p><strong>Mã giao dịch:</strong> ${transactionId}</p>
      //     <p><strong>Người dùng:</strong> ${user.username} (ID: ${user.id})</p>
      //     <p><strong>Số tiền:</strong> ${payment.amount.toLocaleString('vi-VN')} VND</p>
      //     <p><strong>Phương thức:</strong> ${payment.method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : payment.method}</p>
      //     <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      //     <p>Vui lòng đăng nhập vào trang quản trị để xác nhận giao dịch này.</p>
      //   `
      // });
      
      res.json({ 
        success: true, 
        message: "Xác nhận thanh toán đã được gửi đến quản trị viên", 
        payment 
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Lỗi khi xác nhận thanh toán", error });
    }
  });

  // Admin route to update payment status
  app.put("/api/payments/:id/status", ensureAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      // Get valid payment status types
      type PaymentStatusType = 'pending' | 'completed' | 'failed';
      const validStatuses: PaymentStatusType[] = ['pending', 'completed', 'failed'];
      
      // Get status from request
      let newStatus: PaymentStatusType;
      
      if (typeof req.body === 'string') {
        // Direct string input
        if (validStatuses.includes(req.body as PaymentStatusType)) {
          newStatus = req.body as PaymentStatusType;
        } else {
          return res.status(400).json({ message: "Invalid status value" });
        }
      } else if (req.body && typeof req.body.status === 'string') {
        // Object with status property
        if (validStatuses.includes(req.body.status as PaymentStatusType)) {
          newStatus = req.body.status as PaymentStatusType;
        } else {
          return res.status(400).json({ message: "Invalid status value" });
        }
      } else {
        return res.status(400).json({ message: "Invalid status format" });
      }
      
      // Get payment info
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Update the payment status
      const updatedPayment = await storage.updatePaymentStatus(paymentId, newStatus);
      if (!updatedPayment) {
        return res.status(500).json({ message: "Failed to update payment status" });
      }
      
      // If payment is completed, add amount to user's balance
      if (newStatus === 'completed' && payment.status !== 'completed') {
        const updatedUser = await storage.updateUserBalance(payment.userId, payment.amount);
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update user balance" });
        }
        
        res.json({
          payment: updatedPayment,
          userBalance: updatedUser.balance
        });
      } else {
        res.json({ payment: updatedPayment });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  // Advertisement routes
  app.post("/api/ads", ensureAdmin, async (req, res) => {
    try {
      const validData = insertAdvertisementSchema.parse(req.body);
      const ad = await storage.createAdvertisement(validData);
      res.status(201).json(ad);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.get("/api/ads", async (req, res) => {
    try {
      if (req.query.position && !req.isAuthenticated()) {
        // Get active ads for a specific position - public endpoint
        const positionSchema = z.enum(['banner', 'sidebar', 'popup']);
        const position = positionSchema.parse(req.query.position);
        const ads = await storage.getActiveAdvertisements(position as 'banner' | 'sidebar' | 'popup');
        
        // Record ad views
        ads.forEach(async (ad) => {
          await storage.incrementAdViews(ad.id);
        });
        
        res.json(ads);
      } else {
        // Admin view of all ads - requires authentication
        if (!req.isAuthenticated() || req.user?.role !== 'admin') {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        
        // Get additional query parameters for filtering
        const position = req.query.position ? req.query.position as string : undefined;
        const status = req.query.status ? req.query.status as string : undefined;
        
        const result = await storage.getAllAdvertisements(page, limit);
        
        // Apply additional filtering in memory (since we don't have specific DB methods)
        let filteredAds = result.ads;
        
        if (position && position !== 'all') {
          filteredAds = filteredAds.filter(ad => ad.position === position);
        }
        
        if (status) {
          if (status === 'active') {
            const now = new Date();
            filteredAds = filteredAds.filter(ad => 
              ad.isActive && 
              new Date(ad.startDate) <= now && 
              new Date(ad.endDate) >= now
            );
          } else if (status === 'inactive') {
            const now = new Date();
            filteredAds = filteredAds.filter(ad => 
              !ad.isActive || 
              new Date(ad.startDate) > now || 
              new Date(ad.endDate) < now
            );
          }
        }
        
        res.json({
          ads: filteredAds,
          total: result.total
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching advertisements", error });
    }
  });

  app.put("/api/ads/:id", ensureAdmin, async (req, res) => {
    try {
      const validData = insertAdvertisementSchema.partial().parse(req.body);
      const ad = await storage.updateAdvertisement(parseInt(req.params.id), validData);
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });

  app.delete("/api/ads/:id", ensureAdmin, async (req, res) => {
    try {
      const success = await storage.deleteAdvertisement(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      res.status(200).json({ success: true, message: "Advertisement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting advertisement", error });
    }
  });

  // Record ad clicks
  app.post("/api/ads/:id/click", async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      
      // Get ad details
      const ad = await storage.getAdvertisement(adId);
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Increment click count
      await storage.incrementAdClicks(adId);
      
      // Return target URL for redirection
      res.json({ targetUrl: ad.targetUrl });
    } catch (error) {
      res.status(500).json({ message: "Error processing advertisement click", error });
    }
  });
  
  // Payment settings routes
  app.get("/api/payment-settings", ensureAdmin, async (req, res) => {
    try {
      // Get payment settings from database or create default
      let settings = await storage.getPaymentSettings();
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment settings", error });
    }
  });
  
  app.put("/api/payment-settings", ensureAdmin, async (req, res) => {
    try {
      // Validate data
      const validData = insertPaymentSettingsSchema.partial().parse(req.body);
      
      // Update settings in database
      const updatedSettings = await storage.updatePaymentSettings(validData);
      
      if (!updatedSettings) {
        return res.status(404).json({ message: "Payment settings not found" });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Error updating payment settings", error });
    }
  });
  
  // Public route to get just the pricing configuration
  // Endpoint to provide VietQR configuration
  app.get("/api/payment-settings/vietqr-config", async (req, res) => {
    try {
      // Get from database settings
      let settings = await storage.getPaymentSettings();
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }
      
      // Verify if API credentials are available
      if (!process.env.VIETQR_CLIENT_ID || !process.env.VIETQR_API_KEY) {
        console.warn("VietQR API credentials are not set in environment variables");
      }
      
      // Return credentials and settings
      res.json({
        // API credentials from environment
        clientId: process.env.VIETQR_CLIENT_ID || '',
        apiKey: process.env.VIETQR_API_KEY || '',
        
        // Bank settings from database
        bankSettings: settings.vietQRConfig || {}
      });
    } catch (error) {
      console.error("Error fetching VietQR configuration:", error);
      res.status(500).json({ message: "Error fetching VietQR configuration", error });
    }
  });

  app.get("/api/payment-settings/pricing", async (req, res) => {
    try {
      // Get payment settings
      let settings = await storage.getPaymentSettings();
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }
      
      // Only return the pricing configuration part
      res.json({
        priceConfig: settings.priceConfig
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching price configuration", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
