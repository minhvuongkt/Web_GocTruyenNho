import { db } from "../server/db";
import { advertisements, externalAdConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script để gộp dữ liệu từ bảng external_ad_configs vào bảng advertisements
 * Chạy script này sau khi đã cập nhật schema
 */
async function mergeAdTables() {
  console.log("Bắt đầu gộp bảng quảng cáo...");
  
  try {
    // 1. Lấy tất cả external ads
    const externalAds = await db.select().from(externalAdConfigs);
    console.log(`Tìm thấy ${externalAds.length} quảng cáo bên ngoài cần chuyển đổi`);
    
    // 2. Chuyển đổi và chèn từng quảng cáo vào bảng chính
    for (const externalAd of externalAds) {
      // Tạo bản ghi mới cho bảng advertisements
      const newAd = {
        title: externalAd.name,
        imageUrl: "", // Không có hình ảnh cho external ad
        targetUrl: "#", // Không có target URL
        position: externalAd.position,
        provider: externalAd.provider,
        displayOrder: 0, // Giá trị mặc định
        startDate: new Date(), // Ngày hiện tại
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm sau
        isActive: externalAd.isActive,
        views: 0,
        clicks: 0,
        width: externalAd.width || null,
        height: externalAd.height || null,
        // Lưu thông tin quảng cáo ngoài vào metadata
        metadata: JSON.stringify({
          scriptContent: externalAd.scriptContent,
          adUnitId: externalAd.adUnitId,
          slotId: externalAd.slotId,
          publisherId: externalAd.publisherId,
          cssSelector: externalAd.cssSelector,
          cssStyles: externalAd.cssStyles,
          format: externalAd.format,
          isMobileEnabled: externalAd.isMobileEnabled
        })
      };
      
      // Chèn vào bảng advertisements
      const [inserted] = await db.insert(advertisements).values(newAd).returning();
      console.log(`Đã chuyển đổi quảng cáo: ${externalAd.name} (ID: ${inserted.id})`);
    }
    
    console.log("Hoàn tất gộp bảng quảng cáo!");
  } catch (error) {
    console.error("Lỗi khi gộp bảng quảng cáo:", error);
  }
}

// Chạy function
mergeAdTables().then(() => {
  console.log("Script hoàn tất");
  process.exit(0);
}).catch(err => {
  console.error("Script lỗi:", err);
  process.exit(1);
});