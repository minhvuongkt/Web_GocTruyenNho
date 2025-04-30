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
import {
  createPayOSPaymentLink,
  checkPayOSPaymentStatus,
  verifyPayOSWebhook,
  cancelPayOSPayment,
} from "./payos-utils";
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

  // Common handler for user updates
  // Thêm endpoint GET để trả về danh sách giao dịch cho user
  app.get(
    "/api/payments",
    ensureAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        // Lấy tham số phân trang từ query string
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Lấy danh sách giao dịch và tổng số từ storage
        // Sử dụng getPaymentsByUser vì đây là phương thức có trong interface
        const payments = await storage.getPaymentsByUser(user.id);

        // Thực hiện phân trang thủ công để tương thích với interface hiện tại
        const pagedPayments = payments.slice(offset, offset + limit);
        const total = payments.length;

        // Trả về danh sách và thông tin phân trang
        return res.json({
          payments: pagedPayments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        console.error("Error getting user payments:", error);
        return res.status(500).json({
          error: error.message || "Failed to get payment history",
        });
      }
    },
  );

  // Endpoint GET để lấy chi tiết một giao dịch
  app.get(
    "/api/payments/:id",
    ensureAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const paymentId = parseInt(id);

        if (isNaN(paymentId)) {
          return res.status(400).json({ error: "Invalid payment ID" });
        }

        // Lấy thông tin giao dịch từ storage
        const payment = await storage.getPayment(paymentId);

        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        // Kiểm tra quyền truy cập
        const user = req.user as any;
        if (payment.userId !== user.id && user.role !== "admin") {
          return res.status(403).json({
            error: "You don't have permission to access this payment",
          });
        }

        // Trả về thông tin giao dịch
        return res.json(payment);
      } catch (error: any) {
        console.error("Error getting payment details:", error);
        return res.status(500).json({
          error: error.message || "Failed to get payment details",
        });
      }
    },
  );

  const updateUserHandler = async (req: Request, res: Response) => {
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
  };

  // Support both PATCH and PUT for user updates
  app.patch("/api/users/:id", ensureAdmin, updateUserHandler);
  app.put("/api/users/:id", ensureAdmin, updateUserHandler);

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
  
  // Endpoint to get only the content type (for route handling)
  app.get("/api/content/:id/type", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contentInfo = await storage.getContent(id);

      if (!contentInfo) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json({ type: contentInfo.type });
    } catch (error) {
      res.status(500).json({ error: "Failed to get content type" });
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
      const contentData = { ...req.body }; // Tạo một bản sao để tránh thay đổi giá trị gốc

      // Xóa các trường không cần thiết và không thể cập nhật
      const genreIds = Array.isArray(contentData.genreIds)
        ? contentData.genreIds
        : undefined;
      delete contentData.genreIds;
      delete contentData.author;
      delete contentData.translationGroup;
      delete contentData.genres;
      delete contentData.createdAt; // Bỏ trường createdAt vì nó là timestamp
      delete contentData.id; // Không cập nhật id
      delete contentData.views; // Không cập nhật views trực tiếp

      // Chuyển đổi định dạng trường status nếu cần
      if (contentData.status) {
        // Đảm bảo status nằm trong danh sách giá trị hợp lệ
        if (!["ongoing", "completed", "hiatus"].includes(contentData.status)) {
          contentData.status = "ongoing"; // Giá trị mặc định
        }
      }

      console.log(
        "Updating content with cleaned data:",
        id,
        contentData,
        "Genre IDs:",
        genreIds,
      );

      const updatedContent = await storage.updateContent(
        id,
        contentData,
        genreIds,
      );

      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Lấy thông tin chi tiết của nội dung đã cập nhật để trả về đầy đủ
      const contentWithDetails = await storage.getContentWithDetails(id);
      res.json(contentWithDetails);
    } catch (error) {
      console.error("Error updating content:", error);
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
        const { positionInfo, ...otherData } = req.body;
        
        const chapterData = {
          ...otherData,
          contentId,
        };
        
        // Handle insertion at specific position
        if (positionInfo && positionInfo.insertPosition === 'specific' && positionInfo.referenceChapterId) {
          // Get reference chapter
          const referenceChapterId = parseInt(positionInfo.referenceChapterId);
          const referenceChapter = await storage.getChapter(referenceChapterId);
          
          if (!referenceChapter) {
            return res.status(404).json({ error: "Reference chapter not found" });
          }
          
          // Get all chapters for this content
          const contentChapters = await storage.getChaptersByContent(contentId);
          const sortedChapters = contentChapters.sort((a, b) => a.number - b.number);
          
          // Determine new chapter number based on insertion position
          let newChapterNumber;
          
          if (positionInfo.insertRelative === 'before') {
            // Insert before reference chapter
            newChapterNumber = referenceChapter.number;
            
            // Shift existing chapters up by 1
            for (const chapter of sortedChapters) {
              if (chapter.number >= newChapterNumber) {
                await storage.updateChapter(chapter.id, { 
                  ...chapter,
                  number: chapter.number + 1 
                });
              }
            }
          } else {
            // Insert after reference chapter
            newChapterNumber = referenceChapter.number + 1;
            
            // Shift existing chapters up by 1
            for (const chapter of sortedChapters) {
              if (chapter.number >= newChapterNumber) {
                await storage.updateChapter(chapter.id, { 
                  ...chapter,
                  number: chapter.number + 1 
                });
              }
            }
          }
          
          // Create new chapter with calculated position
          const newChapter = await storage.createChapter({
            ...chapterData,
            number: newChapterNumber
          });
          
          // Thêm nội dung chương vào bảng chapter_content
          if (chapterData.content) {
            await storage.createChapterContent({
              chapterId: newChapter.id,
              content: chapterData.content
            });
          }
          
          res.status(201).json(newChapter);
        } else {
          // Default behavior - add to end
          const newChapter = await storage.createChapter(chapterData);
          
          // Thêm nội dung chương vào bảng chapter_content
          if (chapterData.content) {
            await storage.createChapterContent({
              chapterId: newChapter.id,
              content: chapterData.content
            });
          }
          
          res.status(201).json(newChapter);
        }
      } catch (error) {
        console.error("Error creating chapter:", error);
        res.status(500).json({ 
          error: "Failed to create chapter",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    },
  );

  // Common handler for chapter updates
  const updateChapterHandler = async (req: Request, res: Response) => {
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
  };

  // Support both PATCH and PUT for chapter updates
  app.patch("/api/chapters/:id", ensureAdmin, updateChapterHandler);
  app.put("/api/chapters/:id", ensureAdmin, updateChapterHandler);

  // Chapter lock/unlock endpoint
  app.patch("/api/chapters/:id/lock", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isLocked, unlockPrice } = req.body;

      const updatedChapter = await storage.updateChapter(id, {
        isLocked,
        unlockPrice,
      });

      if (!updatedChapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      res.json(updatedChapter);
    } catch (error) {
      res.status(500).json({ error: "Failed to update chapter lock status" });
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

  // Handler for chapter content updates
  const updateChapterContentHandler = async (req: Request, res: Response) => {
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
  };

  // Support both PATCH and PUT for chapter content updates
  app.patch(
    "/api/chapter-content/:id",
    ensureAdmin,
    updateChapterContentHandler,
  );
  app.put("/api/chapter-content/:id", ensureAdmin, updateChapterContentHandler);

  app.delete("/api/chapter-content/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChapterContent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chapter content" });
    }
  });

  // File upload processing endpoints
  
  // Image upload endpoint for manga chapters
  app.post(
    "/api/chapters/images/upload",
    ensureAdmin,
    multer({ 
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), "public/uploads/chapter-images");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          // Use timestamp and original name to prevent collisions
          const timestamp = Date.now();
          const hash = createHash('md5').update(`${timestamp}-${file.originalname}`).digest('hex').substring(0, 8);
          const ext = path.extname(file.originalname);
          cb(null, `${timestamp}-${hash}${ext}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only images are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    }).array('images', 50), // Allow up to 50 images
    async (req, res) => {
      try {
        const imageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/chapter-images/${file.filename}`
        );
        
        res.status(200).json({ imageUrls });
      } catch (error) {
        res.status(500).json({ error: "Failed to process image upload" });
      }
    }
  );
  
  // ZIP file processing endpoint for manga chapters
  app.post(
    "/api/chapters/images/process-zip",
    ensureAdmin,
    multer({ 
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), "public/uploads/temp-zip");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          cb(null, `temp-${timestamp}.zip`);
        }
      }),
      fileFilter: (req, file, cb) => {
        const validTypes = ['application/zip', 'application/x-zip-compressed'];
        if (!validTypes.includes(file.mimetype)) {
          return cb(new Error('Only ZIP files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
      }
    }).single('zipFile'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No ZIP file uploaded" });
        }
        
        // In a real implementation, we would extract the ZIP file,
        // process images, and return their URLs
        // For now, we'll return a mock response
        
        const imageUrls = [
          "/uploads/chapter-images/sample-image-1.jpg",
          "/uploads/chapter-images/sample-image-2.jpg",
          "/uploads/chapter-images/sample-image-3.jpg"
        ];
        
        res.status(200).json({ imageUrls });
      } catch (error) {
        res.status(500).json({ error: "Failed to process ZIP file" });
      }
    }
  );
  
  // Text file processing endpoint for novel chapters
  app.post(
    "/api/chapters/text/process",
    ensureAdmin,
    multer({ 
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        const validTypes = [
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ];
        if (!validTypes.includes(file.mimetype)) {
          return cb(new Error('Only TXT, DOC, and DOCX files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    }).single('textFile'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No text file uploaded" });
        }
        
        // In a real implementation, we would process the file based on its type
        // For now, we'll return a simple response
        let content = "";
        
        if (req.file.mimetype === 'text/plain') {
          // For text files, just read the buffer as UTF-8
          content = req.file.buffer.toString('utf-8');
        } else {
          // For DOC/DOCX, we would use a library like mammoth.js
          // For now, we'll return a placeholder
          content = `<p>This is the processed content from the ${req.file.originalname} file.</p>`;
        }
        
        res.status(200).json({ content });
      } catch (error) {
        res.status(500).json({ error: "Failed to process text file" });
      }
    }
  );
  
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

      // Validate input parameters
      if (!contentId || !chapterId) {
        return res
          .status(400)
          .json({ error: "Content ID and Chapter ID are required" });
      }

      // Ensure they're valid numbers
      const contentIdNum = parseInt(contentId);
      const chapterIdNum = parseInt(chapterId);

      if (isNaN(contentIdNum) || isNaN(chapterIdNum)) {
        return res
          .status(400)
          .json({ error: "Invalid Content ID or Chapter ID" });
      }

      await storage.addReadingHistory(userId, contentIdNum, chapterIdNum);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error adding reading history:", error);
      res.status(500).json({
        error: "Failed to add reading history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/reading-history", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const history = await storage.getReadingHistory(userId);

      // Always return an array, even if empty
      res.json(history || []);
    } catch (error) {
      console.error("Error fetching reading history:", error);
      res.status(500).json({
        error: "Failed to get reading history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Favorites Routes
  app.post("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { contentId } = req.body;

      if (!contentId || isNaN(parseInt(contentId))) {
        return res
          .status(400)
          .json({ error: "Content ID is required and must be a valid number" });
      }

      const result = await storage.toggleFavorite(userId, parseInt(contentId));
      res.json({ success: true, added: result });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({
        error: "Failed to toggle favorite",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Thêm route riêng cho thêm/xóa yêu thích theo ID
  app.post(
    "/api/favorites/:contentId",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const contentId = parseInt(req.params.contentId);

        if (isNaN(contentId)) {
          return res.status(400).json({ error: "Invalid content ID" });
        }

        const result = await storage.toggleFavorite(userId, contentId);
        res.json({ success: true, added: result });
      } catch (error) {
        console.error("Error toggling favorite:", error);
        res.status(500).json({
          error: "Failed to toggle favorite",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  app.get("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites || []);
    } catch (error) {
      console.error("Error getting favorites:", error);
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

      // Verify contentId is a valid number
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }

      const comments = await storage.getCommentsByContent(contentId);

      // Always return an array, even if empty
      res.json(comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.get("/api/chapters/:chapterId/comments", async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);

      // Verify chapterId is a valid number
      if (isNaN(chapterId)) {
        return res.status(400).json({ error: "Invalid chapter ID" });
      }

      const comments = await storage.getCommentsByChapter(chapterId);

      // Always return an array, even if empty
      res.json(comments || []);
    } catch (error) {
      console.error("Error fetching chapter comments:", error);
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

      // Method can be 'bank_transfer' or 'payos'
      const newPayment = await storage.createPayment({
        userId,
        amount,
        method: method || "bank_transfer",
        transactionId,
        status: "pending",
        createdAt: new Date(),
      });

      // Get the payment settings
      const settings = await storage.getPaymentSettings();

      if (!settings) {
        return res
          .status(500)
          .json({ error: "Payment settings not configured" });
      }

      if (method === "bank_transfer") {
        if (!settings.vietQRConfig) {
          return res
            .status(500)
            .json({ error: "VietQR payment settings not configured" });
        }

        // Generate VietQR URL
        const vietQRConfig = settings.vietQRConfig as any;
        const qrCodeURL = generateVietQRURL({
          bankId: vietQRConfig.bankId,
          accountNumber: vietQRConfig.accountNumber,
          accountName: vietQRConfig.accountName,
          template: vietQRConfig.template || "compact2",
          amount,
          message: `NAP_${(req.user as any).username}`,
        });

        // Lấy thời gian hết hạn từ cấu hình (mặc định 10 phút)
        const expiryMinutes = settings.expiryConfig?.bankTransfer || 10;
        const expiresAt = new Date(
          newPayment.createdAt.getTime() + expiryMinutes * 60 * 1000,
        );

        res.status(201).json({
          payment: newPayment,
          qrCodeURL,
          expiresAt,
        });
      } else if (method === "payos") {
        // Tạo thanh toán qua PayOS
        if (!settings.payosConfig) {
          return res
            .status(500)
            .json({ error: "PayOS payment settings not configured" });
        }

        // Lấy config PayOS
        const payosConfig = settings.payosConfig as any;

        // Kiểm tra config
        if (
          !payosConfig.clientId ||
          !payosConfig.apiKey ||
          !payosConfig.checksumKey
        ) {
          return res
            .status(500)
            .json({ error: "PayOS API credentials are missing" });
        }

        // Setup PayOS request
        const baseUrl = payosConfig.baseUrl || "https://api-merchant.payos.vn";
        const config = {
          clientId: payosConfig.clientId,
          apiKey: payosConfig.apiKey,
          checksumKey: payosConfig.checksumKey,
          baseUrl,
        };

        // URL trả về sau khi thanh toán
        const appUrl =
          process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
        const returnUrl = `${appUrl}/payment-callback?code=00&status=PAID&orderCode=${newPayment.transactionId}`;
        const cancelUrl = `${appUrl}/payment-callback?cancel=true&orderCode=${newPayment.transactionId}`;

        try {
          // Sử dụng PayOS API để tạo payment link
          // Thời gian hết hạn: Hiện tại + 15 phút (đơn vị milliseconds)
          const expiryMinutes = 15; // 15 phút
          const expiryMilliseconds = expiryMinutes * 60 * 1000;
          const expiredAt = Date.now() + expiryMilliseconds;

          const paymentData = {
            amount: amount,
            description: `Nạp tiền tài khoản cho ${(req.user as any).username}`,
            orderCode: newPayment.transactionId,
            returnUrl: returnUrl,
            cancelUrl: cancelUrl,
            expiredAt: expiredAt,
          };

          console.log("PayOS payment request:", paymentData);

          // Tạo payment link qua PayOS API
          const payosResponse = await createPayOSPaymentLink(
            config,
            paymentData,
          );

          console.log("PayOS payment response:", payosResponse);

          // Kiểm tra response - Xử lý cả 2 dạng response từ PayOS
          let paymentLink = "";
          let qrCode = null;

          if (payosResponse) {
            // Kiểm tra xem response có dạng mới (code, data) không
            if (
              payosResponse.code === "00" &&
              payosResponse.data &&
              payosResponse.data?.checkoutUrl
            ) {
              paymentLink = payosResponse.data.checkoutUrl;
              qrCode = payosResponse.data?.qrCode || null;
            }
            // Hoặc dạng cũ (trả về trực tiếp từ SDK)
            else if (payosResponse.checkoutUrl) {
              paymentLink = payosResponse.checkoutUrl;
              qrCode = payosResponse.qrCode || null;
            }
            // Nếu không có cấu trúc nào phù hợp
            else {
              console.error("Invalid PayOS response format:", payosResponse);
              await storage.updatePaymentStatus(newPayment.id, "failed");
              return res
                .status(500)
                .json({ error: "Invalid PayOS response format" });
            }
          } else {
            console.error("Empty PayOS response");
            await storage.updatePaymentStatus(newPayment.id, "failed");
            return res.status(500).json({ error: "Empty PayOS response" });
          }

          // Lấy thời gian hết hạn từ cấu hình cho response
          // (Chúng ta đã đặt expiredAt cho PayOS ở trên rồi)
          const responseExpiryMinutes = settings.expiryConfig?.payos || 15;
          const expiresAt = new Date(
            newPayment.createdAt.getTime() + responseExpiryMinutes * 60 * 1000,
          );

          res.status(201).json({
            payment: newPayment,
            paymentLink: paymentLink,
            qrCode: qrCode,
            expiresAt: expiresAt,
          });
        } catch (error) {
          console.error("Error creating PayOS payment:", error);
          // Xóa thanh toán vì không tạo được token PayOS
          await storage.updatePaymentStatus(newPayment.id, "failed");

          return res
            .status(500)
            .json({ error: "Failed to create PayOS payment" });
        }
      } else {
        // Cho các phương thức khác trong tương lai
        // Lấy thời gian hết hạn từ cấu hình (mặc định 10 phút)
        const expiryMinutes = settings.expiryConfig?.bankTransfer || 10;
        const expiresAt = new Date(
          newPayment.createdAt.getTime() + expiryMinutes * 60 * 1000,
        );

        res.status(201).json({
          payment: newPayment,
          expiresAt: expiresAt,
        });
      }
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

  // Xác nhận thanh toán theo transactionId thay vì paymentId
  app.post("/api/payments/confirm", ensureAuthenticated, async (req, res) => {
    try {
      const { transactionId, returnUrl } = req.body;
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "Transaction ID is required",
        });
      }

      const userId = (req.user as any).id;
      const username = (req.user as any).username;

      // Lấy payment dựa vào transactionId
      const payment = await storage.getPaymentByTransactionId(transactionId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        });
      }

      // Kiểm tra payment của user
      if (payment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
        });
      }

      // Kiểm tra trạng thái hiện tại
      if (payment.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: `Payment is already ${payment.status}`,
        });
      }

      // Lấy cấu hình thanh toán để kiểm tra thời gian hết hạn
      const settings = await storage.getPaymentSettings();

      // Xác định thời gian hết hạn dựa vào phương thức thanh toán
      let expiryMinutes = 10; // Mặc định 10 phút

      if (settings && settings.expiryConfig) {
        if (payment.method === "vietqr" || payment.method === "bank_transfer") {
          expiryMinutes = settings.expiryConfig.bankTransfer || 10;
        } else if (payment.method === "payos") {
          expiryMinutes = settings.expiryConfig.payos || 15;
        }
      }

      const expiryTime = new Date(
        payment.createdAt.getTime() + expiryMinutes * 60 * 1000,
      );

      if (new Date() > expiryTime) {
        await storage.updatePaymentStatus(payment.id, "failed");
        return res.status(400).json({
          success: false,
          error: "Payment expired",
        });
      }

      // Không thay đổi trạng thái (vẫn là pending), chỉ đánh dấu là đã được xác nhận
      const updatedPayment = await storage.updatePaymentStatus(
        payment.id,
        "pending",
      );

      // Import function gửi email
      const { sendPaymentConfirmationEmail } = await import("./email-utils");

      // Gửi email thông báo cho admin
      await sendPaymentConfirmationEmail(
        transactionId,
        payment.amount,
        username,
        payment.method,
      );

      // Thêm redirectUrl vào response để client chuyển hướng
      res.json({
        success: true,
        payment: updatedPayment,
        message:
          "Payment confirmation sent. Please wait for admin verification.",
        redirectUrl: returnUrl || "/", // Nếu không có returnUrl thì chuyển về trang chủ
      });
    } catch (error) {
      console.error("Payment confirm error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to confirm payment",
      });
    }
  });

  // Common handler for payment status updates
  const updatePaymentStatusHandler = async (req: Request, res: Response) => {
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
          // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
          const currentBalance = user.balance || 0;
          await storage.updateUserBalance(
            user.id,
            currentBalance + payment.amount,
          );
        }
      }

      return res.json({
        success: true,
        payment: updatedPayment,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      return res.status(500).json({ error: "Failed to update payment status" });
    }
  };

  // Support both PATCH and PUT for payment status updates
  app.patch(
    "/api/payments/:id/status",
    ensureAdmin,
    updatePaymentStatusHandler,
  );
  app.put("/api/payments/:id/status", ensureAdmin, updatePaymentStatusHandler);

  // Add API endpoint for updating payment status by transaction ID (can be called by users)
  app.post(
    "/api/payments/update-status",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { transactionId, status } = req.body;

        if (!transactionId || !status) {
          return res.status(400).json({
            success: false,
            error: "Transaction ID and status are required",
          });
        }

        // Validate status
        type PaymentStatusType = "pending" | "completed" | "failed";
        if (!["pending", "completed", "failed"].includes(status)) {
          return res.status(400).json({
            success: false,
            error: "Invalid status",
          });
        }

        // Get payment by transaction ID
        const payment = await storage.getPaymentByTransactionId(transactionId);

        if (!payment) {
          return res.status(404).json({
            success: false,
            error: "Payment not found",
          });
        }

        // For user requests, only allow updating to failed status and only their own payments
        const userId = (req.user as any).id;
        const isAdmin = (req.user as any).isAdmin;

        if (!isAdmin) {
          if (payment.userId !== userId) {
            return res.status(403).json({
              success: false,
              error: "Forbidden",
            });
          }

          if (status !== "failed") {
            return res.status(403).json({
              success: false,
              error: "Users can only update to failed status",
            });
          }
        }

        // Update status
        let newStatus: PaymentStatusType = status as PaymentStatusType;
        const updatedPayment = await storage.updatePaymentStatus(
          payment.id,
          newStatus,
        );

        // Add the amount to user balance if completed
        if (newStatus === "completed") {
          const user = await storage.getUser(payment.userId);
          if (user) {
            // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
            const currentBalance = user.balance || 0;
            await storage.updateUserBalance(
              user.id,
              currentBalance + payment.amount,
            );
          }
        }

        res.json({
          success: true,
          payment: updatedPayment,
        });
      } catch (error) {
        console.error(
          "Error updating payment status by transaction ID:",
          error,
        );
        res.status(500).json({
          success: false,
          error: "Failed to update payment status",
        });
      }
    },
  );

  // Payment Settings Routes
  app.get("/api/payment-settings", ensureAdmin, async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      } else {
        // Đảm bảo các config mới đều có giá trị mặc định nếu chưa có
        if (!settings.emailConfig) {
          settings.emailConfig = {
            smtpHost: "smtp.gmail.com",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            senderEmail: "",
            adminEmail: "hlmvuong123@gmail.com",
          };
        }

        if (!settings.expiryConfig) {
          settings.expiryConfig = {
            bankTransfer: 10,
            payos: 15,
          };
        }
      }

      console.log("Payment settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error getting payment settings:", error);
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

  // Add PUT endpoint to match client request
  app.put("/api/payment-settings", ensureAdmin, async (req, res) => {
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
        accountNumber: vietQRConfig.accountNumber,
        accountName: vietQRConfig.accountName,
        template: vietQRConfig.template,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get VietQR config" });
    }
  });

  // Add API endpoint for fetching pricing settings
  app.get("/api/payment-settings/pricing", async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }

      const priceConfig = settings.priceConfig as any;

      if (!priceConfig) {
        return res.status(404).json({ error: "Price config not found" });
      }

      // Return pricing info including discount tiers
      res.json({
        coinConversionRate: priceConfig.coinConversionRate || 1000,
        minimumDeposit: priceConfig.minimumDeposit || 10000,
        chapterUnlockPrice: priceConfig.chapterUnlockPrice || 5,
        discountTiers: priceConfig.discountTiers || [],
        // Also include VietQR bank info for the payment form
        bankBin: settings.vietQRConfig?.bankId || "MBBANK",
        accountNumber: settings.vietQRConfig?.accountNumber || "0862713897",
        accountName: settings.vietQRConfig?.accountName || "Mèo Đi Dịch Truyện",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get pricing settings" });
    }
  });

  app.get(
    "/api/payment/payos/check-payment-status/:orderCode",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { orderCode } = req.params;

        if (!orderCode) {
          return res.status(400).json({
            code: "01",
            desc: "Order code is required",
            data: null,
          });
        }

        // Get PayOS settings
        const settings = await storage.getPaymentSettings();

        if (!settings || !settings.payosConfig) {
          return res.status(500).json({
            code: "02",
            desc: "PayOS settings not configured",
            data: null,
          });
        }

        const payosConfig = settings.payosConfig as any;

        // Check payment status
        const result = await checkPayOSPaymentStatus(payosConfig, orderCode);

        // If payment is completed, update payment and user balance
        if (
          result.code === "00" &&
          result.data &&
          result.data.status === "PAID"
        ) {
          // Find payment with this order code/transaction ID
          const payment = await storage.getPaymentByTransactionId(orderCode);

          if (payment && payment.status !== "completed") {
            // Update payment status
            await storage.updatePaymentStatus(payment.id, "completed");

            // Update user balance
            const user = await storage.getUser(payment.userId);

            if (user) {
              // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
              const currentBalance = user.balance || 0;
              await storage.updateUserBalance(
                user.id,
                currentBalance + payment.amount,
              );
            }
          }
        }

        // Return the result
        res.json(result);
      } catch (error: any) {
        console.error("PayOS status check error:", error);
        res.status(500).json({
          code: "99",
          desc: error.message || "Failed to check PayOS payment status",
          data: null,
        });
      }
    },
  );

  // PayOS webhook handler
  app.post("/api/payos/webhook", async (req, res) => {
    try {
      const webhookSignature = req.headers["x-webhook-signature"] as string;
      const rawBody = JSON.stringify(req.body);

      if (!webhookSignature) {
        return res.status(400).json({ error: "Missing webhook signature" });
      }

      // Get PayOS settings
      const settings = await storage.getPaymentSettings();

      if (!settings || !settings.payosConfig) {
        return res.status(500).json({ error: "PayOS settings not configured" });
      }

      const payosConfig = settings.payosConfig as any;

      // Verify the webhook signature
      const isValid = verifyPayOSWebhook(
        payosConfig,
        rawBody,
        webhookSignature,
      );

      if (!isValid) {
        return res.status(403).json({ error: "Invalid webhook signature" });
      }

      // Process the webhook data
      const { orderCode, status, amount } = req.body.data || {};

      if (orderCode && status) {
        // Find payment with this order code/transaction ID
        const payment = await storage.getPaymentByTransactionId(orderCode);

        if (payment) {
          if (status === "PAID" && payment.status !== "completed") {
            // Update payment status
            await storage.updatePaymentStatus(payment.id, "completed");

            // Update user balance
            const user = await storage.getUser(payment.userId);

            if (user) {
              // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
              const currentBalance = user.balance || 0;
              await storage.updateUserBalance(
                user.id,
                currentBalance + payment.amount,
              );
            }
          } else if (status === "CANCELED" && payment.status !== "failed") {
            // Update payment status to failed
            await storage.updatePaymentStatus(payment.id, "failed");
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("PayOS webhook error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to process PayOS webhook" });
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
      const isAdmin =
        req.isAuthenticated() && (req.user as any).role === "admin";

      if (position) {
        const ads = await storage.getActiveAdvertisements(position);
        return res.json(ads);
      }

      // For admin view, always return all advertisements
      if (isAdmin || req.query.all === "true") {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        console.log("Fetching all advertisements for admin", { page, limit });
        const result = await storage.getAllAdvertisements(page, limit);
        return res.json(result);
      }

      // Fallback for users without position specified
      const allActiveAds = [];
      const bannerAds = await storage.getActiveAdvertisements("banner");
      const sidebarAds = await storage.getActiveAdvertisements("sidebar");
      const popupAds = await storage.getActiveAdvertisements("popup");
      return res.json([...bannerAds, ...sidebarAds, ...popupAds]);
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
        const {
          title,
          targetUrl,
          position,
          startDate,
          endDate,
          imageUrl: providedImageUrl,
          isActive,
        } = req.body;

        // Use either uploaded file or provided imageUrl
        let imageUrl = providedImageUrl;

        if (req.file) {
          imageUrl = `/uploads/${req.file.filename}`;
        }

        if (!imageUrl) {
          return res.status(400).json({ error: "Image URL is required" });
        }

        const newAd = await storage.createAdvertisement({
          title,
          imageUrl,
          targetUrl,
          position: position as "banner" | "sidebar" | "popup",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive:
            isActive === undefined
              ? true
              : isActive === "true" || isActive === true,
        });

        res.status(201).json(newAd);
      } catch (error) {
        console.error("Error creating ad:", error);
        res.status(500).json({ error: "Failed to create ad" });
      }
    },
  );

  // Handler for updating ads
  const updateAdHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const adData: any = { ...req.body };

      // Handle image update if provided
      if (req.file) {
        adData.imageUrl = `/uploads/${req.file.filename}`;
      }
      // No need to check for imageUrl separately since it's included in adData
      // if it's passed in the request body

      // Parse dates if provided
      if (adData.startDate) {
        adData.startDate = new Date(adData.startDate);
      }

      if (adData.endDate) {
        adData.endDate = new Date(adData.endDate);
      }

      // Parse boolean - handle both string and boolean types
      if (adData.isActive !== undefined) {
        adData.isActive =
          adData.isActive === true || adData.isActive === "true";
      }

      const updatedAd = await storage.updateAdvertisement(id, adData);

      if (!updatedAd) {
        return res.status(404).json({ error: "Ad not found" });
      }

      res.json(updatedAd);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ error: "Failed to update ad" });
    }
  };

  // Support both PATCH and PUT for ad updates
  app.patch(
    "/api/ads/:id",
    ensureAdmin,
    upload.single("image"),
    updateAdHandler,
  );
  app.put("/api/ads/:id", ensureAdmin, upload.single("image"), updateAdHandler);

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

  // PayOS Payment Routes
  app.get("/api/payment-settings/payos-config", async (req, res) => {
    try {
      let settings = await storage.getPaymentSettings();

      if (!settings) {
        settings = await storage.createDefaultPaymentSettings();
      }

      const payosConfig = settings.payosConfig as any;

      if (!payosConfig || !payosConfig.clientId) {
        return res
          .status(404)
          .json({ error: "PayOS config not found or incomplete" });
      }

      // Return only necessary public info
      res.json({
        isConfigured: true,
        clientId: payosConfig.clientId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get PayOS config" });
    }
  });

  app.get(
    "/api/payment/payos/check-payment-status/:orderCode",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { orderCode } = req.params;

        // Get PayOS settings
        const settings = await storage.getPaymentSettings();
        if (!settings || !settings.payosConfig) {
          return res
            .status(500)
            .json({ error: "PayOS settings not configured" });
        }

        const payosConfig = settings.payosConfig as any;
        if (
          !payosConfig.clientId ||
          !payosConfig.apiKey ||
          !payosConfig.checksumKey
        ) {
          return res
            .status(500)
            .json({ error: "PayOS API credentials are missing" });
        }

        // Get the payment by transaction ID
        const payment = await storage.getPaymentByTransactionId(orderCode);
        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        // Check if the payment belongs to the user
        const userId = (req.user as any).id;
        if (payment.userId !== userId && (req.user as any).role !== "admin") {
          return res.status(403).json({ error: "Forbidden" });
        }

        // Check payment status with PayOS
        const baseUrl = payosConfig.baseUrl || "https://api-merchant.payos.vn";
        const config = {
          clientId: payosConfig.clientId,
          apiKey: payosConfig.apiKey,
          checksumKey: payosConfig.checksumKey,
          baseUrl,
        };

        const statusResponse = await checkPayOSPaymentStatus(config, orderCode);

        // Update payment status based on PayOS response
        if (statusResponse.code === "00" && statusResponse.data?.status) {
          let newStatus: "pending" | "completed" | "failed" = "pending";

          if (statusResponse.data.status === "PAID") {
            newStatus = "completed";

            // If payment is completed, add the amount to the user's balance
            const user = await storage.getUser(payment.userId);
            if (user) {
              await storage.updateUserBalance(
                user.id,
                user.balance + payment.amount,
              );
            }
          } else if (
            statusResponse.data.status === "CANCELLED" ||
            statusResponse.data.status === "EXPIRED"
          ) {
            newStatus = "failed";
          }

          if (payment.status !== newStatus) {
            await storage.updatePaymentStatus(payment.id, newStatus);
            payment.status = newStatus;
          }
        }

        res.json({
          payment,
          payosStatus: statusResponse.data?.status || "UNKNOWN",
        });
      } catch (error) {
        console.error("Error checking PayOS payment status:", error);
        res.status(500).json({ error: "Failed to check payment status" });
      }
    },
  );
  app.post(
    "/api/payment/payos/create-payment-link",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const username = (req.user as any).username;
        const { amount } = req.body;

        if (!amount || amount < 5000 || amount % 1000 !== 0) {
          return res.status(400).json({
            error:
              "Số tiền không phù hợp. Số tiền nhập phải lớn hơn 5k và chia hết cho 1000",
          });
        }

        // Get PayOS settings
        const settings = await storage.getPaymentSettings();
        if (!settings || !settings.payosConfig) {
          return res
            .status(500)
            .json({ error: "PayOS settings not configured" });
        }

        const payosConfig = settings.payosConfig as any;
        if (
          !payosConfig.clientId ||
          !payosConfig.apiKey ||
          !payosConfig.checksumKey
        ) {
          return res
            .status(500)
            .json({ error: "PayOS API credentials are missing" });
        }

        // Create a new payment record
        const transactionId = `${Date.now().toString().slice(-8)}`;
        const newPayment = await storage.createPayment({
          userId,
          amount,
          method: "payos",
          transactionId: transactionId,
          status: "pending",
          createdAt: new Date(),
        });
        // Create the payment via PayOS
        const baseUrl = payosConfig.baseUrl || "https://api-merchant.payos.vn";
        const config = {
          clientId: payosConfig.clientId,
          apiKey: payosConfig.apiKey,
          checksumKey: payosConfig.checksumKey,
          baseUrl,
        };

        const appUrl =
          process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
        const returnUrl = `${appUrl}/payment/success?id=${newPayment.id}`;
        const cancelUrl = `${appUrl}/payment/cancel?id=${newPayment.id}`;
        const expiryMinutes = settings.expiryConfig?.bankTransfer || 15;
        // Tính toán thời gian hết hạn trong miliseconds (thời gian hiện tại + 15 phút)
        const expiresAt = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
        const paymentData = {
          amount,
          description: `NAP_${username}`,
          orderCode: transactionId,
          returnUrl,
          cancelUrl,
          expiredAt: expiresAt,
        };

        const paymentLinkResponse = await createPayOSPaymentLink(
          config,
          paymentData,
        );
        res.status(201).json({
          payment: newPayment,
          paymentLink: paymentLinkResponse.checkoutUrl || null,
          qrCode: paymentLinkResponse.qrCode || null,
          expiresAt: new Date(expiresAt * 1000), // 15 minutes expiry
        });
      } catch (error) {
        console.error("Error creating PayOS payment:", error);
        res.status(500).json({ error: "Failed to create PayOS payment" });
      }
    },
  );

  // PayOS endpoints for embedded checkout
  // Tạo thanh toán
  app.post("/api/payments", ensureAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const { amount, method, description } = req.body;

      if (!amount || !method) {
        return res.status(400).json({
          error: "Missing required fields: amount and method are required",
        });
      }

      // Đảm bảo số tiền là số nguyên dương
      const paymentAmount = parseInt(amount, 10);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({
          error: "Amount must be a positive number",
        });
      }

      // Lấy thông tin user từ session
      const user = req.user as any;
      if (!user || !user.id) {
        return res.status(401).json({
          error: "User not authenticated",
        });
      }

      // Tạo mã giao dịch duy nhất
      function generateOrderCode() {
        const timestamp = Date.now().toString().slice(-10);
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        return timestamp + random;
      }

      const transactionId = generateOrderCode();

      // Lấy cài đặt thanh toán
      const settings = await storage.getPaymentSettings();
      if (!settings) {
        return res.status(500).json({
          error: "Payment settings not configured",
        });
      }

      const expiryMinutes = settings.expiryConfig?.bankTransfer || 15;
      const expiredAt = Date.now() + expiryMinutes * 60 * 1000;

      // Tạo thanh toán trong database
      const paymentData = {
        userId: user.id,
        amount: paymentAmount,
        method,
        status: "pending",
        transactionId,
        description: description || `Nạp tiền cho tài khoản ${user.username}`,
        metadata: {
          expiredAt,
        },
      };

      const payment = await storage.createPayment(paymentData as any);

      // Trả về thông tin thanh toán đã tạo
      return res.status(201).json({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        expiredAt,
      });
    } catch (error: any) {
      console.error("Create payment error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create payment",
      });
    }
  });

  // Tạo thanh toán PayOS
  app.post(
    "/api/payos/create-payment",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { amount, orderCode, description, returnUrl, cancelUrl } =
          req.body;

        // Validate required fields
        if (!amount || !orderCode || !description || !returnUrl || !cancelUrl) {
          return res.status(400).json({
            code: "01",
            desc: "Missing required parameters",
            data: null,
          });
        }
        // Get PayOS settings
        const settings = await storage.getPaymentSettings();

        if (!settings || !settings.payosConfig) {
          return res.status(500).json({
            code: "02",
            desc: "PayOS settings not configured",
            data: null,
          });
        }
        const payosConfig = settings.payosConfig as any;

        // Lấy thời gian hết hạn từ cấu hình hoặc mặc định là 15 phút
        const expiryMinutes = settings.expiryConfig?.bankTransfer || 15;

        // Tính thời gian hết hạn dưới dạng Unix timestamp (giây) cho PayOS API
        const now = Math.floor(Date.now() / 1000); // Timestamp hiện tại dạng giây
        const paymentExpiryTime = now + expiryMinutes * 60; // Thêm số phút cấu hình

        // Check for required configurations
        if (
          !payosConfig.clientId ||
          !payosConfig.apiKey ||
          !payosConfig.checksumKey ||
          !payosConfig.baseUrl
        ) {
          return res.status(500).json({
            code: "03",
            desc: "Incomplete PayOS configuration",
            data: null,
          });
        }

        // Create payment link
        const result = await createPayOSPaymentLink(payosConfig, {
          amount,
          orderCode,
          description,
          returnUrl,
          cancelUrl,
          expiredAt: paymentExpiryTime,
        });

        // Calculate expiry time - add to response
        const expiresAt = new Date(paymentExpiryTime * 1000); // Convert seconds to milliseconds

        // Return the result directly with expiry information
        res.json({
          ...result,
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error: any) {
        console.error("PayOS create payment error:", error);
        res.status(500).json({
          code: "99",
          desc: error.message || "Failed to create PayOS payment",
          data: null,
        });
      }
    },
  );

  // Cancel a PayOS payment
  app.post(
    "/api/payos/cancel/:orderCode",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { orderCode } = req.params;
        if (!orderCode) {
          return res.status(400).json({
            code: "01",
            desc: "Order code is required",
            data: null,
          });
        }

        // Get payment from storage to verify ownership
        const payment = await storage.getPaymentByTransactionId(orderCode);
        if (!payment) {
          return res.status(404).json({
            code: "04",
            desc: "Payment not found",
            data: null,
          });
        }

        // Check if the payment belongs to the user
        const userId = (req.user as any).id;
        if (payment.userId !== userId && (req.user as any).role !== "admin") {
          return res.status(403).json({
            code: "03",
            desc: "Forbidden - you don't have permission to cancel this payment",
            data: null,
          });
        }

        // Check if payment is already completed or failed
        if (payment.status !== "pending") {
          return res.status(400).json({
            code: "05",
            desc: `Cannot cancel payment - already ${payment.status}`,
            data: null,
          });
        }

        // Get PayOS settings
        const settings = await storage.getPaymentSettings();
        if (!settings || !settings.payosConfig) {
          return res.status(500).json({
            code: "02",
            desc: "PayOS settings not configured",
            data: null,
          });
        }

        const payosConfig = settings.payosConfig as any;

        // Call PayOS API to cancel the payment
        try {
          const cancelResult = await cancelPayOSPayment(
            {
              clientId: payosConfig.clientId,
              apiKey: payosConfig.apiKey,
              checksumKey: payosConfig.checksumKey,
              baseUrl: payosConfig.baseUrl || "https://api-merchant.payos.vn",
            },
            orderCode,
          );

          // Update payment status in database
          await storage.updatePaymentStatus(payment.id, "failed");

          return res.json({
            code: "00",
            desc: "Payment cancelled successfully",
            data: cancelResult,
          });
        } catch (error: any) {
          console.error("PayOS payment cancellation error:", error);

          // Even if the PayOS API call fails, we'll still mark it as failed in our database
          // This ensures the user's UI is updated
          await storage.updatePaymentStatus(payment.id, "failed");

          return res.status(200).json({
            code: "00",
            desc: "Payment marked as cancelled in our database",
            data: {
              error: error.message,
              orderCode,
            },
          });
        }
      } catch (error: any) {
        console.error("Payment cancellation API error:", error);
        return res.status(500).json({
          code: "99",
          desc: error.message || "Server error during payment cancellation",
          data: null,
        });
      }
    },
  );

  app.get(
    "/api/payos/status/:orderCode",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { orderCode } = req.params;

        if (!orderCode) {
          return res.status(400).json({
            code: "01",
            desc: "Order code is required",
            data: null,
          });
        }

        // Get PayOS settings
        const settings = await storage.getPaymentSettings();

        if (!settings || !settings.payosConfig) {
          return res.status(500).json({
            code: "02",
            desc: "PayOS settings not configured",
            data: null,
          });
        }

        const payosConfig = settings.payosConfig as any;

        // Check payment status
        const result = await checkPayOSPaymentStatus(payosConfig, orderCode);
        console.log(
          "PayOS status check result:",
          JSON.stringify(result, null, 2),
        );

        // Biến để theo dõi trạng thái thanh toán
        let paymentStatus = null;

        // Xử lý cả hai dạng response có thể nhận được từ PayOS
        if (result && typeof result === "object") {
          // Kiểm tra dạng response mới (có code, data)
          if (result.code === "00" && result.data && result.data.status) {
            paymentStatus = result.data.status;
          }
          // Kiểm tra dạng response trực tiếp từ SDK
          else if (result.status) {
            paymentStatus = result.status;
          }
        }

        console.log("PayOS payment status:", paymentStatus);

        // Nếu tìm thấy trạng thái và đã thanh toán
        if (paymentStatus === "PAID") {
          // Tìm payment với order code/transaction ID này
          const payment = await storage.getPaymentByTransactionId(orderCode);

          if (payment && payment.status === "pending") {
            // Cập nhật trạng thái payment
            await storage.updatePaymentStatus(payment.id, "completed");

            // Cập nhật số dư người dùng
            const user = await storage.getUser(payment.userId);

            if (user) {
              // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
              const currentBalance = user.balance || 0;
              await storage.updateUserBalance(
                user.id,
                currentBalance + payment.amount,
              );
            }
          }
        } else if (
          paymentStatus === "CANCELLED" ||
          paymentStatus === "EXPIRED"
        ) {
          // Xử lý trạng thái hủy hoặc hết hạn
          const payment = await storage.getPaymentByTransactionId(orderCode);

          if (payment && payment.status === "pending") {
            // Cập nhật trạng thái payment sang failed
            await storage.updatePaymentStatus(payment.id, "failed");
          }
        }

        // Trả về kết quả
        // Chuyển đổi dữ liệu theo định dạng thống nhất
        // để client xử lý dễ dàng
        res.json({
          code: "00",
          desc: "Success",
          data: {
            status: paymentStatus,
            orderCode: orderCode,
            // Thêm các trường khác từ result nếu có
            ...(result.data || result),
          },
        });
      } catch (error: any) {
        console.error("PayOS status check error:", error);
        res.status(500).json({
          code: "99",
          desc: error.message || "Failed to check PayOS payment status",
          data: null,
        });
      }
    },
  );

  // Tạo hoặc lấy QR code cho giao dịch PayOS
  app.get(
    "/api/payments/:transactionId/qr",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { transactionId } = req.params;

        if (!transactionId) {
          return res.status(400).json({
            error: "Transaction ID is required",
          });
        }

        // Lấy thông tin thanh toán từ database
        const payment = await storage.getPaymentByTransactionId(transactionId);

        if (!payment) {
          return res.status(404).json({
            error: "Payment not found",
          });
        }

        // Chỉ cho phép người dùng sở hữu giao dịch hoặc admin truy cập
        const userId = (req.user as any).id;
        if (payment.userId !== userId && (req.user as any).role !== "admin") {
          return res.status(403).json({
            error: "You don't have permission to access this payment",
          });
        }

        // Nếu thanh toán không phải là PayOS thì trả về lỗi
        if (payment.method !== "payos") {
          return res.status(400).json({
            error: "This payment method does not support QR codes",
          });
        }

        // Lấy cài đặt thanh toán
        const settings = await storage.getPaymentSettings();
        if (!settings || !settings.payosConfig) {
          return res.status(500).json({
            error: "PayOS settings not configured",
          });
        }

        const payosConfig = settings.payosConfig as any;

        // Tạo URL callback
        const baseUrl =
          process.env.BASE_URL ||
          `http://localhost:${process.env.PORT || 5000}`;
        const returnUrl = `${baseUrl}/payment-callback?code=00&status=PAID&orderCode=${transactionId}`;
        const cancelUrl = `${baseUrl}/payment-callback?cancel=true&orderCode=${transactionId}`;

        // Tạo mô tả thanh toán
        const description = payment.description || `Thanh toán #${payment.id}`;

        // Tạo link thanh toán PayOS nếu chưa có
        let payosData;

        try {
          // Tính thời gian hết hạn từ metadata hoặc dựa vào cài đặt
          let expiredAt;
          if (payment.metadata && payment.metadata.expiredAt) {
            expiredAt = payment.metadata.expiredAt;
          } else {
            // Tính thời gian hết hạn dưới dạng Unix timestamp (giây) cho PayOS API
            const expiryMinutes = settings.expiryConfig?.payos || 15;
            expiredAt = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
          }

          // Tạo payment link thông qua PayOS API
          payosData = await createPayOSPaymentLink(
            {
              clientId: payosConfig.clientId,
              apiKey: payosConfig.apiKey,
              checksumKey: payosConfig.checksumKey,
              baseUrl: payosConfig.baseUrl || "https://api-merchant.payos.vn",
            },
            {
              amount: payment.amount,
              orderCode: transactionId,
              description: description,
              returnUrl: returnUrl,
              cancelUrl: cancelUrl,
              expiredAt: expiredAt,
            },
          );

          if (!payosData || (!payosData.qrCode && !payosData.data?.qrCode)) {
            throw new Error("PayOS API did not return QR code");
          }

          // Lấy QR code từ response
          const qrCodeContent = payosData.qrCode || payosData.data?.qrCode;

          // Lưu thông tin QR code vào metadata của payment (nếu cần)
          const updatedMetadata = {
            ...payment.metadata,
            payosQrCode: qrCodeContent,
            checkoutUrl: payosData.checkoutUrl || payosData.data?.checkoutUrl,
            expiredAt: expiredAt,
          };

          await storage.updatePayment(payment.id, {
            metadata: updatedMetadata,
          } as any);

          // Trả về QR code và thông tin thanh toán
          return res.json({
            qrCode: qrCodeContent,
            checkoutUrl: payosData.checkoutUrl || payosData.data?.checkoutUrl,
            amount: payment.amount,
            description: description,
            transactionId: transactionId,
            expiresAt: new Date(expiredAt * 1000).toISOString(),
          });
        } catch (error: any) {
          console.error("Error generating PayOS QR code:", error);
          return res.status(500).json({
            error: error.message || "Failed to generate QR code",
          });
        }
      } catch (error: any) {
        console.error("Payment QR code API error:", error);
        return res.status(500).json({
          error: error.message || "Server error",
        });
      }
    },
  );

  // Kiểm tra trạng thái thanh toán (sử dụng cho client polling)
  app.get(
    "/api/payments/:transactionId/status",
    ensureAuthenticated,
    async (req, res) => {
      try {
        const { transactionId } = req.params;

        if (!transactionId) {
          return res.status(400).json({
            error: "Transaction ID is required",
          });
        }

        // Lấy thông tin thanh toán từ database
        const payment = await storage.getPaymentByTransactionId(transactionId);

        if (!payment) {
          return res.status(404).json({
            error: "Payment not found",
          });
        }

        // Chỉ cho phép người dùng sở hữu giao dịch hoặc admin truy cập
        const userId = (req.user as any).id;
        if (payment.userId !== userId && (req.user as any).role !== "admin") {
          return res.status(403).json({
            error: "You don't have permission to access this payment",
          });
        }

        // Nếu thanh toán đã hoàn thành hoặc thất bại, trả về trạng thái từ database
        if (payment.status !== "pending") {
          return res.json({
            status: payment.status,
            transactionId: payment.transactionId,
            updatedAt: payment.updatedAt,
          });
        }

        // Nếu là PayOS và đang trong trạng thái pending, kiểm tra với PayOS API
        if (payment.method === "payos") {
          // Lấy cài đặt thanh toán
          const settings = await storage.getPaymentSettings();
          if (!settings || !settings.payosConfig) {
            return res.status(500).json({
              error: "PayOS settings not configured",
            });
          }

          const payosConfig = settings.payosConfig as any;

          try {
            // Kiểm tra trạng thái từ PayOS API
            const statusResult = await checkPayOSPaymentStatus(
              {
                clientId: payosConfig.clientId,
                apiKey: payosConfig.apiKey,
                checksumKey: payosConfig.checksumKey,
                baseUrl: payosConfig.baseUrl || "https://api-merchant.payos.vn",
              },
              transactionId,
            );

            // Xử lý kết quả từ PayOS API
            let paymentStatus = payment.status; // Mặc định giữ nguyên trạng thái
            let apiStatus = null;

            // Trích xuất trạng thái từ response (xử lý cả 2 dạng response)
            if (statusResult && typeof statusResult === "object") {
              // Kiểm tra dạng response mới (có code, data)
              if (
                statusResult.code === "00" &&
                statusResult.data &&
                statusResult.data.status
              ) {
                apiStatus = statusResult.data.status;
              }
              // Kiểm tra dạng response trực tiếp từ SDK
              else if (statusResult.status) {
                apiStatus = statusResult.status;
              }
            }

            // Cập nhật trạng thái nếu có thay đổi
            if (apiStatus === "PAID" && payment.status === "pending") {
              // Cập nhật trạng thái trong database
              await storage.updatePaymentStatus(payment.id, "completed");

              // Cập nhật số dư người dùng
              const user = await storage.getUser(payment.userId);
              if (user) {
                // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
                const currentBalance = user.balance || 0;
                await storage.updateUserBalance(
                  user.id,
                  currentBalance + payment.amount,
                );
              }

              paymentStatus = "completed";
            } else if (
              (apiStatus === "CANCELLED" || apiStatus === "EXPIRED") &&
              payment.status === "pending"
            ) {
              await storage.updatePaymentStatus(payment.id, "failed");
              paymentStatus = "failed";
            }

            // Trả về trạng thái cập nhật
            return res.json({
              status: paymentStatus,
              apiStatus: apiStatus,
              transactionId: payment.transactionId,
            });
          } catch (error: any) {
            console.error("Error checking PayOS payment status:", error);

            // Trả về trạng thái từ database nếu gọi API thất bại
            return res.json({
              status: payment.status,
              transactionId: payment.transactionId,
              error: "Failed to check status from PayOS API",
            });
          }
        }

        // Đối với các phương thức thanh toán khác
        return res.json({
          status: payment.status,
          transactionId: payment.transactionId,
        });
      } catch (error: any) {
        console.error("Payment status API error:", error);
        return res.status(500).json({
          error: error.message || "Server error",
        });
      }
    },
  );

  // PayOS webhook endpoint
  app.post("/api/webhooks/payos", async (req, res) => {
    try {
      console.log("Received PayOS webhook:", req.body);

      const webhookSignature = req.headers["x-webhook-signature"] as string;
      if (!webhookSignature) {
        console.warn("Missing webhook signature");
        // Đối với môi trường dev, chúng ta vẫn xử lý webhook ngay cả khi không có signature
        // Trong môi trường production, bạn nên uncomment dòng dưới đây
        // return res.status(400).json({ error: "Missing webhook signature" });
      }

      // Get PayOS settings
      const settings = await storage.getPaymentSettings();
      if (!settings || !settings.payosConfig) {
        return res.status(500).json({ error: "PayOS settings not configured" });
      }

      const payosConfig = settings.payosConfig as any;

      // Kiểm tra checksumKey nếu cần thiết cho việc xác thực webhook
      if (webhookSignature && !payosConfig.checksumKey) {
        console.warn("Webhook signature provided but checksumKey is missing");
      }

      // Verify webhook nếu có signature
      let isValid = true;
      if (webhookSignature && payosConfig.checksumKey) {
        const bodyData = JSON.stringify(req.body);
        isValid = verifyPayOSWebhook(
          {
            clientId: payosConfig.clientId,
            apiKey: payosConfig.apiKey,
            checksumKey: payosConfig.checksumKey,
            baseUrl: payosConfig.baseUrl || "https://api-merchant.payos.vn",
          },
          bodyData,
          webhookSignature,
        );

        if (!isValid) {
          console.warn(
            "Invalid webhook signature, but processing anyway in dev environment",
          );
          // Trong môi trường production, bạn nên uncomment dòng dưới đây
          // return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }

      // Process webhook data - xử lý nhiều dạng webhook khác nhau từ PayOS
      let orderCode: string | undefined;
      let status: string | undefined;

      // Trích xuất orderCode và status từ nhiều dạng khác nhau của webhook
      if (req.body.orderCode) {
        // Format webhook trực tiếp
        orderCode = req.body.orderCode.toString();
        status = req.body.status;
      } else if (req.body.data && req.body.data.orderCode) {
        // Format webhook qua wrapper
        orderCode = req.body.data.orderCode.toString();
        status = req.body.data.status;
      } else if (req.body.order && req.body.order.orderCode) {
        // Format webhook khác (nếu có)
        orderCode = req.body.order.orderCode.toString();
        status = req.body.order.status;
      }

      console.log("Extracted webhook data:", { orderCode, status });

      if (!orderCode) {
        return res
          .status(400)
          .json({ error: "Missing order code in webhook data" });
      }

      // Xử lý orderCode - có thể là số hoặc chuỗi có tiền tố
      // Nếu orderCode bắt đầu bằng "ORDER", loại bỏ tiền tố
      if (orderCode.startsWith("ORDER")) {
        orderCode = orderCode.replace("ORDER", "");
      }

      // Update payment status
      const payment = await storage.getPaymentByTransactionId(orderCode);
      if (!payment) {
        console.warn(`Payment not found for order code: ${orderCode}`);
        return res.status(404).json({ error: "Payment not found" });
      }

      console.log("Found payment:", payment);

      if (status === "PAID" && payment.status !== "completed") {
        console.log(`Updating payment ${payment.id} to completed`);
        await storage.updatePaymentStatus(payment.id, "completed");

        // Add the amount to the user's balance
        const user = await storage.getUser(payment.userId);
        if (user) {
          // Đảm bảo user.balance tồn tại, nếu không thì set mặc định là 0
          const currentBalance = user.balance || 0;
          await storage.updateUserBalance(
            user.id,
            currentBalance + payment.amount,
          );
          console.log(`Updated user ${user.id} balance: +${payment.amount}`);
        }
      } else if (
        (status === "CANCELLED" || status === "EXPIRED") &&
        payment.status !== "failed"
      ) {
        console.log(`Updating payment ${payment.id} to failed`);
        await storage.updatePaymentStatus(payment.id, "failed");
      } else {
        console.log(
          `Payment ${payment.id} status unchanged: ${payment.status}`,
        );
      }

      // Luôn trả về thành công để PayOS không gửi lại webhook
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing PayOS webhook:", error);
      // Vẫn trả về thành công để PayOS không gửi lại webhook
      res.json({ success: true });
    }
  });

  // Create HTTP server without starting it
  return new Server(app);
}
