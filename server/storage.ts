import {
  users,
  type User,
  type InsertUser,
  genres,
  type Genre,
  type InsertGenre,
  authors,
  type Author,
  type InsertAuthor,
  translationGroups,
  type TranslationGroup,
  type InsertTranslationGroup,
  content,
  type Content,
  type InsertContent,
  contentGenres,
  chapters,
  type Chapter,
  type InsertChapter,
  chapterContent,
  type ChapterContent,
  type InsertChapterContent,
  comments,
  type Comment,
  type InsertComment,
  reports,
  type Report,
  type InsertReport,
  userFavorites,
  readingHistory,
  unlockedChapters,
  payments,
  type Payment,
  type InsertPayment,
  advertisements,
  type Advertisement,
  type InsertAdvertisement,
  paymentSettings,
  type PaymentSettings,
  type InsertPaymentSettings,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  and,
  like,
  or,
  desc,
  asc,
  sql,
  gt,
  lt,
  not,
  inArray,
  count,
} from "drizzle-orm";
import session from "express-session";
import { hashPassword, comparePasswords } from "./auth";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Set up PostgreSQL session store
type SessionStore = session.Store;
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getAllUsers(
    page?: number,
    limit?: number,
  ): Promise<{ users: User[]; total: number }>;
  deleteUser(id: number): Promise<boolean>;

  // Genre management
  createGenre(genre: InsertGenre): Promise<Genre>;
  getGenre(id: number): Promise<Genre | undefined>;
  getGenreByName(name: string): Promise<Genre | undefined>;
  getAllGenres(): Promise<Genre[]>;
  updateGenre(
    id: number,
    genre: Partial<InsertGenre>,
  ): Promise<Genre | undefined>;
  deleteGenre(id: number): Promise<boolean>;

  // Author management
  createAuthor(author: InsertAuthor): Promise<Author>;
  getAuthor(id: number): Promise<Author | undefined>;
  getAllAuthors(): Promise<Author[]>;
  updateAuthor(
    id: number,
    author: Partial<InsertAuthor>,
  ): Promise<Author | undefined>;
  deleteAuthor(id: number): Promise<boolean>;

  // Translation group management
  createTranslationGroup(
    group: InsertTranslationGroup,
  ): Promise<TranslationGroup>;
  getTranslationGroup(id: number): Promise<TranslationGroup | undefined>;
  getAllTranslationGroups(): Promise<TranslationGroup[]>;
  updateTranslationGroup(
    id: number,
    group: Partial<InsertTranslationGroup>,
  ): Promise<TranslationGroup | undefined>;
  deleteTranslationGroup(id: number): Promise<boolean>;

  // Content management
  createContent(
    contentData: InsertContent,
    genreIds: number[],
  ): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
  getContentWithDetails(id: number): Promise<
    | {
        content: Content;
        genres: Genre[];
        author: Author;
        translationGroup?: TranslationGroup;
      }
    | undefined
  >;
  getAllContent(
    page?: number,
    limit?: number,
    filter?: Partial<Content>,
  ): Promise<{ content: Content[]; total: number }>;
  updateContent(
    id: number,
    contentData: Partial<InsertContent>,
    genreIds?: number[],
  ): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;
  incrementContentViews(id: number): Promise<boolean>;
  searchContent(
    query: string,
    page?: number,
    limit?: number,
  ): Promise<{ content: Content[]; total: number }>;
  searchContentAdvanced(
    params: any,
    page?: number,
    limit?: number,
  ): Promise<{ content: Content[]; total: number }>;

  // Chapter management
  createChapter(chapterData: InsertChapter): Promise<Chapter>;
  getChapter(id: number): Promise<Chapter | undefined>;
  getChaptersByContent(contentId: number): Promise<Chapter[]>;
  updateChapter(
    id: number,
    chapterData: Partial<InsertChapter>,
  ): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<boolean>;
  incrementChapterViews(id: number): Promise<boolean>;

  // Chapter content management
  createChapterContent(
    chapterContentData: InsertChapterContent,
  ): Promise<ChapterContent>;
  getChapterContentByChapter(chapterId: number): Promise<ChapterContent[]>;
  updateChapterContent(
    id: number,
    contentData: Partial<InsertChapterContent>,
  ): Promise<ChapterContent | undefined>;
  deleteChapterContent(id: number): Promise<boolean>;

  // Comment management
  createComment(commentData: InsertComment): Promise<Comment>;
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByContent(contentId: number): Promise<Comment[]>;
  getCommentsByChapter(chapterId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;

  // Report management
  createReport(reportData: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(
    page?: number,
    limit?: number,
  ): Promise<{ reports: Report[]; total: number }>;
  deleteReport(id: number): Promise<boolean>;

  // User content interaction
  toggleFavorite(userId: number, contentId: number): Promise<boolean>;
  getFavorites(userId: number): Promise<Content[]>;
  addReadingHistory(
    userId: number,
    contentId: number,
    chapterId: number,
  ): Promise<boolean>;
  getReadingHistory(
    userId: number,
  ): Promise<{ content: Content; chapter: Chapter }[]>;
  unlockChapter(userId: number, chapterId: number): Promise<boolean>;
  isChapterUnlocked(userId: number, chapterId: number): Promise<boolean>;

  // Payment management
  createPayment(paymentData: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByTransactionId(
    transactionId: string,
  ): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getAllPayments(
    page?: number,
    limit?: number,
  ): Promise<{ payments: Payment[]; total: number }>;
  updatePaymentStatus(
    id: number,
    status: "pending" | "completed" | "failed",
  ): Promise<Payment | undefined>;

  // Advertisement management
  createAdvertisement(adData: InsertAdvertisement): Promise<Advertisement>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  getActiveAdvertisements(
    position: "banner" | "sidebar" | "popup",
  ): Promise<Advertisement[]>;
  getAllAdvertisements(
    page?: number,
    limit?: number,
  ): Promise<{ ads: Advertisement[]; total: number }>;
  updateAdvertisement(
    id: number,
    adData: Partial<InsertAdvertisement>,
  ): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;
  incrementAdViews(id: number): Promise<boolean>;
  incrementAdClicks(id: number): Promise<boolean>;

  // Payment settings
  getPaymentSettings(): Promise<PaymentSettings | undefined>;
  createDefaultPaymentSettings(): Promise<PaymentSettings>;
  updatePaymentSettings(
    settingsData: Partial<InsertPaymentSettings>,
  ): Promise<PaymentSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session', // Table to store sessions
      createTableIfMissing: true, // Auto-create session table if it doesn't exist
      pruneSessionInterval: 60 * 60, // Prune old sessions hourly
    });
  }

  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await hashPassword(user.password);

    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();

    return newUser;
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    // If password is being updated, hash it
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async updateUserBalance(
    id: number,
    amount: number,
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ balance: amount })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const usersList = await db.select().from(users).limit(limit).offset(offset);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users);

    return {
      users: usersList,
      total: count,
    };
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Genre management methods
  async createGenre(genre: InsertGenre): Promise<Genre> {
    const [newGenre] = await db.insert(genres).values(genre).returning();
    return newGenre;
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre;
  }

  async getGenreByName(name: string): Promise<Genre | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.name, name));
    return genre;
  }

  async getAllGenres(): Promise<Genre[]> {
    return db.select().from(genres);
  }

  async updateGenre(
    id: number,
    genreData: Partial<InsertGenre>,
  ): Promise<Genre | undefined> {
    const [updatedGenre] = await db
      .update(genres)
      .set(genreData)
      .where(eq(genres.id, id))
      .returning();

    return updatedGenre;
  }

  async deleteGenre(id: number): Promise<boolean> {
    // First, delete all content-genre associations
    await db.delete(contentGenres).where(eq(contentGenres.genreId, id));

    // Then delete the genre
    const result = await db.delete(genres).where(eq(genres.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Author management methods
  async createAuthor(author: InsertAuthor): Promise<Author> {
    const [newAuthor] = await db.insert(authors).values(author).returning();
    return newAuthor;
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const [author] = await db.select().from(authors).where(eq(authors.id, id));
    return author;
  }

  async getAllAuthors(): Promise<Author[]> {
    return db.select().from(authors);
  }

  async updateAuthor(
    id: number,
    authorData: Partial<InsertAuthor>,
  ): Promise<Author | undefined> {
    const [updatedAuthor] = await db
      .update(authors)
      .set(authorData)
      .where(eq(authors.id, id))
      .returning();

    return updatedAuthor;
  }

  async deleteAuthor(id: number): Promise<boolean> {
    const result = await db.delete(authors).where(eq(authors.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Translation group management methods
  async createTranslationGroup(
    group: InsertTranslationGroup,
  ): Promise<TranslationGroup> {
    const [newGroup] = await db
      .insert(translationGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async getTranslationGroup(id: number): Promise<TranslationGroup | undefined> {
    const [group] = await db
      .select()
      .from(translationGroups)
      .where(eq(translationGroups.id, id));
    return group;
  }

  async getAllTranslationGroups(): Promise<TranslationGroup[]> {
    return db.select().from(translationGroups);
  }

  async updateTranslationGroup(
    id: number,
    groupData: Partial<InsertTranslationGroup>,
  ): Promise<TranslationGroup | undefined> {
    const [updatedGroup] = await db
      .update(translationGroups)
      .set(groupData)
      .where(eq(translationGroups.id, id))
      .returning();

    return updatedGroup;
  }

  async deleteTranslationGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(translationGroups)
      .where(eq(translationGroups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Content management methods
  async createContent(
    contentData: InsertContent,
    genreIds: number[],
  ): Promise<Content> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the content
      const [newContent] = await tx
        .insert(content)
        .values(contentData)
        .returning();

      // Associate genres with the content
      if (genreIds.length > 0) {
        await tx.insert(contentGenres).values(
          genreIds.map((genreId) => ({
            contentId: newContent.id,
            genreId,
          })),
        );
      }

      return newContent;
    });
  }

  async getContent(id: number): Promise<Content | undefined> {
    const [contentItem] = await db
      .select()
      .from(content)
      .where(eq(content.id, id));
    return contentItem;
  }

  async getContentWithDetails(id: number): Promise<
    | {
        content: Content;
        genres: Genre[];
        author: Author;
        translationGroup?: TranslationGroup;
      }
    | undefined
  > {
    const [contentItem] = await db
      .select()
      .from(content)
      .where(eq(content.id, id));

    if (!contentItem) {
      return undefined;
    }

    // Get the author
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, contentItem.authorId));

    if (!author) {
      return undefined; // Author must exist
    }

    // Get the translation group if available
    let translationGroup: TranslationGroup | undefined;
    if (contentItem.translationGroupId) {
      const [group] = await db
        .select()
        .from(translationGroups)
        .where(eq(translationGroups.id, contentItem.translationGroupId));
      translationGroup = group;
    }

    // Get the genres associated with this content
    const contentGenresList = await db
      .select()
      .from(contentGenres)
      .where(eq(contentGenres.contentId, id));

    const genresList: Genre[] = [];
    if (contentGenresList.length > 0) {
      const genreIds = contentGenresList.map((cg) => cg.genreId);
      const genresResult = await db
        .select()
        .from(genres)
        .where(inArray(genres.id, genreIds));
      genresList.push(...genresResult);
    }

    return {
      content: contentItem,
      genres: genresList,
      author,
      translationGroup,
    };
  }

  async getAllContent(
    page: number = 1,
    limit: number = 10,
    filter: Partial<Content> = {},
  ): Promise<{ content: any[]; total: number }> {
    const offset = (page - 1) * limit;

    // Build the base query with joins for author and translation group
    let baseQuery = db
      .select({
        content: content,
        author: authors,
        translationGroup: translationGroups,
      })
      .from(content)
      .leftJoin(authors, eq(content.authorId, authors.id))
      .leftJoin(translationGroups, eq(content.translationGroupId, translationGroups.id));

    // Build the count query
    let countQuery = db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(content);

    // Apply filters if provided
    if (filter.type) {
      baseQuery = baseQuery.where(eq(content.type, filter.type));
      countQuery = countQuery.where(eq(content.type, filter.type));
    }

    if (filter.status) {
      baseQuery = baseQuery.where(eq(content.status, filter.status));
      countQuery = countQuery.where(eq(content.status, filter.status));
    }

    if (filter.authorId) {
      baseQuery = baseQuery.where(eq(content.authorId, filter.authorId));
      countQuery = countQuery.where(eq(content.authorId, filter.authorId));
    }

    // Get the total count
    const [{ count }] = await countQuery;

    // Get the content data with pagination and ordering
    const contentData = await baseQuery
      .orderBy(desc(content.createdAt))
      .limit(limit)
      .offset(offset);

    // For each content, get its genres
    const contentWithDetails = await Promise.all(
      contentData.map(async (item) => {
        // Get genres for this content
        const contentGenreList = await db
          .select({
            genre: genres,
          })
          .from(contentGenres)
          .leftJoin(genres, eq(contentGenres.genreId, genres.id))
          .where(eq(contentGenres.contentId, item.content.id));

        const genresList = contentGenreList.map((g) => g.genre);

        return {
          ...item.content,
          author: item.author,
          translationGroup: item.translationGroup,
          genres: genresList,
        };
      })
    );

    return {
      content: contentWithDetails,
      total: count,
    };
  }

  async updateContent(
    id: number,
    contentData: Partial<InsertContent>,
    genreIds?: number[],
  ): Promise<Content | undefined> {
    try {
      return await db.transaction(async (tx) => {
        // Update the content
        const [updatedContent] = await tx
          .update(content)
          .set(contentData)
          .where(eq(content.id, id))
          .returning();

        if (!updatedContent) {
          return undefined;
        }

        // Update genres if provided
        if (genreIds !== undefined) {
          // Delete existing associations
          await tx.delete(contentGenres).where(eq(contentGenres.contentId, id));

          // Add new associations
          if (genreIds.length > 0) {
            await tx.insert(contentGenres).values(
              genreIds.map((genreId) => ({
                contentId: id,
                genreId,
              })),
            );
          }
        }

        return updatedContent;
      });
    } catch (error) {
      console.error("Error updating content:", error);
      throw error;
    }
  }

  async deleteContent(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Delete content-genre associations
      await tx.delete(contentGenres).where(eq(contentGenres.contentId, id));

      // Delete chapters and their content
      const chaptersList = await tx
        .select()
        .from(chapters)
        .where(eq(chapters.contentId, id));

      for (const chapter of chaptersList) {
        // Delete chapter content
        await tx
          .delete(chapterContent)
          .where(eq(chapterContent.chapterId, chapter.id));

        // Delete unlocked chapters
        await tx
          .delete(unlockedChapters)
          .where(eq(unlockedChapters.chapterId, chapter.id));

        // Delete comments on chapter
        await tx.delete(comments).where(eq(comments.chapterId, chapter.id));

        // Delete reports on chapter
        await tx.delete(reports).where(eq(reports.chapterId, chapter.id));
      }

      // Delete all chapters
      await tx.delete(chapters).where(eq(chapters.contentId, id));

      // Delete comments on content
      await tx.delete(comments).where(eq(comments.contentId, id));

      // Delete reports on content
      await tx.delete(reports).where(eq(reports.contentId, id));

      // Delete favorites
      await tx.delete(userFavorites).where(eq(userFavorites.contentId, id));

      // Delete reading history
      await tx.delete(readingHistory).where(eq(readingHistory.contentId, id));

      // Finally, delete the content
      const result = await tx.delete(content).where(eq(content.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  async incrementContentViews(id: number): Promise<boolean> {
    const result = await db
      .update(content)
      .set({
        views: sql`${content.views} + 1`,
      })
      .where(eq(content.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async searchContent(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ content: Content[]; total: number }> {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    // Search in title or alternative title
    const contentList = await db
      .select()
      .from(content)
      .where(
        or(
          like(content.title, searchTerm),
          like(content.alternativeTitle, searchTerm),
        ),
      )
      .orderBy(desc(content.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total results
    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(content)
      .where(
        or(
          like(content.title, searchTerm),
          like(content.alternativeTitle, searchTerm),
        ),
      );

    return {
      content: contentList,
      total: count,
    };
  }

  async searchContentAdvanced(
    params: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ content: Content[]; total: number }> {
    const offset = (page - 1) * limit;

    // Build the query conditions
    const conditions = [];

    if (params.title) {
      conditions.push(like(content.title, `%${params.title}%`));
    }

    if (params.type) {
      conditions.push(eq(content.type, params.type));
    }

    if (params.status) {
      conditions.push(eq(content.status, params.status));
    }

    // Handle genre filtering
    const hasGenreFilter = params.genreIds && params.genreIds.length > 0;

    // First, find all content that matches basic criteria
    let contentQuery = db.select().from(content);

    if (conditions.length > 0) {
      contentQuery = contentQuery.where(and(...conditions));
    }

    // Sort based on the sort parameter
    if (params.sort) {
      switch (params.sort) {
        case "newest":
          contentQuery = contentQuery.orderBy(desc(content.createdAt));
          break;
        case "oldest":
          contentQuery = contentQuery.orderBy(asc(content.createdAt));
          break;
        case "az":
          contentQuery = contentQuery.orderBy(asc(content.title));
          break;
        case "za":
          contentQuery = contentQuery.orderBy(desc(content.title));
          break;
        case "popularity":
          contentQuery = contentQuery.orderBy(desc(content.views));
          break;
      }
    } else {
      // Default sort by newest
      contentQuery = contentQuery.orderBy(desc(content.createdAt));
    }

    let filteredContentIds: number[] = [];

    // If genre filtering is needed, get all contentIds that match the genre criteria
    if (hasGenreFilter) {
      // Get all content-genre mappings for the requested genres
      const genreMappings = await db
        .select()
        .from(contentGenres)
        .where(inArray(contentGenres.genreId, params.genreIds));

      // Count how many genres match for each content
      const contentGenreCounts: Record<number, number> = {};
      genreMappings.forEach((mapping) => {
        contentGenreCounts[mapping.contentId] =
          (contentGenreCounts[mapping.contentId] || 0) + 1;
      });

      // Only include content that matches all requested genres
      filteredContentIds = Object.entries(contentGenreCounts)
        .filter(([_, count]) => count === params.genreIds.length)
        .map(([contentId, _]) => parseInt(contentId));

      // If no content matches all genres, return empty result
      if (filteredContentIds.length === 0 && hasGenreFilter) {
        return { content: [], total: 0 };
      }
    }

    // Apply genre filter if needed
    if (hasGenreFilter) {
      contentQuery = contentQuery.where(
        inArray(content.id, filteredContentIds),
      );
    }

    // Execute the query with pagination
    const contentList = await contentQuery.limit(limit).offset(offset);

    // Count total results
    let countQuery = db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(content);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    if (hasGenreFilter) {
      countQuery = countQuery.where(inArray(content.id, filteredContentIds));
    }

    const [{ count }] = await countQuery;

    return {
      content: contentList,
      total: count,
    };
  }

  // Chapter management methods
  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    const [newChapter] = await db
      .insert(chapters)
      .values(chapterData)
      .returning();
    return newChapter;
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, id));
    return chapter;
  }

  async getChaptersByContent(contentId: number): Promise<Chapter[]> {
    return db
      .select()
      .from(chapters)
      .where(eq(chapters.contentId, contentId))
      .orderBy(asc(chapters.number));
  }

  async updateChapter(
    id: number,
    chapterData: Partial<InsertChapter>,
  ): Promise<Chapter | undefined> {
    const [updatedChapter] = await db
      .update(chapters)
      .set(chapterData)
      .where(eq(chapters.id, id))
      .returning();

    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Delete chapter content
      await tx.delete(chapterContent).where(eq(chapterContent.chapterId, id));

      // Delete unlocked chapters
      await tx
        .delete(unlockedChapters)
        .where(eq(unlockedChapters.chapterId, id));

      // Delete comments on chapter
      await tx.delete(comments).where(eq(comments.chapterId, id));

      // Delete reports on chapter
      await tx.delete(reports).where(eq(reports.chapterId, id));

      // Delete reading history for this chapter
      await tx.delete(readingHistory).where(eq(readingHistory.chapterId, id));

      // Finally, delete the chapter
      const result = await tx.delete(chapters).where(eq(chapters.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  async incrementChapterViews(id: number): Promise<boolean> {
    const result = await db
      .update(chapters)
      .set({
        views: sql`${chapters.views} + 1`,
      })
      .where(eq(chapters.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  // Chapter content management methods
  async createChapterContent(
    chapterContentData: InsertChapterContent,
  ): Promise<ChapterContent> {
    const [newContent] = await db
      .insert(chapterContent)
      .values(chapterContentData)
      .returning();
    return newContent;
  }

  async getChapterContentByChapter(
    chapterId: number,
  ): Promise<ChapterContent[]> {
    const chapterContentList = await db
      .select()
      .from(chapterContent)
      .where(eq(chapterContent.chapterId, chapterId))
      .orderBy(asc(chapterContent.pageOrder));

    // Sort by page order if available
    return chapterContentList.sort((a, b) => {
      if (a.pageOrder === null && b.pageOrder === null) return 0;
      if (a.pageOrder === null) return 1;
      if (b.pageOrder === null) return -1;
      return a.pageOrder - b.pageOrder;
    });
  }

  async updateChapterContent(
    id: number,
    contentData: Partial<InsertChapterContent>,
  ): Promise<ChapterContent | undefined> {
    const [updatedContent] = await db
      .update(chapterContent)
      .set(contentData)
      .where(eq(chapterContent.id, id))
      .returning();

    return updatedContent;
  }

  async deleteChapterContent(id: number): Promise<boolean> {
    const result = await db
      .delete(chapterContent)
      .where(eq(chapterContent.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Comment management methods
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    return newComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByContent(contentId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(and(eq(comments.contentId, contentId), isNull(comments.chapterId)))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentsByChapter(chapterId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.chapterId, chapterId))
      .orderBy(desc(comments.createdAt));
  }

  async deleteComment(id: number): Promise<boolean> {
    // Delete reports related to this comment
    await db.delete(reports).where(eq(reports.commentId, id));

    // Delete the comment
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Report management methods
  async createReport(reportData: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(reportData).returning();
    return newReport;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getAllReports(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reports: Report[]; total: number }> {
    const offset = (page - 1) * limit;

    const reportsList = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(reports);

    return {
      reports: reportsList,
      total: count,
    };
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User content interaction methods
  async toggleFavorite(userId: number, contentId: number): Promise<boolean> {
    // Check if favorite already exists
    const [existingFavorite] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.contentId, contentId),
        ),
      );

    if (existingFavorite) {
      // Remove favorite
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.contentId, contentId),
          ),
        );
      return false; // Removed
    } else {
      // Add favorite
      await db.insert(userFavorites).values({
        userId,
        contentId,
      });
      return true; // Added
    }
  }

  async getFavorites(userId: number): Promise<Content[]> {
    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    if (favorites.length === 0) {
      return [];
    }

    const contentIds = favorites.map((fav) => fav.contentId);

    return db
      .select()
      .from(content)
      .where(inArray(content.id, contentIds))
      .orderBy(desc(content.createdAt));
  }

  async addReadingHistory(
    userId: number,
    contentId: number,
    chapterId: number,
  ): Promise<boolean> {
    // Check if entry already exists
    const [existingEntry] = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, userId),
          eq(readingHistory.contentId, contentId),
        ),
      );

    if (existingEntry) {
      // Update existing entry
      await db
        .update(readingHistory)
        .set({
          chapterId,
          lastReadAt: new Date(),
        })
        .where(eq(readingHistory.id, existingEntry.id));
    } else {
      // Add new entry
      await db.insert(readingHistory).values({
        userId,
        contentId,
        chapterId,
        lastReadAt: new Date(),
      });
    }

    return true;
  }

  async getReadingHistory(
    userId: number,
  ): Promise<{ content: Content; chapter: Chapter }[]> {
    try {
      const historyEntries = await db
        .select()
        .from(readingHistory)
        .where(eq(readingHistory.userId, userId))
        .orderBy(desc(readingHistory.lastReadAt));  // Use the correct column name

      const result: { content: Content; chapter: Chapter }[] = [];

      for (const entry of historyEntries) {
        const [contentItem] = await db
          .select()
          .from(content)
          .where(eq(content.id, entry.contentId));

        const [chapterItem] = await db
          .select()
          .from(chapters)
          .where(eq(chapters.id, entry.chapterId));

        if (contentItem && chapterItem) {
          result.push({
            content: contentItem,
            chapter: chapterItem,
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching reading history:", error);
      return [];
    }
  }

  async unlockChapter(userId: number, chapterId: number): Promise<boolean> {
    await db.insert(unlockedChapters).values({
      userId,
      chapterId,
      unlockedAt: new Date(),
    });

    return true;
  }

  async isChapterUnlocked(userId: number, chapterId: number): Promise<boolean> {
    const [unlocked] = await db
      .select()
      .from(unlockedChapters)
      .where(
        and(
          eq(unlockedChapters.userId, userId),
          eq(unlockedChapters.chapterId, chapterId),
        ),
      );

    return !!unlocked;
  }

  // Payment management methods
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, transactionId));

    return payment;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getAllPayments(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: Payment[]; total: number }> {
    const offset = (page - 1) * limit;

    const paymentsList = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(payments);

    return {
      payments: paymentsList,
      total: count,
    };
  }

  async updatePaymentStatus(
    id: number,
    status: "pending" | "completed" | "failed",
  ): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();

    return updatedPayment;
  }

  // Advertisement management methods
  async createAdvertisement(
    adData: InsertAdvertisement,
  ): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements).values(adData).returning();
    return newAd;
  }

  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id));
    return ad;
  }

  async getActiveAdvertisements(
    position: "banner" | "sidebar" | "popup",
  ): Promise<Advertisement[]> {
    const now = new Date();

    return db
      .select()
      .from(advertisements)
      .where(
        and(
          eq(advertisements.position, position),
          eq(advertisements.isActive, true),
          lt(advertisements.startDate, now),
          gt(advertisements.endDate, now),
        ),
      );
  }

  async getAllAdvertisements(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ ads: Advertisement[]; total: number }> {
    const offset = (page - 1) * limit;

    const adsList = await db
      .select()
      .from(advertisements)
      .orderBy(desc(advertisements.endDate))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(advertisements);
    
    const total = Number(countResult?.count || 0);

    return {
      ads: adsList,
      total: total,
    };
  }

  async updateAdvertisement(
    id: number,
    adData: Partial<InsertAdvertisement>,
  ): Promise<Advertisement | undefined> {
    const [updatedAd] = await db
      .update(advertisements)
      .set(adData)
      .where(eq(advertisements.id, id))
      .returning();

    return updatedAd;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const result = await db
      .delete(advertisements)
      .where(eq(advertisements.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementAdViews(id: number): Promise<boolean> {
    const result = await db
      .update(advertisements)
      .set({
        views: sql`${advertisements.views} + 1`,
      })
      .where(eq(advertisements.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementAdClicks(id: number): Promise<boolean> {
    const result = await db
      .update(advertisements)
      .set({
        clicks: sql`${advertisements.clicks} + 1`,
      })
      .where(eq(advertisements.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  // Payment settings methods
  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(paymentSettings);
    return settings;
  }

  async createDefaultPaymentSettings(): Promise<PaymentSettings> {
    const defaultSettings: InsertPaymentSettings = {
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
        enabled: false,
        clientId: "",
        apiKey: "",
        checksumKey: "",
        baseUrl: "https://api-merchant.payos.vn"
      },
      priceConfig: {
        coinConversionRate: 1000,
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
        adminEmail: "hlmvuong123@gmail.com"
      },
      expiryConfig: {
        bankTransfer: 10, // 10 phút cho chuyển khoản ngân hàng
        payos: 15, // 15 phút cho PayOS
      }
    };

    const [newSettings] = await db
      .insert(paymentSettings)
      .values(defaultSettings)
      .returning();

    return newSettings;
  }

  async updatePaymentSettings(
    settingsData: Partial<InsertPaymentSettings>,
  ): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(paymentSettings);

    if (!settings) {
      // Create new settings if none exist
      return this.createDefaultPaymentSettings();
    }

    const [updatedSettings] = await db
      .update(paymentSettings)
      .set(settingsData)
      .where(eq(paymentSettings.id, settings.id))
      .returning();

    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
