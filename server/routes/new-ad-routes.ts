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
      
      const offset = (page - 1) * limit;
      const pageSize = limit;
      
      // Chỉ lấy quảng cáo nội bộ
      let query = db.select().from(advertisements)
                   .where(eq(advertisements.provider, 'internal'));
      
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
      
      // Tính tổng số quảng cáo
      const totalCountResult = await db.select({ count: sql`count(*)` })
                                      .from(advertisements)
                                      .where(eq(advertisements.provider, 'internal'));
      
      const total = parseInt(totalCountResult[0].count.toString());
      
      // Thực hiện truy vấn chính với phân trang
      const ads = await query.limit(pageSize).offset(offset).orderBy(desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(ads));
      
      res.status(200).json({
        ads: plainResults,
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
      
      const activeAds = await db.select().from(advertisements)
        .where(and(...conditions))
        .orderBy(asc(advertisements.displayOrder), desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(activeAds));
      
      res.status(200).json(plainResults);
    } catch (error) {
      console.error('Error fetching active ads:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách quảng cáo đang hoạt động' });
    }
  });

  // Tạo quảng cáo mới
  app.post('/api/ads', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        title, imageUrl, targetUrl, position, 
        displayOrder, width, height, displayFrequency,
        startDate, endDate, isActive 
      } = req.body;
      
      const newAd = {
        title,
        imageUrl,
        targetUrl,
        position,
        displayOrder: displayOrder || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || true,
        width: width || null,
        height: height || null,
        displayFrequency: displayFrequency || 30,
        views: 0,
        clicks: 0,
        provider: 'internal',
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
  app.put('/api/ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        title, imageUrl, targetUrl, position, 
        displayOrder, width, height, displayFrequency,
        startDate, endDate, isActive 
      } = req.body;
      
      const updateData = {
        title,
        imageUrl,
        targetUrl,
        position,
        displayOrder: displayOrder || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        width: width || null,
        height: height || null,
        displayFrequency: displayFrequency || 30,
      };
      
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

  // === EXTERNAL ADS ROUTES (Quảng cáo bên ngoài) ===
  
  // Lấy danh sách quảng cáo bên ngoài
  app.get('/api/external-ads', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const position = req.query.position as string;
      const provider = req.query.provider as string;
      
      const offset = (page - 1) * limit;
      const pageSize = limit;
      
      // Lấy quảng cáo từ bên ngoài (không phải internal)
      let query = db.select().from(advertisements)
                   .where(ne(advertisements.provider, 'internal'));
      
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
      
      if (provider) {
        query = query.where(eq(advertisements.provider, provider as any));
      }
      
      // Tính tổng số quảng cáo
      const totalCountResult = await db.select({ count: sql`count(*)` })
                                      .from(advertisements)
                                      .where(ne(advertisements.provider, 'internal'));
      
      const total = parseInt(totalCountResult[0].count.toString());
      
      // Thực hiện truy vấn chính với phân trang
      const ads = await query.limit(pageSize).offset(offset).orderBy(desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainAds = JSON.parse(JSON.stringify(ads));
      
      // Biến đổi dữ liệu để phù hợp với cấu trúc hiện tại của frontend
      const transformedAds = plainAds.map(transformAdData);
      
      res.status(200).json({
        ads: transformedAds,
        total: total.toString(),
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching external ads:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách quảng cáo bên ngoài' });
    }
  });

  // Lấy quảng cáo bên ngoài đang hoạt động
  app.get('/api/external-ads/active', async (req: Request, res: Response) => {
    try {
      const activeExternalAds = await db.select().from(advertisements)
        .where(
          and(
            eq(advertisements.isActive, true),
            ne(advertisements.provider, 'internal')
          )
        )
        .orderBy(desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainAds = JSON.parse(JSON.stringify(activeExternalAds));
      
      // Biến đổi dữ liệu để phù hợp với cấu trúc hiện tại của frontend
      const transformedAds = plainAds.map(transformAdData);
      
      res.status(200).json(transformedAds);
    } catch (error) {
      console.error('Error fetching active external ads:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách quảng cáo bên ngoài đang hoạt động' });
    }
  });
  
  // Tạo quảng cáo bên ngoài mới
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
      
      const newExternalAd = {
        title: name,
        imageUrl: '',
        targetUrl: '#',
        position,
        provider,
        displayOrder: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Mặc định là 1 năm
        isActive: isActive !== undefined ? isActive : true,
        views: 0,
        clicks: 0,
        width: width || null,
        height: height || null,
        metadata: JSON.stringify(metadata),
      };
      
      const [ad] = await db.insert(advertisements).values(newExternalAd).returning();
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResult = JSON.parse(JSON.stringify(ad));
      
      // Biến đổi kết quả để tương thích với cấu trúc hiện tại của frontend
      const transformedAd = transformAdData(plainResult);
      
      res.status(201).json(transformedAd);
    } catch (error) {
      console.error('Error creating external ad config:', error);
      res.status(500).json({ error: 'Không thể tạo cấu hình quảng cáo bên ngoài' });
    }
  });

  // Cập nhật cấu hình quảng cáo bên ngoài
  app.put('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const {
        name, provider, scriptContent, position,
        adUnitId, slotId, publisherId, isActive,
        cssSelector, cssStyles, width, height,
        format, isMobileEnabled
      } = req.body;
      
      // Lấy quảng cáo hiện tại
      const [currentAd] = await db.select().from(advertisements).where(eq(advertisements.id, id));
      
      if (!currentAd) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo bên ngoài' });
      }
      
      // Phân tích metadata hiện tại
      let currentMetadata = {};
      try {
        if (currentAd.metadata) {
          if (typeof currentAd.metadata === 'string') {
            currentMetadata = JSON.parse(currentAd.metadata);
          } else {
            currentMetadata = currentAd.metadata;
          }
        }
      } catch (e) {
        console.error('Error parsing current metadata:', e);
      }
      
      // Cập nhật metadata
      const metadata = {
        ...currentMetadata,
        scriptContent: scriptContent !== undefined ? scriptContent : currentMetadata.scriptContent,
        adUnitId: adUnitId !== undefined ? adUnitId : currentMetadata.adUnitId,
        slotId: slotId !== undefined ? slotId : currentMetadata.slotId,
        publisherId: publisherId !== undefined ? publisherId : currentMetadata.publisherId,
        cssSelector: cssSelector !== undefined ? cssSelector : currentMetadata.cssSelector,
        cssStyles: cssStyles !== undefined ? cssStyles : currentMetadata.cssStyles,
        format: format !== undefined ? format : currentMetadata.format,
        isMobileEnabled: isMobileEnabled !== undefined ? isMobileEnabled : currentMetadata.isMobileEnabled
      };
      
      const updateData = {
        title: name || currentAd.title,
        position: position || currentAd.position,
        provider: provider || currentAd.provider,
        isActive: isActive !== undefined ? isActive : currentAd.isActive,
        width: width !== undefined ? width : currentAd.width,
        height: height !== undefined ? height : currentAd.height,
        metadata: JSON.stringify(metadata),
      };
      
      const [updatedAd] = await db.update(advertisements)
                                  .set(updateData)
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResult = JSON.parse(JSON.stringify(updatedAd));
      
      // Biến đổi kết quả để tương thích với cấu trúc hiện tại của frontend
      const transformedAd = transformAdData(plainResult);
      
      res.status(200).json(transformedAd);
    } catch (error) {
      console.error('Error updating external ad config:', error);
      res.status(500).json({ error: 'Không thể cập nhật cấu hình quảng cáo bên ngoài' });
    }
  });

  // Xóa cấu hình quảng cáo bên ngoài
  app.delete('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const [deletedAd] = await db.delete(advertisements)
                                  .where(eq(advertisements.id, id))
                                  .returning();
      
      if (!deletedAd) {
        return res.status(404).json({ error: 'Không tìm thấy quảng cáo bên ngoài' });
      }
      
      res.status(200).json({ message: 'Quảng cáo bên ngoài đã được xóa', id });
    } catch (error) {
      console.error('Error deleting external ad config:', error);
      res.status(500).json({ error: 'Không thể xóa cấu hình quảng cáo bên ngoài' });
    }
  });
}