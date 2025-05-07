import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ensureAuthenticated, ensureAdmin } from './auth-middleware';
import { processDocument, processInlineImages } from './document-processor';
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
    cb(new Error('Unsupported file type! Only docx, doc, txt, and pdf are allowed.'), false);
  }
};

// Filter cho media
const mediaFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type! Only images and videos are allowed.'), false);
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
      res.status(500).json({ 
        error: 'Failed to process document', 
        details: error.message 
      });
    }
  });
  
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