import express, { Request, Response } from 'express';
import { db } from '../db';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  sql,
} from 'drizzle-orm';
import { advertisements } from '@shared/schema';
import { ensureAdmin } from '../auth-middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Chuyển đổi dữ liệu quảng cáo dựa trên provider
function transformAdData(ad: any) {
  // Nếu là quảng cáo bên ngoài và có metadata, xử lý để tương thích với frontend
  if (ad.provider !== 'internal' && ad.metadata) {
    let metadata = {};
    try {
      // Chuyển đổi metadata từ chuỗi JSON nếu cần
      if (typeof ad.metadata === 'string') {
        metadata = JSON.parse(ad.metadata);
      } else {
        metadata = ad.metadata;
      }
      
      // Trả về định dạng phù hợp với mã nguồn cũ để tránh thay đổi frontend nhiều
      if (ad.provider === 'google' || ad.provider === 'facebook' || ad.provider === 'other') {
        return {
          ...ad,
          name: ad.title,
          scriptContent: metadata.scriptContent || '',
          adUnitId: metadata.adUnitId || '',
          slotId: metadata.slotId || '',
          publisherId: metadata.publisherId || '',
          cssSelector: metadata.cssSelector || '',
          cssStyles: metadata.cssStyles || '',
          format: metadata.format || 'auto',
          isMobileEnabled: metadata.isMobileEnabled !== undefined ? metadata.isMobileEnabled : true
        };
      }
    } catch (e) {
      console.error('Error parsing ad metadata:', e);
    }
  }
  
  return ad;
}

