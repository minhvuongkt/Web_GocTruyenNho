import { pool } from "../server/db";

async function resetDatabase() {
  console.log("⚠️ Bắt đầu quá trình xóa tất cả dữ liệu trong cơ sở dữ liệu...");
  
  try {
    const client = await pool.connect();
    
    try {
      // Bắt đầu transaction
      await client.query('BEGIN');
      
      console.log("🔄 Xóa tất cả dữ liệu từ tất cả các bảng...");
      
      // Danh sách các bảng cần xóa theo thứ tự phù hợp (để tránh lỗi khóa ngoại)
      const tables = [
        "unlocked_chapters",
        "user_favorites",
        "reading_history",
        "reports",
        "comments",
        "chapter_content",
        "chapters",
        "content_genres",
        "content",
        "translation_groups",
        "authors",
        "genres",
        "payments",
        "advertisements",
        "payment_settings",
        "sessions",
        "users"
      ];
      
      // Tắt tạm thời các ràng buộc khóa ngoại
      await client.query('SET CONSTRAINTS ALL DEFERRED');
      
      // Xóa dữ liệu từ tất cả các bảng
      for (const table of tables) {
        try {
          await client.query(`TRUNCATE TABLE ${table} CASCADE`);
          console.log(`✅ Đã xóa dữ liệu từ bảng ${table}`);
        } catch (err) {
          console.warn(`⚠️ Không thể xóa bảng ${table}: ${err.message}`);
        }
      }
      
      // Reset tất cả các sequence
      console.log("🔄 Đặt lại các sequence ID...");
      
      const sequencesResult = await client.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
      `);
      
      for (const row of sequencesResult.rows) {
        const sequenceName = row.sequence_name;
        try {
          await client.query(`ALTER SEQUENCE ${sequenceName} RESTART WITH 1`);
          console.log(`✅ Đã đặt lại sequence ${sequenceName}`);
        } catch (err) {
          console.warn(`⚠️ Không thể đặt lại sequence ${sequenceName}: ${err.message}`);
        }
      }
      
      // Kết thúc transaction
      await client.query('COMMIT');
      console.log("✅ Đã xóa thành công tất cả dữ liệu từ cơ sở dữ liệu");
      
    } catch (err) {
      // Rollback nếu có lỗi
      await client.query('ROLLBACK');
      console.error("❌ Lỗi trong quá trình xóa dữ liệu:", err);
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error("❌ Lỗi kết nối cơ sở dữ liệu:", error);
    throw error;
  }
}

// Chạy script chỉ khi được gọi trực tiếp
if (require.main === module) {
  // Yêu cầu xác nhận từ người dùng
  process.stdout.write("⚠️  CẢNH BÁO: Script này sẽ XÓA TẤT CẢ DỮ LIỆU trong cơ sở dữ liệu.\n");
  process.stdout.write("⚠️  Đảm bảo bạn đã sao lưu dữ liệu quan trọng trước khi tiếp tục.\n");
  process.stdout.write("⚠️  Nhập 'DELETE' để xác nhận: ");
  
  process.stdin.once('data', async (data) => {
    const input = data.toString().trim();
    
    if (input === 'DELETE') {
      try {
        await resetDatabase();
        console.log("🎉 Reset cơ sở dữ liệu thành công!");
        process.exit(0);
      } catch (error) {
        console.error("❌ Reset cơ sở dữ liệu thất bại:", error);
        process.exit(1);
      }
    } else {
      console.log("❌ Hủy thao tác xóa dữ liệu.");
      process.exit(0);
    }
  });
} else {
  // Xuất hàm để có thể sử dụng trong các script khác
  module.exports = resetDatabase;
}