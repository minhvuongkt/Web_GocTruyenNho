import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { ensureAdmin } from '../auth-middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { advertisements, externalAdConfigs } from '@shared/schema';
import { db } from '../db';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

// Define upload directory
const uploadDirectory = 'public/uploads';

// Setup storage for ad images
const adStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), uploadDirectory, 'ads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: adStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any);
    }
  }
});

export function registerAdRoutes(app: express.Express) {
  // Routes for internal ads
  
  // Get all ads with pagination and filters
  app.get('/api/ads', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status, position } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 20;
      const offset = (pageNumber - 1) * pageSize;
      
      let query = db.select().from(advertisements);
      
      // Add filters
      if (status === 'active') {
        query = query.where(eq(advertisements.isActive, true));
      } else if (status === 'inactive') {
        query = query.where(eq(advertisements.isActive, false));
      }
      
      if (position) {
        query = query.where(eq(advertisements.position, position as string));
      }
      
      // Get total count for pagination
      const totalCountResult = await db.select({ count: sql`count(*)` }).from(advertisements);
      const totalCount = Number(totalCountResult[0]?.count || 0);
      
      // Get the ads with pagination
      const results = await query.limit(pageSize).offset(offset).orderBy(desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(results));
      
      res.status(200).json({ ads: plainResults, total: totalCount });
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ error: 'Failed to fetch advertisements' });
    }
  });
  
  // Get active ads
  app.get('/api/ads/active', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      const activeAds = await db.select().from(advertisements)
        .where(
          and(
            eq(advertisements.isActive, true),
            lte(advertisements.startDate, now),
            gte(advertisements.endDate, now)
          )
        )
        .orderBy(asc(advertisements.displayOrder), desc(advertisements.id));
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(activeAds));
      
      res.status(200).json(plainResults);
    } catch (error) {
      console.error('Error fetching active ads:', error);
      res.status(500).json({ error: 'Failed to fetch active advertisements' });
    }
  });
  
  // Create a new advertisement
  app.post('/api/ads', ensureAdmin, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { title, targetUrl, position, startDate, endDate, isActive, displayOrder, width, height, displayFrequency } = req.body;
      const imageFile = req.file;
      
      if (!imageFile) {
        return res.status(400).json({ error: 'Image is required' });
      }
      
      // Create relative URL to the uploaded image
      const imageUrl = `/uploads/ads/${imageFile.filename}`;
      
      const newAd = {
        title,
        imageUrl,
        targetUrl,
        position,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        isActive: isActive === 'true',
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        displayFrequency: displayFrequency ? parseInt(displayFrequency) : null,
        views: 0,
        clicks: 0,
      };
      
      const [result] = await db.insert(advertisements).values([newAd]).returning();
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({ error: 'Failed to create advertisement' });
    }
  });
  
  // Update an advertisement
  app.patch('/api/ads/:id', ensureAdmin, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, targetUrl, position, startDate, endDate, isActive, displayOrder, width, height, displayFrequency } = req.body;
      
      const adId = parseInt(id);
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Check if ad exists
      const existingAd = await db.select().from(advertisements).where(eq(advertisements.id, adId)).limit(1);
      if (existingAd.length === 0) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }
      
      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title;
      if (targetUrl !== undefined) updateData.targetUrl = targetUrl;
      if (position !== undefined) updateData.position = position;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
      if (width !== undefined) updateData.width = width ? parseInt(width) : null;
      if (height !== undefined) updateData.height = height ? parseInt(height) : null;
      if (displayFrequency !== undefined) updateData.displayFrequency = displayFrequency ? parseInt(displayFrequency) : null;
      
      // Handle image update if provided
      if (req.file) {
        updateData.imageUrl = `/uploads/ads/${req.file.filename}`;
      }
      
      // Update the ad
      const [updatedAd] = await db.update(advertisements)
        .set(updateData)
        .where(eq(advertisements.id, adId))
        .returning();
      
      res.status(200).json(updatedAd);
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({ error: 'Failed to update advertisement' });
    }
  });
  
  // Delete an advertisement
  app.delete('/api/ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adId = parseInt(id);
      
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Check if ad exists and get image URL to delete file
      const existingAd = await db.select().from(advertisements).where(eq(advertisements.id, adId)).limit(1);
      if (existingAd.length === 0) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }
      
      // Delete the ad from database
      await db.delete(advertisements).where(eq(advertisements.id, adId));
      
      // Attempt to remove the image file if it exists
      const imageUrl = existingAd[0].imageUrl;
      if (imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      res.status(200).json({ success: true, message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({ error: 'Failed to delete advertisement' });
    }
  });
  
  // Update ad views
  app.post('/api/ads/:id/view', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adId = parseInt(id);
      
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Increment views count
      // First get current views
      const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, adId));
      if (!ad) {
        return res.status(404).json({ error: 'Ad not found' });
      }
      
      // Then increment
      const [updatedAd] = await db.update(advertisements)
        .set({ views: ad.views + 1 })
        .where(eq(advertisements.id, adId))
        .returning();
      
      res.status(200).json({ success: true, views: updatedAd.views });
    } catch (error) {
      console.error('Error updating ad views:', error);
      res.status(500).json({ error: 'Failed to update ad views' });
    }
  });
  
  // Update ad clicks
  app.post('/api/ads/:id/click', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adId = parseInt(id);
      
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Increment clicks count
      // First get current clicks
      const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, adId));
      if (!ad) {
        return res.status(404).json({ error: 'Ad not found' });
      }
      
      // Then increment
      const [updatedAd] = await db.update(advertisements)
        .set({ clicks: ad.clicks + 1 })
        .where(eq(advertisements.id, adId))
        .returning();
      
      res.status(200).json({ success: true, clicks: updatedAd.clicks });
    } catch (error) {
      console.error('Error updating ad clicks:', error);
      res.status(500).json({ error: 'Failed to update ad clicks' });
    }
  });
  
  // Routes for external ads (from third party providers)
  
  // Get all external ad configs
  app.get('/api/external-ads', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status, position, provider } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 20;
      const offset = (pageNumber - 1) * pageSize;
      
      let query = db.select().from(externalAdConfigs);
      
      // Add filters
      if (status === 'active') {
        query = query.where(eq(externalAdConfigs.isActive, true));
      } else if (status === 'inactive') {
        query = query.where(eq(externalAdConfigs.isActive, false));
      }
      
      if (position) {
        query = query.where(eq(externalAdConfigs.position, position as string));
      }
      
      if (provider) {
        query = query.where(eq(externalAdConfigs.provider, provider as string));
      }
      
      // Get total count for pagination
      const totalCountResult = await db.select({ count: sql`count(*)` }).from(externalAdConfigs);
      const totalCount = Number(totalCountResult[0]?.count || 0);
      
      // Get the external ads with pagination
      const results = await query.limit(pageSize).offset(offset).orderBy(desc(externalAdConfigs.id));
      
      // Transform results to plain objects to avoid circular references
      const plainResults = JSON.parse(JSON.stringify(results));
      
      res.status(200).json({ ads: plainResults, total: totalCount });
    } catch (error) {
      console.error('Error fetching external ads:', error);
      res.status(500).json({ error: 'Failed to fetch external ad configurations' });
    }
  });
  
  // Get active external ads
  app.get('/api/external-ads/active', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      const activeExternalAds = await db.select().from(externalAdConfigs)
        .where(
          and(
            eq(externalAdConfigs.isActive, true),
            // Check start date if exists
            lte(externalAdConfigs.startDate || new Date(0), now),
            // Check end date if exists 
            gte(externalAdConfigs.endDate || new Date('2099-12-31'), now)
          )
        )
        // Order by displayOrder field
        .orderBy(asc(externalAdConfigs.id))
      
      // Chuyển đổi kết quả thành JSON thuần để tránh lỗi cấu trúc vòng
      const plainResults = JSON.parse(JSON.stringify(activeExternalAds));
      
      res.status(200).json(plainResults);
    } catch (error) {
      console.error('Error fetching active external ads:', error);
      res.status(500).json({ error: 'Failed to fetch active external ad configurations' });
    }
  });
  
  // Create a new external ad config
  app.post('/api/external-ads', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        name, 
        provider, 
        position, 
        scriptContent, 
        containerId,
        isActive, 
        height, 
        width, 
        displayOrder, 
        startDate, 
        endDate,
        isMobileEnabled 
      } = req.body;
      
      const newExternalAd = {
        name,
        provider,
        position,
        scriptContent,
        containerId,
        isActive: isActive === 'true' || isActive === true,
        height: height ? parseInt(height) : null,
        width: width ? parseInt(width) : null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isMobileEnabled: isMobileEnabled === 'true' || isMobileEnabled === true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [result] = await db.insert(externalAdConfigs).values(newExternalAd).returning();
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating external ad config:', error);
      res.status(500).json({ error: 'Failed to create external ad configuration' });
    }
  });
  
  // Update an external ad config
  app.patch('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        name, 
        provider, 
        position, 
        scriptContent, 
        containerId,
        isActive, 
        height, 
        width, 
        displayOrder, 
        startDate, 
        endDate,
        isMobileEnabled 
      } = req.body;
      
      const adId = parseInt(id);
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Check if external ad config exists
      const existingExternalAd = await db.select().from(externalAdConfigs).where(eq(externalAdConfigs.id, adId)).limit(1);
      if (existingExternalAd.length === 0) {
        return res.status(404).json({ error: 'External ad configuration not found' });
      }
      
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (name !== undefined) updateData.name = name;
      if (provider !== undefined) updateData.provider = provider;
      if (position !== undefined) updateData.position = position;
      if (scriptContent !== undefined) updateData.scriptContent = scriptContent;
      if (containerId !== undefined) updateData.containerId = containerId;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (height !== undefined) updateData.height = height ? parseInt(height) : null;
      if (width !== undefined) updateData.width = width ? parseInt(width) : null;
      if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (isMobileEnabled !== undefined) updateData.isMobileEnabled = isMobileEnabled === 'true' || isMobileEnabled === true;
      
      // Update the external ad config
      const [updatedExternalAd] = await db.update(externalAdConfigs)
        .set(updateData)
        .where(eq(externalAdConfigs.id, adId))
        .returning();
      
      res.status(200).json(updatedExternalAd);
    } catch (error) {
      console.error('Error updating external ad config:', error);
      res.status(500).json({ error: 'Failed to update external ad configuration' });
    }
  });
  
  // Delete an external ad config
  app.delete('/api/external-ads/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adId = parseInt(id);
      
      if (isNaN(adId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      // Check if external ad config exists
      const existingExternalAd = await db.select().from(externalAdConfigs).where(eq(externalAdConfigs.id, adId)).limit(1);
      if (existingExternalAd.length === 0) {
        return res.status(404).json({ error: 'External ad configuration not found' });
      }
      
      // Delete the external ad config from database
      await db.delete(externalAdConfigs).where(eq(externalAdConfigs.id, adId));
      
      res.status(200).json({ success: true, message: 'External ad configuration deleted successfully' });
    } catch (error) {
      console.error('Error deleting external ad config:', error);
      res.status(500).json({ error: 'Failed to delete external ad configuration' });
    }
  });
}