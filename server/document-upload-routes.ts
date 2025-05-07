import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ensureAuthenticated, ensureAdmin } from './auth-middleware';
import { processDocument, processInlineImages, DocumentProcessingError } from './document-processor';
import { processNovelContent } from './novel-content-processor';
import * as chapterService from './chapter-service';

// Tạo thư mục uploads nếu chưa có
const createUploadsDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Cấu hình lưu trữ cho document
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Cấu hình lưu trữ cho media (ảnh/video)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Custom error for file type validation
class FileTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileTypeError';
  }
}

// Filter cho document
const documentFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'text/plain', // txt
    'application/pdf', // pdf
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new FileTypeError('Unsupported file type! Only docx, doc, txt, and pdf are allowed.'), false);
  }
};

// Filter cho media
const mediaFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new FileTypeError('Unsupported file type! Only images and videos are allowed.'), false);
  }
};

// Tạo multer uploader
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

/**
 * Đăng ký các routes cho upload document và media
 * @param app Express application
 */
export function registerUploadRoutes(app: express.Express) {
  console.log('Registering upload routes...');
  
  // Route cho upload document
  app.post('/api/upload/document', ensureAuthenticated, ensureAdmin, uploadDocument.single('document'), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Xử lý file document thành HTML
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      
      // Chuyển đổi document sang HTML
      let htmlContent = await processDocument(fileBuffer, req.file.mimetype);
      
      // Xử lý ảnh inline trong HTML (nếu có)
      htmlContent = await processInlineImages(htmlContent);
      
      // Định dạng nội dung novel
      const processedContent = processNovelContent(htmlContent, {
        preserveHtml: true,
        autoClean: true
      });
      
      // Trả về nội dung HTML đã xử lý
      res.json({
        success: true,
        content: processedContent,
        originalName: req.file.originalname
      });
      
      // Xóa file tạm sau khi xử lý
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      
    } catch (error: any) {
      console.error('Error processing document:', error);
      if (error instanceof DocumentProcessingError) {
        res.status(400).json({
          error: 'Document processing failed',
          code: error.code,
          mimeType: error.mimeType,
          message: error.message
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to process document', 
          details: error.message 
        });
      }
    }
  });
  
  // Route cho upload document và lưu trực tiếp vào chapter mới
  app.post(
    '/api/upload/chapter-document/:contentId', 
    ensureAuthenticated, 
    ensureAdmin, 
    uploadDocument.single('document'), 
    async (req: express.Request, res: express.Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const contentId = parseInt(req.params.contentId);
        if (isNaN(contentId)) {
          return res.status(400).json({ error: 'Invalid content ID' });
        }
        
        // Lấy các thông tin chapter từ body
        const {
          number,
          title,
          releaseDate,
          isLocked,
          unlockPrice
        } = req.body;
        
        // Xử lý file document thành HTML
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        
        // Log thông tin xử lý
        console.log(`Processing document for content ${contentId}, chapter number ${number}`);
        console.log(`File: ${req.file.originalname}, mime type: ${req.file.mimetype}`);
        
        // Chuyển đổi document sang HTML
        let htmlContent = await processDocument(fileBuffer, req.file.mimetype);
        
        // Xử lý ảnh inline trong HTML (nếu có)
        htmlContent = await processInlineImages(htmlContent);
        
        // Định dạng nội dung novel
        const processedContent = processNovelContent(htmlContent, {
          preserveHtml: true,
          autoClean: true
        });
        
        // Tạo chapter mới từ nội dung đã xử lý
        const newChapter = await chapterService.createChapter({
          contentId,
          number: Number(number),
          title: title || req.file.originalname.replace(/\.[^/.]+$/, ""), // Dùng tên file nếu không có title
          releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
          isLocked: isLocked === 'true',
          unlockPrice: unlockPrice ? Number(unlockPrice) : null
        }, processedContent);
        
        // Trả về thông tin chapter đã tạo
        res.status(201).json({
          success: true,
          chapter: newChapter,
          contentLength: processedContent.length,
          message: 'Chapter created successfully with document content'
        });
        
        // Xóa file tạm sau khi xử lý
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
        
      } catch (error: any) {
        console.error('Error creating chapter from document:', error);
        if (error instanceof DocumentProcessingError) {
          res.status(400).json({
            error: `Document processing failed: ${error.message}`,
            code: error.code,
            mimeType: error.mimeType
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to create chapter from document', 
            details: error.message 
          });
        }
      }
    }
  );
  
  // Route cho upload document và cập nhật chapter đã tồn tại
  app.post(
    '/api/upload/chapter-document/:chapterId/update', 
    ensureAuthenticated, 
    ensureAdmin, 
    uploadDocument.single('document'), 
    async (req: express.Request, res: express.Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const chapterId = parseInt(req.params.chapterId);
        if (isNaN(chapterId)) {
          return res.status(400).json({ error: 'Invalid chapter ID' });
        }
        
        // Kiểm tra chapter tồn tại
        const existingChapter = await chapterService.getChapterById(chapterId);
        if (!existingChapter) {
          return res.status(404).json({ error: 'Chapter not found' });
        }
        
        // Xử lý file document thành HTML
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        
        // Log thông tin xử lý
        console.log(`Updating chapter ${chapterId} with document content`);
        console.log(`File: ${req.file.originalname}, mime type: ${req.file.mimetype}`);
        
        // Chuyển đổi document sang HTML
        let htmlContent = await processDocument(fileBuffer, req.file.mimetype);
        
        // Xử lý ảnh inline trong HTML (nếu có)
        htmlContent = await processInlineImages(htmlContent);
        
        // Định dạng nội dung novel
        const processedContent = processNovelContent(htmlContent, {
          preserveHtml: true,
          autoClean: true
        });
        
        // Cập nhật chapter với nội dung đã xử lý
        const updatedChapter = await chapterService.updateChapter({
          id: chapterId,
          content: processedContent,
          // Cập nhật các trường khác nếu được cung cấp
          title: req.body.title,
          releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
          isLocked: req.body.isLocked === 'true',
          unlockPrice: req.body.unlockPrice ? Number(req.body.unlockPrice) : undefined
        });
        
        // Trả về thông tin chapter đã cập nhật
        res.json({
          success: true,
          chapter: updatedChapter,
          contentLength: processedContent.length,
          message: 'Chapter updated successfully with document content'
        });
        
        // Xóa file tạm sau khi xử lý
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
        
      } catch (error: any) {
        console.error('Error updating chapter with document:', error);
        if (error instanceof DocumentProcessingError) {
          res.status(400).json({
            error: `Document processing failed: ${error.message}`,
            code: error.code,
            mimeType: error.mimeType
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to update chapter with document', 
            details: error.message 
          });
        }
      }
    }
  );
  
  // Route cho upload media
  app.post('/api/upload/media', ensureAuthenticated, ensureAdmin, uploadMedia.single('media'), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Tạo URL cho media
      const mediaUrl = `/uploads/media/${req.file.filename}`;
      
      // Trả về URL media
      res.json({
        success: true,
        url: mediaUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      });
      
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(500).json({ 
        error: 'Failed to upload media', 
        details: error.message 
      });
    }
  });
  
  console.log('Upload routes registered');
}