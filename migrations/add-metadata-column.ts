import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Migration để thêm cột metadata vào bảng advertisements
 */
async function addMetadataColumn() {
  console.log("Bắt đầu thêm cột metadata vào bảng advertisements...");
  
  try {
    // Kiểm tra xem cột có tồn tại chưa
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='advertisements' AND column_name='metadata'
    `);
    
    if (checkResult.rows.length === 0) {
      // Nếu cột chưa tồn tại, thêm vào
      await db.execute(sql`
        ALTER TABLE advertisements
        ADD COLUMN metadata JSONB
      `);
      console.log("Đã thêm cột metadata vào bảng advertisements");
    } else {
      console.log("Cột metadata đã tồn tại trong bảng advertisements");
    }
    
    console.log("Hoàn tất migration!");
  } catch (error) {
    console.error("Lỗi khi thêm cột:", error);
  }
}

// Chạy migration
addMetadataColumn().then(() => {
  console.log("Migration hoàn tất");
  process.exit(0);
}).catch(err => {
  console.error("Migration lỗi:", err);
  process.exit(1);
});