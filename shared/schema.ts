import {
  mysqlTable,
  varchar,
  int,
  boolean,
  timestamp,
  text,
  mysqlEnum,
  json
} from 'drizzle-orm/mysql-core';
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = mysqlEnum('user_role', ['user', 'admin']);
export const contentTypeEnum = mysqlEnum('content_type', ['manga', 'novel']);
export const statusEnum = mysqlEnum('status', ['ongoing', 'completed', 'hiatus']);
export const paymentMethodEnum = mysqlEnum('payment_method', [
  'bank_transfer',
  'credit_card',
  'e_wallet',
  'payos',
]);
export const paymentStatusEnum = mysqlEnum('payment_status', [
  'pending',
  'completed',
  'failed',
]);
export const adPositionEnum = mysqlEnum('ad_position', [
  'top',
  'bottom', 
  'left',
  'right',
  'popup',
  'overlay',
  'custom',
]);

export const adProviderEnum = mysqlEnum('ad_provider', [
  'internal',
  'google',
  'facebook',
  'other',
]);

// Users Table
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('user'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  balance: int('balance').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// We'll define the relations after all tables are defined

// Content Tables
export const genres = mysqlTable("genres", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
});

export const authors = mysqlTable("authors", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  info: text("info"),
  birthDate: varchar("birth_date", { length: 255 }),
});

export const translationGroups = mysqlTable("translation_groups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  foundedDate: varchar("founded_date", { length: 255 }),
});

export const content = mysqlTable("content", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  alternativeTitle: varchar("alternative_title", { length: 255 }),
  type: contentTypeEnum("type").notNull(),
  authorId: int("author_id").notNull(),
  translationGroupId: int("translation_group_id"),
  releaseYear: varchar("release_year", { length: 255 }),
  status: statusEnum("status").notNull().default("ongoing"),
  description: text("description"),
  coverImage: varchar("cover_image", { length: 255 }),
  views: int("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentGenres = mysqlTable("content_genres", {
  contentId: int("content_id").notNull(),
  genreId: int("genre_id").notNull(),
});

export const chapters = mysqlTable("chapters", {
  id: int("id").primaryKey().autoincrement(),
  contentId: int("content_id").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }),
  releaseDate: timestamp("release_date").defaultNow().notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  unlockPrice: int("unlock_price"),
  views: int("views").notNull().default(0),
  fontFamily: varchar("font_family", { length: 255 }),
  fontSize: varchar("font_size", { length: 255 }),
});

export const chapterContent = mysqlTable("chapter_content", {
  id: int("id").primaryKey().autoincrement(),
  chapterId: int("chapter_id").notNull(),
  content: text("content"), // PostgreSQL text type has no practical length limitation
});

