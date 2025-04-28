import { 
  users, type User, type InsertUser, 
  genres, type Genre, type InsertGenre,
  authors, type Author, type InsertAuthor,
  translationGroups, type TranslationGroup, type InsertTranslationGroup,
  content, type Content, type InsertContent,
  chapters, type Chapter, type InsertChapter,
  chapterContent, type ChapterContent, type InsertChapterContent,
  comments, type Comment, type InsertComment,
  reports, type Report, type InsertReport,
  payments, type Payment, type InsertPayment,
  advertisements, type Advertisement, type InsertAdvertisement,
  contentGenres, userFavorites, readingHistory, unlockedChapters
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, pool } from "./db";
import { and, eq, gt, gte, lt, lte, ne, inArray, like, desc, asc, sql, ilike, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// Fix for SessionStore type issue
type SessionStore = session.Store;

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const newBalance = user.balance + amount;
    
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [countResult] = await db
      .select({ count: count() })
      .from(users);
    
    const total = Number(countResult?.count || 0);
    
    const usersList = await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
    
    return { users: usersList, total };
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ deletedId: users.id });
    
    return result.length > 0;
  }

  // Genre management
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
    return db.select().from(genres).orderBy(asc(genres.name));
  }

  async updateGenre(id: number, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    const [updatedGenre] = await db
      .update(genres)
      .set(genre)
      .where(eq(genres.id, id))
      .returning();
    
    return updatedGenre;
  }

  async deleteGenre(id: number): Promise<boolean> {
    const result = await db
      .delete(genres)
      .where(eq(genres.id, id))
      .returning({ deletedId: genres.id });
    
    return result.length > 0;
  }

  // Author management
  async createAuthor(author: InsertAuthor): Promise<Author> {
    const [newAuthor] = await db.insert(authors).values(author).returning();
    return newAuthor;
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const [author] = await db.select().from(authors).where(eq(authors.id, id));
    return author;
  }

  async getAllAuthors(): Promise<Author[]> {
    return db.select().from(authors).orderBy(asc(authors.name));
  }

  async updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author | undefined> {
    const [updatedAuthor] = await db
      .update(authors)
      .set(author)
      .where(eq(authors.id, id))
      .returning();
    
    return updatedAuthor;
  }

  async deleteAuthor(id: number): Promise<boolean> {
    const result = await db
      .delete(authors)
      .where(eq(authors.id, id))
      .returning({ deletedId: authors.id });
    
    return result.length > 0;
  }

  // Translation Group management
  async createTranslationGroup(group: InsertTranslationGroup): Promise<TranslationGroup> {
    const [newGroup] = await db.insert(translationGroups).values(group).returning();
    return newGroup;
  }

  async getTranslationGroup(id: number): Promise<TranslationGroup | undefined> {
    const [group] = await db.select().from(translationGroups).where(eq(translationGroups.id, id));
    return group;
  }

  async getAllTranslationGroups(): Promise<TranslationGroup[]> {
    return db.select().from(translationGroups).orderBy(asc(translationGroups.name));
  }

  async updateTranslationGroup(id: number, group: Partial<InsertTranslationGroup>): Promise<TranslationGroup | undefined> {
    const [updatedGroup] = await db
      .update(translationGroups)
      .set(group)
      .where(eq(translationGroups.id, id))
      .returning();
    
    return updatedGroup;
  }

  async deleteTranslationGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(translationGroups)
      .where(eq(translationGroups.id, id))
      .returning({ deletedId: translationGroups.id });
    
    return result.length > 0;
  }

  // Content management
  async createContent(contentData: InsertContent, genreIds: number[]): Promise<Content> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert content first
      const [newContent] = await tx.insert(content).values(contentData).returning();
      
      // Insert content-genre relationships
      if (genreIds.length > 0) {
        await tx.insert(contentGenres).values(
          genreIds.map(genreId => ({
            contentId: newContent.id,
            genreId
          }))
        );
      }
      
      return newContent;
    });
  }

  async getContent(id: number): Promise<Content | undefined> {
    const [content] = await db.select().from(content).where(eq(content.id, id));
    return content;
  }

  async getContentWithDetails(id: number): Promise<{ content: Content, genres: Genre[], author: Author, translationGroup?: TranslationGroup } | undefined> {
    const [selectedContent] = await db.select().from(content).where(eq(content.id, id));
    
    if (!selectedContent) {
      return undefined;
    }
    
    // Get author
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, selectedContent.authorId));
    
    if (!author) {
      return undefined;
    }
    
    // Get translation group if exists
    let translationGroup = undefined;
    if (selectedContent.translationGroupId) {
      const [group] = await db
        .select()
        .from(translationGroups)
        .where(eq(translationGroups.id, selectedContent.translationGroupId));
      translationGroup = group;
    }
    
    // Get genres
    const contentGenresRelations = await db
      .select()
      .from(contentGenres)
      .where(eq(contentGenres.contentId, id));
    
    const genreIds = contentGenresRelations.map(relation => relation.genreId);
    const contentGenresList = genreIds.length > 0 
      ? await db.select().from(genres).where(inArray(genres.id, genreIds))
      : [];
    
    return {
      content: selectedContent,
      genres: contentGenresList,
      author,
      translationGroup
    };
  }

  async getAllContent(page: number = 1, limit: number = 10, filter?: Partial<Content>): Promise<{ content: Content[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Build the query conditions based on the filter
    let conditions = true; // Default condition is true (no filter)
    
    if (filter) {
      const filterConditions = [];
      
      if (filter.type) {
        filterConditions.push(eq(content.type, filter.type));
      }
      
      if (filter.authorId) {
        filterConditions.push(eq(content.authorId, filter.authorId));
      }
      
      if (filter.status) {
        filterConditions.push(eq(content.status, filter.status));
      }
      
      // If we have any filter conditions, combine them with AND
      if (filterConditions.length > 0) {
        conditions = and(...filterConditions);
      }
    }
    
    // Get the total count
    const [countResult] = await db
      .select({ count: count() })
      .from(content)
      .where(conditions);
    
    const total = Number(countResult?.count || 0);
    
    // Get the filtered content
    const contentList = await db
      .select()
      .from(content)
      .where(conditions)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(content.createdAt));
    
    return { content: contentList, total };
  }

  async updateContent(id: number, contentData: Partial<InsertContent>, genreIds?: number[]): Promise<Content | undefined> {
    return await db.transaction(async (tx) => {
      // First update the content
      const [updatedContent] = await tx
        .update(content)
        .set(contentData)
        .where(eq(content.id, id))
        .returning();
      
      if (!updatedContent) {
        return undefined;
      }
      
      // If genre IDs were provided, update the content-genre relationships
      if (genreIds && genreIds.length > 0) {
        // First, remove all existing genre relationships for this content
        await tx
          .delete(contentGenres)
          .where(eq(contentGenres.contentId, id));
        
        // Then insert the new relationships
        await tx
          .insert(contentGenres)
          .values(
            genreIds.map(genreId => ({
              contentId: id,
              genreId
            }))
          );
      }
      
      return updatedContent;
    });
  }

  async deleteContent(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First, delete all content-genre relationships
      await tx
        .delete(contentGenres)
        .where(eq(contentGenres.contentId, id));
      
      // Delete all chapters and their content
      const chapters = await tx
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.contentId, id));
      
      const chapterIds = chapters.map(c => c.id);
      
      if (chapterIds.length > 0) {
        // Delete chapter content
        await tx
          .delete(chapterContent)
          .where(inArray(chapterContent.chapterId, chapterIds));
        
        // Delete chapters
        await tx
          .delete(chapters)
          .where(eq(chapters.contentId, id));
      }
      
      // Finally, delete the content
      const result = await tx
        .delete(content)
        .where(eq(content.id, id))
        .returning({ deletedId: content.id });
      
      return result.length > 0;
    });
  }

  async incrementContentViews(id: number): Promise<boolean> {
    const result = await db
      .update(content)
      .set({
        views: sql`${content.views} + 1`
      })
      .where(eq(content.id, id))
      .returning({ updatedId: content.id });
    
    return result.length > 0;
  }

  // Chapter management
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

  async updateChapter(id: number, chapterData: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const [updatedChapter] = await db
      .update(chapters)
      .set(chapterData)
      .where(eq(chapters.id, id))
      .returning();
    
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First delete chapter content
      await tx
        .delete(chapterContent)
        .where(eq(chapterContent.chapterId, id));
      
      // Then delete the chapter
      const result = await tx
        .delete(chapters)
        .where(eq(chapters.id, id))
        .returning({ deletedId: chapters.id });
      
      return result.length > 0;
    });
  }

  async incrementChapterViews(id: number): Promise<boolean> {
    const result = await db
      .update(chapters)
      .set({
        views: sql`${chapters.views} + 1`
      })
      .where(eq(chapters.id, id))
      .returning({ updatedId: chapters.id });
    
    return result.length > 0;
  }

  // Chapter content management
  async createChapterContent(chapterContentData: InsertChapterContent): Promise<ChapterContent> {
    const [newContent] = await db
      .insert(chapterContent)
      .values(chapterContentData)
      .returning();
    
    return newContent;
  }

  async getChapterContentByChapter(chapterId: number): Promise<ChapterContent[]> {
    return db
      .select()
      .from(chapterContent)
      .where(eq(chapterContent.chapterId, chapterId))
      .orderBy(asc(chapterContent.pageOrder));
  }

  async updateChapterContent(id: number, contentData: Partial<InsertChapterContent>): Promise<ChapterContent | undefined> {
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
      .where(eq(chapterContent.id, id))
      .returning({ deletedId: chapterContent.id });
    
    return result.length > 0;
  }

  // Comments management
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({
        ...commentData,
        createdAt: new Date()
      })
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
      .where(eq(comments.contentId, contentId))
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
    const result = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning({ deletedId: comments.id });
    
    return result.length > 0;
  }

  // Reports management
  async createReport(reportData: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values({
        ...reportData,
        createdAt: new Date()
      })
      .returning();
    
    return newReport;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));
    
    return report;
  }

  async getAllReports(page: number = 1, limit: number = 10): Promise<{ reports: Report[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [countResult] = await db
      .select({ count: count() })
      .from(reports);
    
    const total = Number(countResult?.count || 0);
    
    const reportsList = await db
      .select()
      .from(reports)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(reports.createdAt));
    
    return { reports: reportsList, total };
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db
      .delete(reports)
      .where(eq(reports.id, id))
      .returning({ deletedId: reports.id });
    
    return result.length > 0;
  }

  // User activity
  async toggleFavorite(userId: number, contentId: number): Promise<boolean> {
    // Check if the favorite already exists
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.contentId, contentId)
        )
      );
    
    if (existing) {
      // Remove the favorite
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.contentId, contentId)
          )
        );
      return false; // Indicating it's no longer a favorite
    } else {
      // Add the favorite
      await db
        .insert(userFavorites)
        .values({
          userId,
          contentId,
          createdAt: new Date()
        });
      return true; // Indicating it's now a favorite
    }
  }

  async getFavorites(userId: number): Promise<Content[]> {
    const favorites = await db
      .select({
        contentId: userFavorites.contentId
      })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
    
    const contentIds = favorites.map(fav => fav.contentId);
    
    if (contentIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(content)
      .where(inArray(content.id, contentIds))
      .orderBy(desc(content.createdAt));
  }

  async addReadingHistory(userId: number, contentId: number, chapterId: number): Promise<boolean> {
    // Check if the history already exists
    const [existing] = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, userId),
          eq(readingHistory.contentId, contentId),
          eq(readingHistory.chapterId, chapterId)
        )
      );
    
    if (existing) {
      // Update the last read time
      await db
        .update(readingHistory)
        .set({ lastReadAt: new Date() })
        .where(eq(readingHistory.id, existing.id));
    } else {
      // Create a new reading history entry
      await db
        .insert(readingHistory)
        .values({
          userId,
          contentId,
          chapterId,
          lastReadAt: new Date()
        });
    }
    
    return true;
  }

  async getReadingHistory(userId: number): Promise<{ content: Content, chapter: Chapter }[]> {
    // Get the latest chapter read for each content
    const subquery = db
      .select({
        maxId: sql<number>`max(${readingHistory.id})`,
        contentId: readingHistory.contentId
      })
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .groupBy(readingHistory.contentId);
    
    const latestHistories = await db
      .select()
      .from(readingHistory)
      .innerJoin(
        subquery,
        and(
          eq(readingHistory.id, subquery.maxId),
          eq(readingHistory.contentId, subquery.contentId)
        )
      )
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.lastReadAt))
      .limit(20); // Limit to 20 most recent items
    
    // Get content and chapter details
    const result: { content: Content, chapter: Chapter }[] = [];
    
    for (const history of latestHistories) {
      const [contentItem] = await db
        .select()
        .from(content)
        .where(eq(content.id, history.contentId));
      
      const [chapterItem] = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, history.chapterId));
      
      if (contentItem && chapterItem) {
        result.push({
          content: contentItem,
          chapter: chapterItem
        });
      }
    }
    
    return result;
  }

  async unlockChapter(userId: number, chapterId: number): Promise<boolean> {
    await db
      .insert(unlockedChapters)
      .values({
        userId,
        chapterId,
        unlockedAt: new Date()
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
          eq(unlockedChapters.chapterId, chapterId)
        )
      );
    
    return !!unlocked;
  }

  // Payments
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({
        ...paymentData,
        createdAt: new Date()
      })
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

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
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

  async getAllPayments(page: number = 1, limit: number = 10): Promise<{ payments: Payment[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [countResult] = await db
      .select({ count: count() })
      .from(payments);
    
    const total = Number(countResult?.count || 0);
    
    const paymentsList = await db
      .select()
      .from(payments)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(payments.createdAt));
    
    return { payments: paymentsList, total };
  }

  async updatePaymentStatus(id: number, status: 'pending' | 'completed' | 'failed'): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    
    return updatedPayment;
  }

  // Advertisements
  async createAdvertisement(adData: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db
      .insert(advertisements)
      .values(adData)
      .returning();
    
    return newAd;
  }

  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id));
    
    return ad;
  }

  async getActiveAdvertisements(position: 'banner' | 'sidebar' | 'popup'): Promise<Advertisement[]> {
    const now = new Date();
    
    return db
      .select()
      .from(advertisements)
      .where(
        and(
          eq(advertisements.position, position),
          eq(advertisements.isActive, true),
          lte(advertisements.startDate, now),
          gte(advertisements.endDate, now)
        )
      );
  }

  async getAllAdvertisements(page: number = 1, limit: number = 10): Promise<{ ads: Advertisement[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [countResult] = await db
      .select({ count: count() })
      .from(advertisements);
    
    const total = Number(countResult?.count || 0);
    
    const adsList = await db
      .select()
      .from(advertisements)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(advertisements.endDate));
    
    return { ads: adsList, total };
  }

  async updateAdvertisement(id: number, adData: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
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
      .where(eq(advertisements.id, id))
      .returning({ deletedId: advertisements.id });
    
    return result.length > 0;
  }

  async incrementAdViews(id: number): Promise<boolean> {
    const result = await db
      .update(advertisements)
      .set({
        views: sql`${advertisements.views} + 1`
      })
      .where(eq(advertisements.id, id))
      .returning({ updatedId: advertisements.id });
    
    return result.length > 0;
  }

  async incrementAdClicks(id: number): Promise<boolean> {
    const result = await db
      .update(advertisements)
      .set({
        clicks: sql`${advertisements.clicks} + 1`
      })
      .where(eq(advertisements.id, id))
      .returning({ updatedId: advertisements.id });
    
    return result.length > 0;
  }
}