import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { docxToHtml, docToHtml, txtToHtml, pdfToHtml, processInlineImages } from './document-processor';
import { ensureAuthenticated, ensureAdmin } from './auth-middleware';
import { processNovelContent } from './novel-content-processor';

// Đảm bảo thư mục tồn tại
const createDirectoryIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Cấu hình lưu trữ tài liệu
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/documents';
    createDirectoryIfNotExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Cấu hình lưu trữ media
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/content-images';
    createDirectoryIfNotExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Filter cho tài liệu
const documentFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedExts = ['.docx', '.doc', '.txt', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ'), false);
  }
};

// Filter cho media
const mediaFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng media không được hỗ trợ'), false);
  }
};

// Khởi tạo multer
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * Đăng ký các routes cho upload document và media
 * @param app Express application
 */
export function registerUploadRoutes(app: express.Express) {
  console.log('Registering upload routes...');
  
  // Route upload tài liệu
  app.post('/api/upload/document', ensureAuthenticated, ensureAdmin, uploadDocument.single('document'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Không tìm thấy file' });
      }
      
      const file = req.file;
      const fileExt = path.extname(file.originalname).toLowerCase();
      const filePath = file.path;
      
      console.log(`Processing document: ${file.originalname} (${fileExt})`);
      
      // Đọc file buffer
      const fileBuffer = fs.readFileSync(filePath);
      let htmlContent = '';
      
      // Chuyển đổi dựa trên loại file
      if (fileExt === '.docx') {
        htmlContent = await docxToHtml(fileBuffer);
      } else if (fileExt === '.doc') {
        htmlContent = await docToHtml(fileBuffer);
      } else if (fileExt === '.txt') {
        htmlContent = await txtToHtml(fileBuffer);
      } else if (fileExt === '.pdf') {
        htmlContent = await pdfToHtml(fileBuffer);
      } else {
        return res.status(400).json({ error: 'Định dạng file không được hỗ trợ' });
      }
      
      // Xử lý ảnh trong nội dung nếu có
      htmlContent = await processInlineImages(htmlContent);
      
      // Xử lý nội dung truyện
      const processedContent = processNovelContent(htmlContent, {
        autoClean: true
      });
      
      // Xóa file tạm
      fs.unlinkSync(filePath);
      
      return res.status(200).json({
        success: true,
        content: processedContent
      });
      
    } catch (error) {
      console.error('Error processing document:', error);
      return res.status(500).json({ error: 'Lỗi xử lý tài liệu' });
    }
  });
  
  // Route upload media
  app.post('/api/upload/media', ensureAuthenticated, ensureAdmin, uploadMedia.single('media'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Không tìm thấy file' });
      }
      
      const file = req.file;
      const filePath = file.path;
      const relativePath = filePath.replace('public', '');
      
      // URL được sử dụng trong editor
      const mediaUrl = relativePath;
      
      console.log(`Media uploaded: ${file.originalname}, URL: ${mediaUrl}`);
      
      return res.status(200).json({
        success: true,
        url: mediaUrl,
        type: file.mimetype
      });
      
    } catch (error) {
      console.error('Error uploading media:', error);
      return res.status(500).json({ error: 'Lỗi tải lên media' });
    }
  });
  
  console.log('Upload routes registered');
}