// User Activity Tables
export const userFavorites = mysqlTable("user_favorites", {
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readingHistory = mysqlTable("reading_history", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  chapterId: int("chapter_id").notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

export const unlockedChapters = mysqlTable("unlocked_chapters", {
  userId: int("user_id").notNull(),
  chapterId: int("chapter_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const comments = mysqlTable("comments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  chapterId: int("chapter_id"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  contentId: int("content_id"),
  chapterId: int("chapter_id"),
  commentId: int("comment_id"),
  reportText: text("report_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment and Ads Tables
export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull().unique(),
  amount: int("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentSettings = mysqlTable("payment_settings", {
  id: int("id").primaryKey().autoincrement(),
  bankConfig: json("bank_config").notNull(),
  vietQRConfig: json("viet_qr_config").notNull(),
  payosConfig: json("payos_config").notNull().default({}),
  priceConfig: json("price_config").notNull(),
  emailConfig: json("email_config").notNull().default({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    senderEmail: "",
    adminEmail: "hlmvuong123@gmail.com", // Email mặc định
  }),
  expiryConfig: json("expiry_config").notNull().default({
    bankTransfer: 10, // Số phút hết hạn cho giao dịch chuyển khoản
    payos: 15, // Số phút hết hạn cho giao dịch PayOS
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const advertisements = mysqlTable("advertisements", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }).notNull().default(""),
  targetUrl: varchar("target_url", { length: 255 }).notNull().default("#"),
  position: adPositionEnum("position").notNull(),
  displayOrder: int("display_order").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  views: int("views").notNull().default(0),
  clicks: int("clicks").notNull().default(0),
  width: int("width"),
  height: int("height"),
  displayFrequency: int("display_frequency").notNull().default(30), // In minutes, for overlay ads
  lastDisplayedAt: timestamp("last_displayed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: adProviderEnum("provider").notNull().default("internal"),
  metadata: json("metadata"), // Thêm trường metadata để lưu thông tin của external ads
});

// Bảng cấu hình quảng cáo bên thứ 3 đã được gộp vào bảng advertisements với trường provider và metadata

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
    fontFamily: true,
    fontSize: true,
  })
  .extend({
    releaseDate: z.preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg),
      z
        .date()
        .optional()
        .default(() => new Date()),
    ),
    fontFamily: z.string().optional(),
    fontSize: z.string().optional(),
  });

export const insertChapterContentSchema = createInsertSchema(
  chapterContent,
).pick({
  chapterId: true,
  content: true,
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

export const insertPaymentSchema = createInsertSchema(payments)
  .pick({
    userId: true,
    transactionId: true,
    amount: true,
    method: true,
    status: true,
  })
  .extend({
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
    displayOrder: true,
    width: true,
    height: true,
    displayFrequency: true,
    startDate: true,
    endDate: true,
    isActive: true,
    provider: true,
    metadata: true,
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
    displayFrequency: z.number().min(15).max(60).optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    imageUrl: z.string().optional().default(""),
    targetUrl: z.string().optional().default("#"),
    provider: z.enum(["internal", "google", "facebook", "other"]).optional().default("internal"),
    metadata: z.any().optional(),
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

// External Ad Config schema đã được gộp vào Advertisement schema với provider và metadata

export const insertPaymentSettingsSchema = createInsertSchema(
  paymentSettings,
).pick({
  bankConfig: true,
  vietQRConfig: true,
  payosConfig: true,
  priceConfig: true,
  emailConfig: true,
  expiryConfig: true,
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

// Define table relations after all types are defined
export const usersRelations = relations(users, ({ many }) => ({
  payments: many(payments),
  comments: many(comments),
  reports: many(reports),
  favorites: many(userFavorites),
  readingHistories: many(readingHistory),
  unlockedChapters: many(unlockedChapters),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  contentLinks: many(contentGenres),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  contents: many(content),
}));

export const translationGroupsRelations = relations(
  translationGroups,
  ({ many }) => ({
    contents: many(content),
  }),
);

export const contentRelations = relations(content, ({ one, many }) => ({
  author: one(authors, {
    fields: [content.authorId],
    references: [authors.id],
  }),
  translationGroup: one(translationGroups, {
    fields: [content.translationGroupId],
    references: [translationGroups.id],
  }),
  genreLinks: many(contentGenres),
  chapters: many(chapters),
  comments: many(comments),
  favorites: many(userFavorites),
  readingHistories: many(readingHistory),
  reports: many(reports),
}));

export const contentGenresRelations = relations(contentGenres, ({ one }) => ({
  content: one(content, {
    fields: [contentGenres.contentId],
    references: [content.id],
  }),
  genre: one(genres, {
    fields: [contentGenres.genreId],
    references: [genres.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  content: one(content, {
    fields: [chapters.contentId],
    references: [content.id],
  }),
  chapterContents: many(chapterContent),
  comments: many(comments),
  readingHistories: many(readingHistory),
  unlocked: many(unlockedChapters),
  reports: many(reports),
}));

export const chapterContentRelations = relations(chapterContent, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterContent.chapterId],
    references: [chapters.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [userFavorites.contentId],
    references: [content.id],
  }),
}));

export const readingHistoryRelations = relations(readingHistory, ({ one }) => ({
  user: one(users, {
    fields: [readingHistory.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [readingHistory.contentId],
    references: [content.id],
  }),
  chapter: one(chapters, {
    fields: [readingHistory.chapterId],
    references: [chapters.id],
  }),
}));

export const unlockedChaptersRelations = relations(
  unlockedChapters,
  ({ one }) => ({
    user: one(users, {
      fields: [unlockedChapters.userId],
      references: [users.id],
    }),
    chapter: one(chapters, {
      fields: [unlockedChapters.chapterId],
      references: [chapters.id],
    }),
  }),
);

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [comments.contentId],
    references: [content.id],
  }),
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [reports.contentId],
    references: [content.id],
  }),
  chapter: one(chapters, {
    fields: [reports.chapterId],
    references: [chapters.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));