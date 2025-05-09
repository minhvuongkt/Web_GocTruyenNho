// Định nghĩa các routes cho chapter
import { Express, Request, Response, NextFunction } from 'express';
import * as chapterService from './chapter-service';
import { processInlineImages } from './document-processor';
import { ensureAdmin } from './auth-middleware';

// Không cần định nghĩa lại ensureAdmin vì đã import từ auth-middleware.ts

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
  console.log('Registering chapter routes...');
  // Route lấy thông tin chapter
  app.get('/api/chapters/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid chapter ID' });
      }
      
      // Sử dụng tùy chọn mới để tối ưu truy vấn và chỉ lấy dữ liệu cần thiết
      const chapterInfo = await chapterService.getChapterById(id, {
        includeContent: true,
        contentColumnOnly: true,
        checkContentLength: true // Trả về độ dài nội dung để gỡ lỗi
      });
      
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
      
      // Lấy nội dung chapter từ kết quả mới
      const chapterContent = chapterInfo.content || '';
      
      // Sử dụng contentLength nếu có, nếu không thì dùng length của string
      const contentLength = chapterInfo.contentLength || chapterContent.length;
      console.log(`Sending chapter ${id} with content length: ${contentLength}`);
      
      if (chapterContent.length > 0) {
        // Log sample của nội dung để debug
        const sampleLength = Math.min(200, chapterContent.length);
        console.log('Content sample:', chapterContent.substring(0, sampleLength));
      }
      
      // Trả về dữ liệu chapter với thêm thông tin về độ dài nội dung
      res.json({
        chapter: {
          ...chapterInfo.chapter,
          content: chapterContent,
          contentLength: contentLength,
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
      
      // Lấy nội dung chapter nếu có
      const chapterContent = chapterInfo.contents && chapterInfo.contents.length > 0
        ? chapterInfo.contents[0].content
        : '';
      
      console.log(`Sending chapter for content ${contentId}, number ${chapterNumber} with content length: ${chapterContent.length}`);
      if (chapterContent.length > 0) {
        // Log sample của nội dung để debug
        const sampleLength = Math.min(200, chapterContent.length);
        console.log('Content sample:', chapterContent.substring(0, sampleLength));
      }
      
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
      
      if (content && content.length > 0) {
        const sampleLength = Math.min(200, content.length);
        console.log('Content sample:', content.substring(0, sampleLength));
      }
      
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
      
      const { content, ...otherData } = req.body;
      
      console.log(`Updating chapter ${id} with data:`, otherData);
      if (content) {
        console.log(`Content length: ${content.length}`);
        const sampleLength = Math.min(200, content.length);
        console.log('Content sample:', content.substring(0, sampleLength));
      }
      
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
      
      const { content, ...otherData } = req.body;
      
      console.log(`Updating chapter ${id} with data:`, otherData);
      if (content) {
        console.log(`Content length: ${content.length}`);
        const sampleLength = Math.min(200, content.length);
        console.log('Content sample:', content.substring(0, sampleLength));
      }
      
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
      
      const { title, content, ...otherData } = req.body;
      console.log(`Updating chapter for content ${contentId}, number ${chapterNumber}`);
      
      if (content) {
        console.log(`Content length: ${content.length}`);
        const sampleLength = Math.min(200, content.length);
        console.log('Content sample:', content.substring(0, sampleLength));
      }
      
      // Lấy thông tin chapter
      const chapterInfo = await chapterService.getChapterByContentAndNumber(contentId, chapterNumber);
      
      if (!chapterInfo) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      // Cập nhật chapter
      const updatedChapter = await chapterService.updateChapter({
        id: chapterInfo.chapter.id,
        title,
        content,
        ...otherData
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