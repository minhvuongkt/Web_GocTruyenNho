import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  pgEnum,
  timestamp,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const contentTypeEnum = pgEnum("content_type", ["manga", "novel"]);
export const statusEnum = pgEnum("status", ["ongoing", "completed", "hiatus"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "credit_card",
  "e_wallet",
  "payos",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
]);
export const adPositionEnum = pgEnum("ad_position", [
  "banner",
  "sidebar",
  "popup",
]);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("user"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  balance: integer("balance").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content Tables
export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  info: text("info"),
  birthDate: text("birth_date"),
});

export const translationGroups = pgTable("translation_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  foundedDate: text("founded_date"),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  alternativeTitle: text("alternative_title"),
  type: contentTypeEnum("type").notNull(),
  authorId: integer("author_id").notNull(),
  translationGroupId: integer("translation_group_id"),
  releaseYear: text("release_year"),
  status: statusEnum("status").notNull().default("ongoing"),
  description: text("description"),
  coverImage: text("cover_image"),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentGenres = pgTable("content_genres", {
  contentId: integer("content_id").notNull(),
  genreId: integer("genre_id").notNull(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  number: integer("number").notNull(),
  title: text("title"),
  releaseDate: timestamp("release_date").defaultNow().notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  unlockPrice: integer("unlock_price"),
  views: integer("views").notNull().default(0),
});

export const chapterContent = pgTable("chapter_content", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull(),
  content: text("content"), // For novels
  pageOrder: integer("page_order"), // For manga pages order
  imageUrl: text("image_url"), // For manga pages
});

// User Activity Tables
export const userFavorites = pgTable("user_favorites", {
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readingHistory = pgTable("reading_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

export const unlockedChapters = pgTable("unlocked_chapters", {
  userId: integer("user_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  chapterId: integer("chapter_id"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id"),
  chapterId: integer("chapter_id"),
  commentId: integer("comment_id"),
  reportText: text("report_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment and Ads Tables
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transactionId: text("transaction_id").notNull().unique(),
  amount: integer("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  bankConfig: jsonb("bank_config").notNull(),
  vietQRConfig: jsonb("viet_qr_config").notNull(),
  payosConfig: jsonb("payos_config").notNull().default({}),
  priceConfig: jsonb("price_config").notNull(),
  emailConfig: jsonb("email_config").notNull().default({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    senderEmail: "",
    adminEmail: "hlmvuong123@gmail.com" // Email mặc định
  }),
  expiryConfig: jsonb("expiry_config").notNull().default({
    bankTransfer: 10, // Số phút hết hạn cho giao dịch chuyển khoản
    payos: 15 // Số phút hết hạn cho giao dịch PayOS
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  position: adPositionEnum("position").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
});

// Zod schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
});

export const insertGenreSchema = createInsertSchema(genres).pick({
  name: true,
  description: true,
});

export const insertAuthorSchema = createInsertSchema(authors).pick({
  name: true,
  info: true,
  birthDate: true,
});

export const insertTranslationGroupSchema = createInsertSchema(
  translationGroups,
).pick({
  name: true,
  description: true,
  foundedDate: true,
});

export const insertContentSchema = createInsertSchema(content).pick({
  title: true,
  alternativeTitle: true,
  type: true,
  authorId: true,
  translationGroupId: true,
  releaseYear: true,
  status: true,
  description: true,
  coverImage: true,
});

export const insertChapterSchema = createInsertSchema(chapters)
  .pick({
    contentId: true,
    number: true,
    title: true,
    releaseDate: true,
    isLocked: true,
    unlockPrice: true,
  })
  .extend({
    releaseDate: z.preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg),
      z
        .date()
        .optional()
        .default(() => new Date()),
    ),
  });

export const insertChapterContentSchema = createInsertSchema(
  chapterContent,
).pick({
  chapterId: true,
  content: true,
  pageOrder: true,
  imageUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  contentId: true,
  chapterId: true,
  text: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  userId: true,
  contentId: true,
  chapterId: true,
  commentId: true,
  reportText: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  transactionId: true,
  amount: true,
  method: true,
  status: true,
}).extend({
  createdAt: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z
      .date()
      .optional()
      .default(() => new Date()),
  ),
});

export const insertAdvertisementSchema = createInsertSchema(advertisements)
  .pick({
    title: true,
    imageUrl: true,
    targetUrl: true,
    position: true,
    startDate: true,
    endDate: true,
    isActive: true,
  })
  .extend({
    startDate: z.preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg),
      z.date(),
    ),
    endDate: z.preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg),
      z.date(),
    ),
  });

// TypeScript types for the tables
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authors.$inferSelect;

export type InsertTranslationGroup = z.infer<
  typeof insertTranslationGroupSchema
>;
export type TranslationGroup = typeof translationGroups.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chapters.$inferSelect;

export type InsertChapterContent = z.infer<typeof insertChapterContentSchema>;
export type ChapterContent = typeof chapterContent.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;

export const insertPaymentSettingsSchema = createInsertSchema(
  paymentSettings,
).pick({
  bankConfig: true,
  vietQRConfig: true,
  payosConfig: true,
  priceConfig: true,
});

export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;

// Thêm cấu hình thời gian hết hạn
export interface PaymentExpiryConfig {
  bankTransfer: number; // Thời gian hết hạn cho chuyển khoản ngân hàng, tính bằng phút
  payos: number; // Thời gian hết hạn cho PayOS, tính bằng phút
}

// Extended schemas for client validations
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema
  .omit({ role: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
