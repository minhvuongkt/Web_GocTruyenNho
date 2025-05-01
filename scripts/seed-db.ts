import { db } from "../server/db";
import {
  users,
  genres,
  authors,
  translationGroups,
  content,
  contentGenres,
  chapters,
  chapterContent,
  paymentSettings,
  type InsertUser,
  type InsertGenre,
  type InsertAuthor,
  type InsertTranslationGroup,
  type InsertContent,
  type InsertChapter,
  type InsertChapterContent,
  type InsertPaymentSettings,
} from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Starting database seeding process...");

  try {
    // Create admin user
    const adminPassword = await hashPassword("admin123");
    const adminUser: InsertUser = {
      username: "admin",
      password: adminPassword,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
    };

    // Create regular user
    const userPassword = await hashPassword("user123");
    const regularUser: InsertUser = {
      username: "user",
      password: userPassword,
      email: "user@example.com",
      firstName: "Regular",
      lastName: "User",
      role: "user",
      isActive: true,
    };

    // Check if users already exist
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"));

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "user"));

    if (existingAdmin.length === 0) {
      await db.insert(users).values(adminUser);
      console.log("✅ Admin user created");
    } else {
      console.log("📝 Admin user already exists, skipping creation");
    }

    if (existingUser.length === 0) {
      await db.insert(users).values(regularUser);
      console.log("✅ Regular user created");
    } else {
      console.log("📝 Regular user already exists, skipping creation");
    }

    // Add genres
    const genresList: InsertGenre[] = [
      {
        name: "Action",
        description: "Stories with high energy and physical activity",
      },
      {
        name: "Romance",
        description: "Stories that focus on relationships and love",
      },
      {
        name: "Fantasy",
        description: "Stories with magical or supernatural elements",
      },
      {
        name: "Sci-Fi",
        description: "Stories based on scientific theories and technology",
      },
      {
        name: "Horror",
        description: "Stories designed to frighten or scare readers",
      },
      {
        name: "Comedy",
        description: "Humorous stories meant to entertain and amuse",
      },
      {
        name: "Drama",
        description: "Stories with conflicts and emotional elements",
      },
      {
        name: "Mystery",
        description:
          "Stories involving secrets, puzzles, or unsolved questions",
      },
    ];

    for (const genre of genresList) {
      const existingGenre = await db
        .select()
        .from(genres)
        .where(eq(genres.name, genre.name));

      if (existingGenre.length === 0) {
        await db.insert(genres).values(genre);
        console.log(`✅ Genre "${genre.name}" created`);
      } else {
        console.log(
          `📝 Genre "${genre.name}" already exists, skipping creation`,
        );
      }
    }

    // Add authors
    const authorsList: InsertAuthor[] = [
      {
        name: "Haruki Murakami",
        info: "Famous Japanese author",
        birthDate: "January 12, 1949",
      },
      {
        name: "J.K. Rowling",
        info: "Author of Harry Potter series",
        birthDate: "July 31, 1965",
      },
      {
        name: "George R.R. Martin",
        info: "Author of Game of Thrones",
        birthDate: "September 20, 1948",
      },
      {
        name: "Eiichiro Oda",
        info: "Creator of One Piece",
        birthDate: "January 1, 1975",
      },
    ];

    for (const author of authorsList) {
      const existingAuthor = await db
        .select()
        .from(authors)
        .where(eq(authors.name, author.name));

      if (existingAuthor.length === 0) {
        await db.insert(authors).values(author);
        console.log(`✅ Author "${author.name}" created`);
      } else {
        console.log(
          `📝 Author "${author.name}" already exists, skipping creation`,
        );
      }
    }

    // Add translation groups
    const translationGroupsList: InsertTranslationGroup[] = [
      {
        name: "ScanTrad",
        description: "Expert manga translation group",
        foundedDate: "2015",
      },
      {
        name: "NovelGroup",
        description: "Light novel translation team",
        foundedDate: "2018",
      },
    ];

    for (const group of translationGroupsList) {
      const existingGroup = await db
        .select()
        .from(translationGroups)
        .where(eq(translationGroups.name, group.name));

      if (existingGroup.length === 0) {
        await db.insert(translationGroups).values(group);
        console.log(`✅ Translation group "${group.name}" created`);
      } else {
        console.log(
          `📝 Translation group "${group.name}" already exists, skipping creation`,
        );
      }
    }

    // Add sample payment settings
    const existingSettings = await db.select().from(paymentSettings);

    if (existingSettings.length === 0) {
      const defaultSettings: InsertPaymentSettings = {
        bankConfig: {
          enabled: false,
          accountNumber: "0862713897",
          accountName: "Mèo Đi Dịch Truyện",
          bankName: "MB Bank",
          bankBranch: "None",
          transferContent: "NAP {username}",
        },
        vietQRConfig: {
          enabled: true,
          accountNumber: "0862713897",
          accountName: "Mèo Đi Dịch Truyện",
          bankId: "970422",
          template: "NAP {username}",
        },
        payosConfig: {
          enabled: true,
          apiKey: "76c46446-fd4b-4cab-a2b4-7330b4ea1086",
          clientId: "0e1f0f43-3be6-41b0-860c-b2866f1b635b",
          checksumKey:
            "1e1357c5f332d8af06b66a6a8e084940f06cc8076c38c236adbed0393a24a7a5",
          baseUrl: "https://api-merchant.payos.vn",
        },
        priceConfig: {
          coinConversionRate: 1,
          minimumDeposit: 5000,
          chapterUnlockPrice: 500,
          discountTiers: [
            { amount: 20000, discountPercent: 5 },
            { amount: 50000, discountPercent: 10 },
            { amount: 100000, discountPercent: 15 },
            { amount: 300000, discountPercent: 20 },
            { amount: 500000, discountPercent: 25 },
          ],
        },
        emailConfig: {
          smtpHost: "smtp.gmail.com",
          smtpPass: "woduauqbdzilecsx",
          smtpPort: 587,
          smtpUser: "miu2k3a@gmail.com",
          adminEmail: "hlmvuong123@gmail.com",
          senderEmail: "noreply@miu2k3.com",
        },
        expiryConfig: {
          bankTransfer: 10, // 10 phút cho chuyển khoản ngân hàng
          payos: 15, // 15 phút cho PayOS
        },
      };

      await db.insert(paymentSettings).values(defaultSettings);
      console.log("✅ Default payment settings created");
    } else {
      console.log("📝 Payment settings already exist, skipping creation");
    }

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run the seed function
seedDatabase().catch(console.error);
