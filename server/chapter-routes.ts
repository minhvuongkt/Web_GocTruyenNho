// Định nghĩa các routes cho chapter
import { Express, Request, Response } from 'express';
import * as chapterService from './chapter-service';
import { processInlineImages } from './document-processor';

// Import middleware authentication
function ensureAdmin(req: Request, res: Response, next: Function) {
  // Kiểm tra nếu user đã đăng nhập (được xác thực)
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Kiểm tra nếu user có role admin
  if ((req.user as any).role !== "admin") {
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  }

  next();
}

// Middleware để xử lý hình ảnh nội tuyến trong nội dung
async function processContentImages(req: Request, res: Response, next: Function) {
  try {
    if (req.body && req.body.content && typeof req.body.content === 'string' &&
        req.body.content.includes('data:image/')) {
      // Thay thế base64 images bằng file thực tế
      req.body.content = await processInlineImages(req.body.content);
      console.log('Processed and saved inline images in content');
    }
    next();
  } catch (error) {
    console.error('Error processing inline images:', error);
    next(error);
  }
}

/**
 * Đăng ký các routes cho chapter
 * @param app Express application
 */
export function registerChapterRoutes(app: Express) {
  // Route lấy thông tin chapter
  app.get('/api/chapters/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      const chapterInfo = await chapterService.getChapterById(id);
      
      if (!chapterInfo) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      // Kiểm tra chapter bị khóa
      let isUnlocked = !chapterInfo.chapter.isLocked;
      
      if (chapterInfo.chapter.isLocked && req.isAuthenticated && req.isAuthenticated()) {
        // TODO: Kiểm tra user đã mở khóa chapter chưa
        const userId = (req.user as any).id;
        // isUnlocked = await storage.isChapterUnlocked(userId, chapterInfo.chapter.id);
        // TODO: Implement this in the future, temporarily setting to true for development
        isUnlocked = true;
      }
      
      // Chỉ tăng lượt xem nếu chapter không bị khóa hoặc đã được mở khóa
      if (isUnlocked) {
        // TODO: Tăng lượt xem
        // await storage.incrementChapterViews(chapterInfo.chapter.id);
      }
      
      const chapterContent = chapterInfo.contents && chapterInfo.contents.length > 0
        ? chapterInfo.contents[0].content
        : '';
      
      // Trả về dữ liệu chapter
      res.json({
        chapter: {
          ...chapterInfo.chapter,
          content: chapterContent,
          isUnlocked
        }
      });
    } catch (error) {
      console.error('Error getting chapter:', error);
      res.status(500).json({ 
        error: 'Failed to get chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Lấy chapter theo content ID và số thứ tự
  app.get('/api/content/:contentId/chapter/:chapterNumber', async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const chapterNumber = parseInt(req.params.chapterNumber);
      
      if (isNaN(contentId) || isNaN(chapterNumber)) {
        return res.status(400).json({
          error: 'Invalid content ID or chapter number',
          details: `ContentId: ${req.params.contentId}, ChapterNumber: ${req.params.chapterNumber}`
        });
      }
      
      const chapterInfo = await chapterService.getChapterByContentAndNumber(contentId, chapterNumber);
      
      if (!chapterInfo) {
        return res.status(404).json({
          error: 'Chapter not found',
          details: `No chapter found with contentId: ${contentId} and number: ${chapterNumber}`
        });
      }
      
      // Kiểm tra chapter bị khóa
      let isUnlocked = !chapterInfo.chapter.isLocked;
      
      if (chapterInfo.chapter.isLocked && req.isAuthenticated && req.isAuthenticated()) {
        // TODO: Kiểm tra user đã mở khóa chapter chưa
        const userId = (req.user as any).id;
        // isUnlocked = await storage.isChapterUnlocked(userId, chapterInfo.chapter.id);
        // TODO: Implement this in the future, temporarily setting to true for development
        isUnlocked = true;
      }
      
      // Chỉ tăng lượt xem nếu chapter không bị khóa hoặc đã được mở khóa
      if (isUnlocked) {
        // TODO: Tăng lượt xem
        // await storage.incrementChapterViews(chapterInfo.chapter.id);
      }
      
      const chapterContent = chapterInfo.contents && chapterInfo.contents.length > 0
        ? chapterInfo.contents[0].content
        : '';
      
      // Trả về dữ liệu chapter
      res.json({
        chapter: {
          ...chapterInfo.chapter,
          content: chapterContent,
          isUnlocked
        }
      });
    } catch (error) {
      console.error('Error getting chapter by content and number:', error);
      res.status(500).json({ 
        error: 'Failed to get chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Tạo chapter mới
  app.post('/api/content/:contentId/chapters', ensureAdmin, processContentImages, async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      if (isNaN(contentId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      
      const { content, ...chapterData } = req.body;
      
      // Log nhiều hơn để xem dữ liệu đầu vào
      console.log('Creating new chapter with data:', {
        contentId,
        bodyData: req.body,
        content: content ? `Content length: ${content.length}` : 'No content provided'
      });
      
      // Tạo chapter mới với service
      const newChapter = await chapterService.createChapter(
        {
          ...chapterData,
          contentId
        },
        content
      );
      
      console.log('Chapter created successfully:', newChapter);
      res.status(201).json(newChapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({
        error: 'Failed to create chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Cập nhật chapter
  app.patch('/api/chapters/:id', ensureAdmin, processContentImages, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      console.log('Updating chapter with data:', req.body);
      
      // Sử dụng service để cập nhật chapter
      const updatedChapter = await chapterService.updateChapter({
        id,
        ...req.body
      });
      
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({
        error: 'Failed to update chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Hỗ trợ PUT cũng dùng cùng handler với PATCH
  app.put('/api/chapters/:id', ensureAdmin, processContentImages, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      console.log('Updating chapter with data:', req.body);
      
      // Sử dụng service để cập nhật chapter
      const updatedChapter = await chapterService.updateChapter({
        id,
        ...req.body
      });
      
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({
        error: 'Failed to update chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Xóa chapter
  app.delete('/api/chapters/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      await chapterService.deleteChapter(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({
        error: 'Failed to delete chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Cập nhật trạng thái khóa của chapter
  app.patch('/api/chapters/:id/lock', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      const { isLocked, unlockPrice } = req.body;
      
      // Cập nhật thông tin khóa của chapter
      const updatedChapter = await chapterService.updateChapter({
        id,
        isLocked,
        unlockPrice
      });
      
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter lock status:', error);
      res.status(500).json({
        error: 'Failed to update chapter lock status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route cập nhật chapter theo contentId và chapterNumber
  app.patch('/api/content/:contentId/chapter/:chapterNumber', ensureAdmin, processContentImages, async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const chapterNumber = parseInt(req.params.chapterNumber);
      
      if (isNaN(contentId) || isNaN(chapterNumber)) {
        return res.status(400).json({
          error: 'Invalid content ID or chapter number'
        });
      }
      
      const { title, content } = req.body;
      console.log('Updating chapter by content and number:', req.body);
      
      // Lấy thông tin chapter
      const chapterInfo = await chapterService.getChapterByContentAndNumber(contentId, chapterNumber);
      
      if (!chapterInfo) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      // Cập nhật chapter
      const updatedChapter = await chapterService.updateChapter({
        id: chapterInfo.chapter.id,
        title,
        content
      });
      
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter by content and number:', error);
      res.status(500).json({
        error: 'Failed to update chapter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
