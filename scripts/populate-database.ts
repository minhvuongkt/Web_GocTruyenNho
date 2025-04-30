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
  advertisements
} from "../shared/schema";
import { db, pool } from "../server/db";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function populateDatabase() {
  console.log("🔄 Bắt đầu tạo cơ sở dữ liệu và dữ liệu mẫu...");

  try {
    // Kiểm tra kết nối database
    console.log("🔍 Kiểm tra kết nối cơ sở dữ liệu...");
    await db.select().from(users).limit(1);
    console.log("✅ Kết nối cơ sở dữ liệu thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối cơ sở dữ liệu:", error);
    console.log("🔄 Đang tạo cấu trúc cơ sở dữ liệu...");
    
    // Sử dụng raw SQL để tạo enum types trước
    const client = await pool.connect();
    try {
      // Tạo enum types
      await client.query(`
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
      `);
      console.log("✅ Đã tạo enum types");
    } catch (err) {
      console.error("❌ Lỗi khi tạo enum types:", err);
    } finally {
      client.release();
    }
  }

  // Tạo tables sử dụng Drizzle
  console.log("🔄 Đang tạo tables...");

  // Tạo users
  console.log("🔄 Tạo người dùng...");
  const adminPassword = await hashPassword("admin123");
  const userPassword = await hashPassword("user123");
  
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin.length === 0) {
      await db.insert(users).values([
        {
          username: "admin",
          password: adminPassword,
          email: "admin@example.com",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
          balance: 1000000,
          isActive: true,
        },
        {
          username: "user",
          password: userPassword,
          email: "user@example.com",
          role: "user",
          firstName: "Normal",
          lastName: "User",
          balance: 50000,
          isActive: true,
        },
      ]);
      console.log("✅ Đã tạo người dùng mẫu");
    } else {
      console.log("ℹ️ Người dùng admin đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo người dùng:", error);
  }

  // Tạo thể loại
  console.log("🔄 Tạo thể loại...");
  try {
    const existingGenres = await db.select().from(genres).limit(1);
    
    if (existingGenres.length === 0) {
      await db.insert(genres).values([
        { name: "Hành động", description: "Thể loại có nhiều cảnh hành động" },
        { name: "Phiêu lưu", description: "Thể loại phiêu lưu, khám phá" },
        { name: "Hài hước", description: "Thể loại có nhiều yếu tố hài hước" },
        { name: "Lãng mạn", description: "Thể loại tình cảm, lãng mạn" },
        { name: "Kinh dị", description: "Thể loại kinh dị, ma quái" },
        { name: "Viễn tưởng", description: "Thể loại khoa học viễn tưởng" },
      ]);
      console.log("✅ Đã tạo các thể loại mẫu");
    } else {
      console.log("ℹ️ Thể loại đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo thể loại:", error);
  }

  // Tạo tác giả
  console.log("🔄 Tạo tác giả...");
  try {
    const existingAuthors = await db.select().from(authors).limit(1);
    
    if (existingAuthors.length === 0) {
      await db.insert(authors).values([
        { name: "Nguyễn Nhật Ánh", info: "Tác giả truyện thiếu nhi", birthDate: "1955-05-07" },
        { name: "Fujiko F. Fujio", info: "Tác giả Doraemon", birthDate: "1933-12-01" },
        { name: "Eiichiro Oda", info: "Tác giả One Piece", birthDate: "1975-01-01" },
      ]);
      console.log("✅ Đã tạo các tác giả mẫu");
    } else {
      console.log("ℹ️ Tác giả đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo tác giả:", error);
  }

  // Tạo nhóm dịch
  console.log("🔄 Tạo nhóm dịch...");
  try {
    const existingGroups = await db.select().from(translationGroups).limit(1);
    
    if (existingGroups.length === 0) {
      await db.insert(translationGroups).values([
        { name: "LxErs", description: "Nhóm dịch manga" },
        { name: "Kira Team", description: "Nhóm dịch light novel" },
        { name: "VnSharing", description: "Cộng đồng chia sẻ truyện" },
      ]);
      console.log("✅ Đã tạo các nhóm dịch mẫu");
    } else {
      console.log("ℹ️ Nhóm dịch đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm dịch:", error);
  }

  // Tạo content
  console.log("🔄 Tạo nội dung truyện...");
  try {
    const existingContent = await db.select().from(content).limit(1);
    
    if (existingContent.length === 0) {
      const contentItems = [
        {
          title: "Truyện 1",
          alternativeTitles: "Truyện Một, Story One",
          description: "Đây là mô tả cho truyện số 1",
          type: "manga",
          status: "ongoing",
          releaseYear: 2023,
          coverImage: "https://placehold.co/600x800",
          authorId: 1,
          views: 1200,
          rating: 4.5,
          isActive: true,
          isPremium: false,
          translationGroupId: 1,
        },
        {
          title: "Truyện 2",
          alternativeTitles: "Truyện Hai, Story Two",
          description: "Đây là mô tả cho truyện số 2",
          type: "novel",
          status: "completed",
          releaseYear: 2021,
          coverImage: "https://placehold.co/600x800",
          authorId: 2,
          views: 850,
          rating: 4.2,
          isActive: true,
          isPremium: true,
          translationGroupId: 2,
        },
      ];
      
      for (const item of contentItems) {
        const [newContent] = await db.insert(content).values(item).returning({ id: content.id });
        
        // Thêm thể loại cho truyện
        if (newContent.id === 1) {
          await db.insert(contentGenres).values([
            { contentId: newContent.id, genreId: 1 }, // Hành động
            { contentId: newContent.id, genreId: 2 }, // Phiêu lưu
          ]);
        } else if (newContent.id === 2) {
          await db.insert(contentGenres).values([
            { contentId: newContent.id, genreId: 4 }, // Lãng mạn
            { contentId: newContent.id, genreId: 6 }, // Viễn tưởng
          ]);
        }
        
        // Tạo một số chapter cho mỗi truyện
        const chapterCount = newContent.id === 1 ? 5 : 3;
        
        for (let i = 1; i <= chapterCount; i++) {
          const [newChapter] = await db
            .insert(chapters)
            .values({
              contentId: newContent.id,
              number: i,
              title: `Chapter ${i}`,
              views: Math.floor(Math.random() * 500),
              isPremium: i > 3, // Từ chapter 4 trở đi là premium
              price: i > 3 ? 5 : 0, // Chi phí cho chapter premium
              isActive: true,
            })
            .returning({ id: chapters.id });
          
          // Tạo nội dung cho chapter
          await db.insert(chapterContent).values({
            chapterId: newChapter.id,
            content: `Nội dung của chapter ${i} thuộc truyện ${newContent.id}. Đây là nội dung mẫu.`,
          });
        }
      }
      
      console.log("✅ Đã tạo nội dung truyện và chapter mẫu");
    } else {
      console.log("ℹ️ Nội dung truyện đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo nội dung truyện:", error);
  }

  // Tạo giao dịch mẫu
  console.log("🔄 Tạo giao dịch mẫu...");
  try {
    const existingPayments = await db.select().from(payments).limit(1);
    
    if (existingPayments.length === 0) {
      // Tạo một số giao dịch mẫu
      await db.insert(payments).values([
        {
          userId: 1, // admin
          transactionId: "TX" + Date.now().toString().substring(0, 8),
          amount: 100000,
          method: "bank_transfer",
          status: "completed",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
        },
        {
          userId: 2, // user
          transactionId: "TX" + (Date.now() - 100000).toString().substring(0, 8),
          amount: 50000,
          method: "payos",
          status: "completed",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
        },
        {
          userId: 2, // user
          transactionId: "TX" + (Date.now() - 200000).toString().substring(0, 8),
          amount: 25000,
          method: "payos",
          status: "failed",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 ngày trước
        },
      ]);
      console.log("✅ Đã tạo giao dịch mẫu");
    } else {
      console.log("ℹ️ Giao dịch đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo giao dịch mẫu:", error);
  }

  // Tạo cài đặt thanh toán
  console.log("🔄 Tạo cài đặt thanh toán...");
  try {
    const existingSettings = await db.select().from(paymentSettings).limit(1);
    
    if (existingSettings.length === 0) {
      await db.insert(paymentSettings).values({
        bankConfig: {
          enabled: true,
          accountNumber: "0123456789",
          accountName: "CONG TY TNHH GOC TRUYEN NHO",
          bankName: "Vietcombank",
          bankBranch: "Ho Chi Minh",
          transferContent: "NAP_{username}"
        },
        vietQRConfig: {
          enabled: true,
          accountNumber: "0123456789",
          accountName: "CONG TY TNHH GOC TRUYEN NHO",
          bankId: "VCB",
          template: "compact2"
        },
        payosConfig: {
          enabled: true,
          clientId: process.env.PAYOS_CLIENT_ID || "",
          apiKey: process.env.PAYOS_API_KEY || "",
          checksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
          baseUrl: "https://api-merchant.payos.vn"
        },
        priceConfig: {
          coinConversionRate: 1000, // 1000 VND = 1 xu
          minimumDeposit: 10000,
          chapterUnlockPrice: 5,
          discountTiers: [
            { amount: 50000, discountPercent: 5 },
            { amount: 100000, discountPercent: 10 },
            { amount: 200000, discountPercent: 15 },
          ]
        },
        emailConfig: {
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUser: "",
          smtpPass: "",
          senderEmail: "",
          adminEmail: "admin@example.com"
        },
        expiryConfig: {
          bankTransfer: 10, // 10 phút cho chuyển khoản ngân hàng
          payos: 15, // 15 phút cho PayOS
        }
      });
      console.log("✅ Đã tạo cài đặt thanh toán mẫu");
    } else {
      console.log("ℹ️ Cài đặt thanh toán đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo cài đặt thanh toán:", error);
  }

  // Tạo quảng cáo mẫu
  console.log("🔄 Tạo quảng cáo mẫu...");
  try {
    const existingAds = await db.select().from(advertisements).limit(1);
    
    if (existingAds.length === 0) {
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      await db.insert(advertisements).values([
        {
          title: "Banner Quảng Cáo",
          imageUrl: "https://placehold.co/1200x300/orange/white?text=BANNER+QUANG+CAO",
          targetUrl: "https://example.com/promo",
          position: "banner",
          startDate: now,
          endDate: oneMonthLater,
          isActive: true,
          views: 0,
          clicks: 0,
        },
        {
          title: "Quảng Cáo Bên Cạnh",
          imageUrl: "https://placehold.co/300x600/blue/white?text=SIDEBAR+AD",
          targetUrl: "https://example.com/sidebar-promo",
          position: "sidebar",
          startDate: now,
          endDate: oneMonthLater,
          isActive: true,
          views: 0,
          clicks: 0,
        },
      ]);
      console.log("✅ Đã tạo quảng cáo mẫu");
    } else {
      console.log("ℹ️ Quảng cáo đã tồn tại, bỏ qua bước tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo quảng cáo mẫu:", error);
  }

  console.log("✅ Hoàn thành quá trình tạo dữ liệu!");
  console.log("📊 Thông tin tổng quan:");
  
  try {
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    const contentCount = await db.select({ count: sql`count(*)` }).from(content);
    const chapterCount = await db.select({ count: sql`count(*)` }).from(chapters);
    const paymentCount = await db.select({ count: sql`count(*)` }).from(payments);
    
    console.log(`👤 Số lượng người dùng: ${userCount[0]?.count || 0}`);
    console.log(`📚 Số lượng truyện: ${contentCount[0]?.count || 0}`);
    console.log(`📑 Số lượng chapter: ${chapterCount[0]?.count || 0}`);
    console.log(`💰 Số lượng giao dịch: ${paymentCount[0]?.count || 0}`);
  } catch (error) {
    console.error("❌ Lỗi khi lấy thống kê:", error);
  }
}

// Bổ sung sql helper function
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return { strings, values };
}

// Chạy script
populateDatabase()
  .then(() => {
    console.log("🎉 Script thực thi thành công!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script gặp lỗi:", error);
    process.exit(1);
  });