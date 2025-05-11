import express, { Request, Response } from 'express';
import { Storage } from '../storage';
import { adPositionEnum, adProviderEnum, insertExternalAdConfigSchema } from '@shared/schema';

/**
 * Đăng ký các routes liên quan đến quảng cáo
 * @param app Express application
 * @param storage Storage interface
 */
export function registerAdRoutes(app: express.Express, storage: Storage) {
  // Lấy danh sách tất cả quảng cáo (chủ yếu dùng cho admin)
  app.get('/api/ads', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const position = req.query.position as string;
      const status = req.query.status as 'active' | 'inactive';
      
      const result = await storage.getAdvertisements({
        page,
        limit,
        position: position as any,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      res.status(500).json({ error: 'Failed to fetch advertisements' });
    }
  });

  // Lấy danh sách quảng cáo đang hoạt động
  app.get('/api/ads/active', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const ads = await storage.getActiveAds(now);
      res.json(ads);
    } catch (error) {
      console.error('Error fetching active advertisements:', error);
      res.status(500).json({ error: 'Failed to fetch active advertisements' });
    }
  });

  // Lấy thông tin chi tiết một quảng cáo
  app.get('/api/ads/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ad = await storage.getAdvertisement(id);
      
      if (!ad) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }
      
      res.json(ad);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      res.status(500).json({ error: 'Failed to fetch advertisement details' });
    }
  });

  // Tạo quảng cáo mới
  app.post('/api/ads', async (req: Request, res: Response) => {
    try {
      // Kiểm tra quyền admin
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const { position, title, imageUrl, targetUrl, startDate, endDate, isActive, displayFrequency } = req.body;
      
      // Validate position
      if (!Object.values(adPositionEnum.enumValues).includes(position)) {
        return res.status(400).json({ error: 'Invalid position' });
      }
      
      // Create advertisement
      const ad = await storage.createAdvertisement({
        title,
        imageUrl,
        targetUrl,
        position,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive === undefined ? true : isActive,
        displayFrequency,
        displayOrder: 0,
        views: 0,
        clicks: 0,
      });
      
      res.status(201).json(ad);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      res.status(500).json({ error: 'Failed to create advertisement' });
    }
  });

  // Cập nhật thông tin quảng cáo
  app.put('/api/ads/:id', async (req: Request, res: Response) => {
    try {
      // Kiểm tra quyền admin
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const { position, title, imageUrl, targetUrl, startDate, endDate, isActive, displayFrequency } = req.body;
      
      // Validate position
      if (position && !Object.values(adPositionEnum.enumValues).includes(position)) {
        return res.status(400).json({ error: 'Invalid position' });
      }
      
      // Update advertisement
      const ad = await storage.updateAdvertisement(id, {
        title,
        imageUrl,
        targetUrl,
        position,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        displayFrequency,
      });
      
      if (!ad) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }
      
      res.json(ad);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ error: 'Failed to update advertisement' });
    }
  });

  // Xóa quảng cáo
  app.delete('/api/ads/:id', async (req: Request, res: Response) => {
    try {
      // Kiểm tra quyền admin
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteAdvertisement(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Advertisement not found or could not be deleted' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ error: 'Failed to delete advertisement' });
    }
  });

  // Ghi nhận khi quảng cáo được xem 
  app.post('/api/ads/:id/view', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementAdViews(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording ad view:', error);
      res.status(500).json({ error: 'Failed to record view' });
    }
  });

  // Ghi nhận khi quảng cáo được click
  app.post('/api/ads/:id/click', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementAdClicks(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording ad click:', error);
      res.status(500).json({ error: 'Failed to record click' });
    }
  });

  // ===== EXTERNAL ADS ENDPOINTS =====

  // Get all external ad configs (admin)
  app.get('/api/external-ads', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getAllExternalAdConfigs(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching external ad configs:', error);
      res.status(500).json({ error: 'Failed to fetch external ad configurations' });
    }
  });

  // Get active external ad configs (for client-side rendering)
  app.get('/api/external-ads/active', async (req: Request, res: Response) => {
    try {
      const configs = await storage.getActiveExternalAdConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching active external ad configs:', error);
      res.status(500).json({ error: 'Failed to fetch active external ad configurations' });
    }
  });

  // Get specific external ad config
  app.get('/api/external-ads/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getExternalAdConfig(id);
      
      if (!config) {
        return res.status(404).json({ error: 'External ad configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Error fetching external ad config:', error);
      res.status(500).json({ error: 'Failed to fetch external ad configuration' });
    }
  });

  // Create new external ad config
  app.post('/api/external-ads', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const { provider, position, name, scriptContent, containerId, isActive } = req.body;
      
      // Validate provider
      if (!Object.values(adProviderEnum.enumValues).includes(provider)) {
        return res.status(400).json({ error: 'Invalid ad provider' });
      }
      
      // Validate position
      if (!Object.values(adPositionEnum.enumValues).includes(position)) {
        return res.status(400).json({ error: 'Invalid position' });
      }
      
      // Validate required fields
      if (!name || !scriptContent) {
        return res.status(400).json({ error: 'Name and script content are required' });
      }
      
      // Validate with schema
      try {
        insertExternalAdConfigSchema.parse({
          provider,
          position,
          name,
          scriptContent,
          containerId,
          isActive: isActive !== undefined ? isActive : true
        });
      } catch (validationError) {
        return res.status(400).json({ error: 'Invalid data', details: validationError });
      }
      
      // Create external ad config
      const config = await storage.createExternalAdConfig({
        provider,
        position,
        name,
        scriptContent,
        containerId,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating external ad config:', error);
      res.status(500).json({ error: 'Failed to create external ad configuration' });
    }
  });

  // Update external ad config
  app.put('/api/external-ads/:id', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const { provider, position, name, scriptContent, containerId, isActive } = req.body;
      
      // Validate provider if provided
      if (provider && !Object.values(adProviderEnum.enumValues).includes(provider)) {
        return res.status(400).json({ error: 'Invalid ad provider' });
      }
      
      // Validate position if provided
      if (position && !Object.values(adPositionEnum.enumValues).includes(position)) {
        return res.status(400).json({ error: 'Invalid position' });
      }
      
      // Update external ad config
      const config = await storage.updateExternalAdConfig(id, {
        provider,
        position,
        name,
        scriptContent,
        containerId,
        isActive,
      });
      
      if (!config) {
        return res.status(404).json({ error: 'External ad configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Error updating external ad config:', error);
      res.status(500).json({ error: 'Failed to update external ad configuration' });
    }
  });

  // Delete external ad config
  app.delete('/api/external-ads/:id', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated || !req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteExternalAdConfig(id);
      
      if (!success) {
        return res.status(404).json({ error: 'External ad configuration not found or could not be deleted' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting external ad config:', error);
      res.status(500).json({ error: 'Failed to delete external ad configuration' });
    }
  });
}