export function registerAdRoutes(app: express.Express) {
  // Lấy danh sách quảng cáo cho admin (phân trang)
  app.get('/api/ads', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const position = req.query.position as string;
      const provider = req.query.provider as string;
      
      const offset = (page - 1) * limit;
      
      // Build query for all ads with filters
      let query = db.select().from(advertisements);
      
      // Add filters
      if (search) {
        query = query.where(ilike(advertisements.title, `%${search}%`));
      }
      
      if (status === 'active') {
        query = query.where(eq(advertisements.isActive, true));
      } else if (status === 'inactive') {
        query = query.where(eq(advertisements.isActive, false));
      }
      
      if (position) {
        query = query.where(eq(advertisements.position, position as any));
      }
      
      // Add provider filter if specified
      if (provider === 'external') {
        query = query.where(ne(advertisements.provider, 'internal'));
      } else if (provider) {
        query = query.where(eq(advertisements.provider, provider as any));
      }
      
      // Tính tổng số quảng cáo với các bộ lọc
      let countQuery = db.select({ count: sql`count(*)` }).from(advertisements);
      
      // Apply the same filters to the count query
      if (search) {
        countQuery = countQuery.where(ilike(advertisements.title, `%${search}%`));
      }
      
      if (status === 'active') {
        countQuery = countQuery.where(eq(advertisements.isActive, true));
      } else if (status === 'inactive') {
        countQuery = countQuery.where(eq(advertisements.isActive, false));
      }
      
      if (position) {
        countQuery = countQuery.where(eq(advertisements.position, position as any));
      }
      
      // Add provider filter if specified
      if (provider === 'external') {
        countQuery = countQuery.where(ne(advertisements.provider, 'internal'));
      } else if (provider) {
        countQuery = countQuery.where(eq(advertisements.provider, provider as any));
      }
      
      const totalCountResult = await countQuery;
      const total = parseInt(totalCountResult[0].count.toString());
      
      // Thực hiện truy vấn chính với phân trang
      const ads = await query.limit(limit).offset(offset).orderBy(desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(ads));
      
      // Add transformations for external ads
      const transformedResults = plainResults.map(transformAdData);
      
      res.status(200).json({
        ads: transformedResults,
        total: total.toString(),
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách quảng cáo' });
    }
  });

  // Lấy các quảng cáo đang hoạt động
  app.get('/api/ads/active', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const provider = req.query.provider as string;
      
      // Build query conditions
      let conditions = [
        eq(advertisements.isActive, true),
        lte(advertisements.startDate, now),
        gte(advertisements.endDate, now)
      ];
      
      // Add provider filter if specified
      if (provider === 'external') {
        conditions.push(ne(advertisements.provider, 'internal'));
      } else if (provider) {
        conditions.push(eq(advertisements.provider, provider));
      } else {
        // Default to internal ads for backward compatibility
        conditions.push(eq(advertisements.provider, 'internal'));
      }
      
      // Truy vấn quảng cáo đang hoạt động
      const activeAds = await db.select().from(advertisements)
        .where(and(...conditions))
        .orderBy(asc(advertisements.displayOrder), sql`random()`); // Thêm random() để trộn ngẫu nhiên
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(activeAds));
      
      // Transform external ads to include metadata fields
      const transformedResults = plainResults.map(transformAdData);
      
      res.status(200).json(transformedResults);
    } catch (error) {
      console.error('Error fetching active ads:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách quảng cáo đang hoạt động' });
    }
  });

  // Middleware to handle file uploads for ads
  
  // Create uploads dir if not exists
  const adUploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
  if (!fs.existsSync(adUploadDir)) {
    fs.mkdirSync(adUploadDir, { recursive: true });
  }
  
  // Configure storage for ad images
  const adImageStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: Function) => {
      cb(null, adUploadDir);
    },
    filename: (req: any, file: any, cb: Function) => {
      const uniqueSuffix = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, 'ad-image-' + uniqueSuffix + ext);
    }
  });
  
  // Filter for ad images
  const adImageFilter = (req: any, file: any, cb: Function) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };
  
  // Create multer uploader
  const uploadAdImage = multer({
    storage: adImageStorage,
    fileFilter: adImageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  });
  
  // Tạo quảng cáo mới - supports both direct file upload and imageUrl
  app.post('/api/ads', ensureAdmin, uploadAdImage.single('image'), async (req: Request, res: Response) => {
    try {
      const { 
        title, imageUrl, targetUrl, position, 
        displayOrder, width, height, displayFrequency,
        startDate, endDate, isActive, provider = 'internal', metadata
      } = req.body;
      
      // Determine image source - from file upload or URL
      let finalImageUrl = imageUrl;
      
      // If a file was uploaded, use its path
      if (req.file) {
        finalImageUrl = `/uploads/ads/${req.file.filename}`;
        console.log('Image uploaded:', finalImageUrl);
      }
      
      console.log('Received data:', { title, imageUrl: finalImageUrl, targetUrl, position, startDate, endDate });
      
      // Validate required fields
      if (!title || !position) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            title: !title ? 'Title is required' : null,
            position: !position ? 'Position is required' : null
          }
        });
      }
      
      // Validate and parse dates
      let parsedStartDate, parsedEndDate;
      try {
        // If dates are empty or invalid, use default dates
        parsedStartDate = startDate ? new Date(startDate) : new Date();
        
        // If end date is not provided or invalid, set it to 30 days from start date
        if (!endDate) {
          parsedEndDate = new Date(parsedStartDate);
          parsedEndDate.setDate(parsedEndDate.getDate() + 30);
        } else {
          parsedEndDate = new Date(endDate);
        }
        
        // Extra validation to ensure dates are valid
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.error('Date parsing error:', error);
        return res.status(400).json({ error: 'Invalid date format. Please provide valid dates.' });
      }
      
      const newAd = {
        title,
        imageUrl: finalImageUrl,
        targetUrl,
        position,
        displayOrder: displayOrder || 0,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: isActive === false ? false : true,
        width: width || null,
        height: height || null,
        displayFrequency: displayFrequency || 30,
        views: 0,
        clicks: 0,
        provider: provider || 'internal',
        metadata: metadata ? JSON.stringify(metadata) : null,
      };
      
      const [ad] = await db.insert(advertisements).values(newAd).returning();
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResult = JSON.parse(JSON.stringify(ad));
      
      res.status(201).json(plainResult);
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({ error: 'Không thể tạo quảng cáo mới' });
    }
  });

  // Cập nhật quảng cáo
  app.put('/api/ads/:id', ensureAdmin, uploadAdImage.single('image'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        title, imageUrl, targetUrl, position, 
        displayOrder, width, height, displayFrequency,
        startDate, endDate, isActive, metadata, provider
      } = req.body;
      
      // Determine image source - from file upload or URL
      let finalImageUrl = imageUrl;
      
      // If a file was uploaded, use its path
      if (req.file) {
        finalImageUrl = `/uploads/ads/${req.file.filename}`;
        console.log('Image uploaded in update:', finalImageUrl);
      }
      
      console.log('Update - Received dates:', { startDate, endDate });
      
      // Validate and parse dates
      let parsedStartDate, parsedEndDate;
      try {
        // Get the existing ad to use its dates as fallback
        const [existingAd] = await db.select().from(advertisements)
          .where(eq(advertisements.id, id));
          
        if (!existingAd) {
          return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
        }
        
        // Use existing dates as fallback if new ones are not provided
        parsedStartDate = startDate ? new Date(startDate) : existingAd.startDate;
        
        if (!endDate) {
          parsedEndDate = existingAd.endDate;
        } else {
          parsedEndDate = new Date(endDate);
        }
        
        // Extra validation to ensure dates are valid
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.error('Date parsing error:', error);
        return res.status(400).json({ error: 'Invalid date format. Please provide valid dates.' });
      }
      
      const updateData = {
        title,
        imageUrl: finalImageUrl,
        targetUrl,
        position,
        displayOrder: displayOrder || 0,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: isActive !== undefined ? isActive : true,
        width: width || null,
        height: height || null,
        displayFrequency: displayFrequency || 30,
      };
      
      // Only update provider if it was provided
      if (provider) {
        updateData['provider'] = provider;
      }
      
      // Only update metadata if it was provided
      if (metadata) {
        updateData['metadata'] = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
      }
      
      const [updatedAd] = await db.update(advertisements)
                                  .set(updateData)
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      if (!updatedAd) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
      }
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResult = JSON.parse(JSON.stringify(updatedAd));
      
      res.status(200).json(plainResult);
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({ error: 'Không thể cập nhật quảng cáo' });
    }
  });

  // Xóa quảng cáo
  app.delete('/api/ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const [deletedAd] = await db.delete(advertisements)
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      if (!deletedAd) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
      }
      
      res.status(200).json({ message: 'Quảng cáo đã được xóa', id });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({ error: 'Không thể xóa quảng cáo' });
    }
  });

  // Cập nhật số lượt xem của quảng cáo
  app.patch('/api/ads/:id/views', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
      
      if (!ad) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
      }
      
      const [updatedAd] = await db.update(advertisements)
                                  .set({ views: ad.views + 1 })
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      res.status(200).json({ success: true, views: updatedAd.views });
    } catch (error) {
      console.error('Error updating ad views:', error);
      res.status(500).json({ error: 'Không thể cập nhật lượt xem' });
    }
  });

  // Cập nhật số lượt nhấp chuột của quảng cáo
  app.patch('/api/ads/:id/clicks', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
      
      if (!ad) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
      }
      
      const [updatedAd] = await db.update(advertisements)
                                  .set({ clicks: ad.clicks + 1 })
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      res.status(200).json({ success: true, clicks: updatedAd.clicks });
    } catch (error) {
      console.error('Error updating ad clicks:', error);
      res.status(500).json({ error: 'Không thể cập nhật lượt nhấp chuột' });
    }
  });

  // === IMAGE UPLOAD REDIRECT ROUTE ===
  // This route redirects to the shared upload route in document-upload-routes.ts
  app.post('/api/ads/upload-image', ensureAdmin, async (req: Request, res: Response) => {
    // Redirect to the centralized upload route
    res.redirect(307, '/api/upload/ad-image');
  });
  
  // === EXTERNAL ADS ROUTES (Quảng cáo bên ngoài) ===
  // Legacy endpoints that redirect to the new consolidated API
  
  // Lấy danh sách quảng cáo bên ngoài - redirect to consolidated API
  app.get('/api/external-ads', async (req: Request, res: Response) => {
    // Add provider=external to the query and redirect to the consolidated API
    const query = new URLSearchParams(req.query as any);
    
    // Always set provider to external for this legacy endpoint
    query.set('provider', 'external');
    
    // Redirect to the consolidated API
    return res.redirect(`/api/ads?${query.toString()}`);
  });
  
  // Lấy quảng cáo bên ngoài đang hoạt động - redirect to consolidated API
  app.get('/api/external-ads/active', async (req: Request, res: Response) => {
    // Redirect to the consolidated API with provider=external
    return res.redirect('/api/ads/active?provider=external');
  });
  
  // Tạo quảng cáo bên ngoài mới - transform and pass to consolidated API
  app.post('/api/external-ads', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const {
        name, provider, scriptContent, position,
        adUnitId, slotId, publisherId, isActive,
        cssSelector, cssStyles, width, height,
        format, isMobileEnabled
      } = req.body;
      
      // Lưu thông tin chi tiết vào trường metadata
      const metadata = {
        scriptContent,
        adUnitId,
        slotId,
        publisherId,
        cssSelector,
        cssStyles,
        format: format || 'auto',
        isMobileEnabled: isMobileEnabled !== undefined ? isMobileEnabled : true
      };
      
      // Chuyển đổi thành định dạng quảng cáo thống nhất
      const newAdRequest = {
        title: name,
        imageUrl: '',
        targetUrl: '#',
        position,
        provider,
        displayOrder: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Mặc định là 1 năm
        isActive: isActive !== undefined ? isActive : true,
        width: width || null,
        height: height || null,
        metadata
      };
      
      // Chuyển request tới API tạo quảng cáo thống nhất
      req.body = newAdRequest;
      
      // Change the URL and redirect to main API
      req.url = '/api/ads';
      return app._router.handle(req, res);
    } catch (error) {
      console.error('Error creating external ad:', error);
      res.status(500).json({ error: 'Không thể tạo quảng cáo bên ngoài' });
    }
  });
  
  // Cập nhật quảng cáo bên ngoài - transform and pass to consolidated API
  app.put('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      // Forward the request to the main ad update endpoint
      req.url = `/api/ads/${req.params.id}`;
      return app._router.handle(req, res);
    } catch (error) {
      console.error('Error updating external ad:', error);
      res.status(500).json({ error: 'Không thể cập nhật quảng cáo bên ngoài' });
    }
  });
  
  // Xóa quảng cáo bên ngoài - forward to consolidated API
  app.delete('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      // Forward the request to the main ad deletion endpoint
      req.url = `/api/ads/${req.params.id}`;
      return app._router.handle(req, res);
    } catch (error) {
      console.error('Error deleting external ad:', error);
      res.status(500).json({ error: 'Không thể xóa quảng cáo bên ngoài' });
    }
  });
}