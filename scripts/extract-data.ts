import { 
  users, 
  genres, 
  authors, 
  translationGroups, 
  content, 
  contentGenres, 
  chapters,
  chapterContent,
  payments,
  paymentSettings,
  advertisements,
  comments,
  reports,
  readingHistory,
  userFavorites,
  unlockedChapters
} from "../shared/schema";
import { db } from "../server/db";
import { eq } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

// Function để trả về giá trị an toàn JSON
function safeJSON(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(safeJSON);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = safeJSON(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

// Hàm để lưu dữ liệu vào file
function saveToFile(fileName: string, data: any) {
  const dir = path.join(__dirname, 'backup');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(safeJSON(data), null, 2));
  console.log(`✅ Đã lưu dữ liệu vào ${filePath}`);
}

async function exportData() {
  console.log("🔄 Bắt đầu trích xuất dữ liệu từ cơ sở dữ liệu...");
  
  try {
    // Kiểm tra kết nối database
    console.log("🔍 Kiểm tra kết nối cơ sở dữ liệu...");
    await db.select().from(users).limit(1);
    console.log("✅ Kết nối cơ sở dữ liệu thành công!");
    
    // Trích xuất dữ liệu từng bảng
    console.log("🔄 Đang trích xuất dữ liệu người dùng...");
    const allUsers = await db.select().from(users);
    saveToFile('users.json', allUsers);
    
    console.log("🔄 Đang trích xuất dữ liệu thể loại...");
    const allGenres = await db.select().from(genres);
    saveToFile('genres.json', allGenres);
    
    console.log("🔄 Đang trích xuất dữ liệu tác giả...");
    const allAuthors = await db.select().from(authors);
    saveToFile('authors.json', allAuthors);
    
    console.log("🔄 Đang trích xuất dữ liệu nhóm dịch...");
    const allGroups = await db.select().from(translationGroups);
    saveToFile('translation_groups.json', allGroups);
    
    console.log("🔄 Đang trích xuất dữ liệu truyện...");
    const allContent = await db.select().from(content);
    saveToFile('content.json', allContent);
    
    console.log("🔄 Đang trích xuất dữ liệu liên kết thể loại-truyện...");
    const allContentGenres = await db.select().from(contentGenres);
    saveToFile('content_genres.json', allContentGenres);
    
    console.log("🔄 Đang trích xuất dữ liệu chương truyện...");
    const allChapters = await db.select().from(chapters);
    saveToFile('chapters.json', allChapters);
    
    console.log("🔄 Đang trích xuất dữ liệu nội dung chương...");
    const allChapterContent = await db.select().from(chapterContent);
    saveToFile('chapter_content.json', allChapterContent);
    
    console.log("🔄 Đang trích xuất dữ liệu thanh toán...");
    const allPayments = await db.select().from(payments);
    saveToFile('payments.json', allPayments);
    
    console.log("🔄 Đang trích xuất dữ liệu cài đặt thanh toán...");
    const allPaymentSettings = await db.select().from(paymentSettings);
    saveToFile('payment_settings.json', allPaymentSettings);
    
    console.log("🔄 Đang trích xuất dữ liệu quảng cáo...");
    const allAds = await db.select().from(advertisements);
    saveToFile('advertisements.json', allAds);
    
    console.log("🔄 Đang trích xuất dữ liệu bình luận...");
    const allComments = await db.select().from(comments);
    saveToFile('comments.json', allComments);
    
    console.log("🔄 Đang trích xuất dữ liệu báo cáo...");
    const allReports = await db.select().from(reports);
    saveToFile('reports.json', allReports);
    
    console.log("🔄 Đang trích xuất dữ liệu lịch sử đọc...");
    const allReadingHistory = await db.select().from(readingHistory);
    saveToFile('reading_history.json', allReadingHistory);
    
    console.log("🔄 Đang trích xuất dữ liệu truyện yêu thích...");
    const allFavorites = await db.select().from(userFavorites);
    saveToFile('user_favorites.json', allFavorites);
    
    console.log("🔄 Đang trích xuất dữ liệu chương đã mở khóa...");
    const allUnlockedChapters = await db.select().from(unlockedChapters);
    saveToFile('unlocked_chapters.json', allUnlockedChapters);
    
    // Tạo file tổng hợp
    console.log("🔄 Đang tạo file SQL để tái tạo dữ liệu...");
    
    // Tạo SQL để tái tạo
    let sqlScript = `-- Script tự động tạo từ script extract-data.ts
-- Ngày tạo: ${new Date().toISOString()}
-- Lưu ý: Chạy script này sẽ XÓA dữ liệu hiện có và thay thế bằng dữ liệu sao lưu

-- Tạo lại enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE content_type AS ENUM ('manga', 'novel');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
    CREATE TYPE status AS ENUM ('ongoing', 'completed', 'hiatus');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'credit_card', 'e_wallet', 'payos');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_position') THEN
    CREATE TYPE ad_position AS ENUM ('banner', 'sidebar', 'popup');
  END IF;
END
$$;

-- Xóa dữ liệu hiện có để tránh conflict
TRUNCATE TABLE unlocked_chapters CASCADE;
TRUNCATE TABLE user_favorites CASCADE;
TRUNCATE TABLE reading_history CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE chapter_content CASCADE;
TRUNCATE TABLE chapters CASCADE;
TRUNCATE TABLE content_genres CASCADE;
TRUNCATE TABLE content CASCADE;
TRUNCATE TABLE translation_groups CASCADE;
TRUNCATE TABLE authors CASCADE;
TRUNCATE TABLE genres CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE advertisements CASCADE;
TRUNCATE TABLE payment_settings CASCADE;
TRUNCATE TABLE users CASCADE;

-- Thiết lập sequence cho từng bảng
`;

    // Thêm các lệnh tái tạo dữ liệu
    sqlScript += `\n-- Đoạn script dưới đây sẽ được tự động tạo từ dữ liệu đã trích xuất...\n`;
    sqlScript += `-- Bạn có thể dùng tool sau để tạo INSERT statement từ file JSON đã sao lưu:\n`;
    sqlScript += `-- https://www.convertjson.com/json-to-sql.htm\n`;

    saveToFile('recreate_database.sql', sqlScript);

    console.log("✅ Hoàn thành quá trình trích xuất dữ liệu!");
    console.log("📊 Thông tin tổng quan:");
    
    console.log(`👤 Số lượng người dùng: ${allUsers.length}`);
    console.log(`📚 Số lượng truyện: ${allContent.length}`);
    console.log(`📑 Số lượng chapter: ${allChapters.length}`);
    console.log(`💰 Số lượng giao dịch: ${allPayments.length}`);
    
    console.log(`📁 Tất cả dữ liệu đã được lưu vào thư mục: ${path.join(__dirname, 'backup')}`);
    
  } catch (error) {
    console.error("❌ Lỗi khi trích xuất dữ liệu:", error);
  }
}

// Chạy script
exportData()
  .then(() => {
    console.log("🎉 Script thực thi thành công!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script gặp lỗi:", error);
    process.exit(1);
  });