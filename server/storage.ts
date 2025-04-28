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
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getAllUsers(page?: number, limit?: number): Promise<{ users: User[], total: number }>;
  deleteUser(id: number): Promise<boolean>;

  // Genre management
  createGenre(genre: InsertGenre): Promise<Genre>;
  getGenre(id: number): Promise<Genre | undefined>;
  getGenreByName(name: string): Promise<Genre | undefined>;
  getAllGenres(): Promise<Genre[]>;
  updateGenre(id: number, genre: Partial<InsertGenre>): Promise<Genre | undefined>;
  deleteGenre(id: number): Promise<boolean>;

  // Author management
  createAuthor(author: InsertAuthor): Promise<Author>;
  getAuthor(id: number): Promise<Author | undefined>;
  getAllAuthors(): Promise<Author[]>;
  updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author | undefined>;
  deleteAuthor(id: number): Promise<boolean>;

  // Translation Group management
  createTranslationGroup(group: InsertTranslationGroup): Promise<TranslationGroup>;
  getTranslationGroup(id: number): Promise<TranslationGroup | undefined>;
  getAllTranslationGroups(): Promise<TranslationGroup[]>;
  updateTranslationGroup(id: number, group: Partial<InsertTranslationGroup>): Promise<TranslationGroup | undefined>;
  deleteTranslationGroup(id: number): Promise<boolean>;

  // Content management
  createContent(content: InsertContent, genreIds: number[]): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
  getContentWithDetails(id: number): Promise<{ content: Content, genres: Genre[], author: Author, translationGroup?: TranslationGroup } | undefined>;
  getAllContent(page?: number, limit?: number, filter?: Partial<Content>): Promise<{ content: Content[], total: number }>;
  updateContent(id: number, contentData: Partial<InsertContent>, genreIds?: number[]): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;
  incrementContentViews(id: number): Promise<boolean>;

  // Chapter management
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  getChapter(id: number): Promise<Chapter | undefined>;
  getChaptersByContent(contentId: number): Promise<Chapter[]>;
  updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<boolean>;
  incrementChapterViews(id: number): Promise<boolean>;

  // Chapter content management
  createChapterContent(chapterContent: InsertChapterContent): Promise<ChapterContent>;
  getChapterContentByChapter(chapterId: number): Promise<ChapterContent[]>;
  updateChapterContent(id: number, content: Partial<InsertChapterContent>): Promise<ChapterContent | undefined>;
  deleteChapterContent(id: number): Promise<boolean>;

  // Comments management
  createComment(comment: InsertComment): Promise<Comment>;
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByContent(contentId: number): Promise<Comment[]>;
  getCommentsByChapter(chapterId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;

  // Reports management
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(page?: number, limit?: number): Promise<{ reports: Report[], total: number }>;
  deleteReport(id: number): Promise<boolean>;

  // User activity
  toggleFavorite(userId: number, contentId: number): Promise<boolean>;
  getFavorites(userId: number): Promise<Content[]>;
  addReadingHistory(userId: number, contentId: number, chapterId: number): Promise<boolean>;
  getReadingHistory(userId: number): Promise<{ content: Content, chapter: Chapter }[]>;
  unlockChapter(userId: number, chapterId: number): Promise<boolean>;
  isChapterUnlocked(userId: number, chapterId: number): Promise<boolean>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getAllPayments(page?: number, limit?: number): Promise<{ payments: Payment[], total: number }>;
  updatePaymentStatus(id: number, status: 'pending' | 'completed' | 'failed'): Promise<Payment | undefined>;

  // Advertisements
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  getActiveAdvertisements(position: 'banner' | 'sidebar' | 'popup'): Promise<Advertisement[]>;
  getAllAdvertisements(page?: number, limit?: number): Promise<{ ads: Advertisement[], total: number }>;
  updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;
  incrementAdViews(id: number): Promise<boolean>;
  incrementAdClicks(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private genres: Map<number, Genre>;
  private authors: Map<number, Author>;
  private translationGroups: Map<number, TranslationGroup>;
  private content: Map<number, Content>;
  private contentGenres: Map<string, number>;
  private chapters: Map<number, Chapter>;
  private chapterContents: Map<number, ChapterContent>;
  private comments: Map<number, Comment>;
  private reports: Map<number, Report>;
  private userFavorites: Map<string, boolean>;
  private readingHistories: Map<number, { userId: number, contentId: number, chapterId: number, lastReadAt: Date }>;
  private unlockedChapters: Map<string, { unlockedAt: Date }>;
  private payments: Map<number, Payment>;
  private advertisements: Map<number, Advertisement>;
  
  private userId: number = 1;
  private genreId: number = 1;
  private authorId: number = 1;
  private translationGroupId: number = 1;
  private contentId: number = 1;
  private chapterId: number = 1;
  private chapterContentId: number = 1;
  private commentId: number = 1;
  private reportId: number = 1;
  private readingHistoryId: number = 1;
  private paymentId: number = 1;
  private advertisementId: number = 1;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.genres = new Map();
    this.authors = new Map();
    this.translationGroups = new Map();
    this.content = new Map();
    this.contentGenres = new Map();
    this.chapters = new Map();
    this.chapterContents = new Map();
    this.comments = new Map();
    this.reports = new Map();
    this.userFavorites = new Map();
    this.readingHistories = new Map();
    this.unlockedChapters = new Map();
    this.payments = new Map();
    this.advertisements = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add admin user
    this.createUser({
      username: 'admin',
      password: '$2b$10$kO5G7fXNSQkUv9zjFtGGt.IkPGVKAoJ9QADMvIT.Eotfk9UBOeDqu', // Hashed 'admin123'
      email: 'admin@example.com',
      role: 'admin'
    });

    // Seed some initial data
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // Seed genres
    const genreIds = [
      this.createGenre({ name: 'Action', description: 'Action packed content' }).id,
      this.createGenre({ name: 'Adventure', description: 'Exploration and journey content' }).id,
      this.createGenre({ name: 'Romance', description: 'Love and relationship focused content' }).id,
      this.createGenre({ name: 'Fantasy', description: 'Magical and supernatural elements' }).id,
      this.createGenre({ name: 'Sci-Fi', description: 'Science fiction themes' }).id,
      this.createGenre({ name: 'Horror', description: 'Scary and frightening content' }).id,
      this.createGenre({ name: 'Comedy', description: 'Humorous content' }).id,
      this.createGenre({ name: 'Drama', description: 'Emotional and serious themes' }).id,
    ];

    // Seed authors
    const authorIds = [
      this.createAuthor({ name: 'Takahashi Rumiko', info: 'Famous manga author', birthDate: '1957-10-10' }).id,
      this.createAuthor({ name: 'Oda Eiichiro', info: 'One Piece creator', birthDate: '1975-01-01' }).id,
      this.createAuthor({ name: 'Miyazaki Hayao', info: 'Film director and manga artist', birthDate: '1941-01-05' }).id,
    ];

    // Seed translation groups
    const groupIds = [
      this.createTranslationGroup({ name: 'Manga Plus', description: 'Official translations', foundedDate: '2010-01-01' }).id,
      this.createTranslationGroup({ name: 'Fan Translators', description: 'Community translations', foundedDate: '2015-05-05' }).id,
    ];

    // Seed content
    const manga1 = this.createContent(
      {
        title: 'Demon Slayer',
        alternativeTitle: 'Kimetsu no Yaiba',
        type: 'manga',
        authorId: authorIds[0],
        translationGroupId: groupIds[0],
        releaseYear: '2016',
        status: 'completed',
        description: 'A boy fights demons after his family is slaughtered',
        coverImage: 'https://example.com/demon-slayer.jpg',
      },
      [genreIds[0], genreIds[1], genreIds[3]]
    );

    const manga2 = this.createContent(
      {
        title: 'One Piece',
        alternativeTitle: 'ワンピース',
        type: 'manga',
        authorId: authorIds[1],
        translationGroupId: groupIds[0],
        releaseYear: '1997',
        status: 'ongoing',
        description: 'Pirates search for the ultimate treasure',
        coverImage: 'https://example.com/one-piece.jpg',
      },
      [genreIds[0], genreIds[1], genreIds[6]]
    );

    const novel1 = this.createContent(
      {
        title: 'The Wind Rises',
        alternativeTitle: '風立ちぬ',
        type: 'novel',
        authorId: authorIds[2],
        translationGroupId: groupIds[1],
        releaseYear: '2013',
        status: 'completed',
        description: 'A fictionalized biography of aircraft designer Jiro Horikoshi',
        coverImage: 'https://example.com/wind-rises.jpg',
      },
      [genreIds[2], genreIds[7]]
    );

    // Seed chapters for manga1
    const chapter1 = this.createChapter({
      contentId: manga1.id,
      number: 1,
      title: 'Cruelty',
      releaseDate: new Date('2016-02-15'),
      isLocked: false,
    });

    const chapter2 = this.createChapter({
      contentId: manga1.id,
      number: 2,
      title: 'Trainer Sakonji Urokodaki',
      releaseDate: new Date('2016-02-22'),
      isLocked: true,
      unlockPrice: 2000, // 2000 VND
    });

    // Add chapter content
    this.createChapterContent({
      chapterId: chapter1.id,
      pageOrder: 1,
      imageUrl: 'https://example.com/demon-slayer/ch1/page1.jpg',
    });

    this.createChapterContent({
      chapterId: chapter1.id,
      pageOrder: 2,
      imageUrl: 'https://example.com/demon-slayer/ch1/page2.jpg',
    });

    // Seed chapters for novel1
    const novelChapter1 = this.createChapter({
      contentId: novel1.id,
      number: 1,
      title: 'Dreams of Flight',
      releaseDate: new Date('2013-07-20'),
      isLocked: false,
    });

    // Add novel content
    this.createChapterContent({
      chapterId: novelChapter1.id,
      content: 'The wind is rising! We must try to live! These words from Valéry\'s poem "Le Cimetière Marin" are spoken by the protagonist...',
    });

    // Seed advertisements
    this.createAdvertisement({
      title: 'Premium Membership Promotion',
      imageUrl: 'https://example.com/ads/premium.jpg',
      targetUrl: 'https://example.com/premium',
      position: 'banner',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    });

    this.createAdvertisement({
      title: 'New Manga Collection',
      imageUrl: 'https://example.com/ads/manga-collection.jpg',
      targetUrl: 'https://example.com/collection',
      position: 'sidebar',
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      isActive: true,
    });
  }

  private getKeyByUserIdContentId(userId: number, contentId: number): string {
    return `${userId}-${contentId}`;
  }

  private getKeyByUserIdChapterId(userId: number, chapterId: number): string {
    return `${userId}-${chapterId}`;
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      balance: 0,
      createdAt: now 
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      balance: user.balance + amount 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const allUsers = Array.from(this.users.values());
    const total = allUsers.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = allUsers.slice(start, end);
    return { users: paginatedUsers, total };
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Genre management
  async createGenre(genre: InsertGenre): Promise<Genre> {
    const id = this.genreId++;
    const newGenre: Genre = { ...genre, id };
    this.genres.set(id, newGenre);
    return newGenre;
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async getGenreByName(name: string): Promise<Genre | undefined> {
    return Array.from(this.genres.values()).find(genre => genre.name === name);
  }

  async getAllGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async updateGenre(id: number, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    const existingGenre = this.genres.get(id);
    if (!existingGenre) return undefined;
    
    const updatedGenre = { ...existingGenre, ...genre };
    this.genres.set(id, updatedGenre);
    return updatedGenre;
  }

  async deleteGenre(id: number): Promise<boolean> {
    return this.genres.delete(id);
  }

  // Author management
  async createAuthor(author: InsertAuthor): Promise<Author> {
    const id = this.authorId++;
    const newAuthor: Author = { ...author, id };
    this.authors.set(id, newAuthor);
    return newAuthor;
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    return this.authors.get(id);
  }

  async getAllAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author | undefined> {
    const existingAuthor = this.authors.get(id);
    if (!existingAuthor) return undefined;
    
    const updatedAuthor = { ...existingAuthor, ...author };
    this.authors.set(id, updatedAuthor);
    return updatedAuthor;
  }

  async deleteAuthor(id: number): Promise<boolean> {
    return this.authors.delete(id);
  }

  // Translation Group management
  async createTranslationGroup(group: InsertTranslationGroup): Promise<TranslationGroup> {
    const id = this.translationGroupId++;
    const newGroup: TranslationGroup = { ...group, id };
    this.translationGroups.set(id, newGroup);
    return newGroup;
  }

  async getTranslationGroup(id: number): Promise<TranslationGroup | undefined> {
    return this.translationGroups.get(id);
  }

  async getAllTranslationGroups(): Promise<TranslationGroup[]> {
    return Array.from(this.translationGroups.values());
  }

  async updateTranslationGroup(id: number, group: Partial<InsertTranslationGroup>): Promise<TranslationGroup | undefined> {
    const existingGroup = this.translationGroups.get(id);
    if (!existingGroup) return undefined;
    
    const updatedGroup = { ...existingGroup, ...group };
    this.translationGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteTranslationGroup(id: number): Promise<boolean> {
    return this.translationGroups.delete(id);
  }

  // Content management
  async createContent(contentData: InsertContent, genreIds: number[]): Promise<Content> {
    const id = this.contentId++;
    const now = new Date();
    const newContent: Content = { 
      ...contentData, 
      id, 
      views: 0, 
      createdAt: now 
    };
    this.content.set(id, newContent);
    
    // Add genres
    genreIds.forEach(genreId => {
      this.contentGenres.set(`${id}-${genreId}`, genreId);
    });
    
    return newContent;
  }

  async getContent(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getContentWithDetails(id: number): Promise<{ content: Content, genres: Genre[], author: Author, translationGroup?: TranslationGroup } | undefined> {
    const content = this.content.get(id);
    if (!content) return undefined;
    
    const author = this.authors.get(content.authorId);
    if (!author) return undefined;
    
    const translationGroup = content.translationGroupId 
      ? this.translationGroups.get(content.translationGroupId) 
      : undefined;
    
    const contentGenreEntries = Array.from(this.contentGenres.entries())
      .filter(([key]) => key.startsWith(`${id}-`))
      .map(([_, genreId]) => this.genres.get(genreId))
      .filter((genre): genre is Genre => genre !== undefined);
    
    return {
      content,
      genres: contentGenreEntries,
      author,
      translationGroup
    };
  }

  async getAllContent(page: number = 1, limit: number = 10, filter?: Partial<Content>): Promise<{ content: Content[], total: number }> {
    let allContent = Array.from(this.content.values());
    
    // Apply filters if provided
    if (filter) {
      allContent = allContent.filter(item => {
        let match = true;
        if (filter.type !== undefined && item.type !== filter.type) match = false;
        if (filter.authorId !== undefined && item.authorId !== filter.authorId) match = false;
        if (filter.status !== undefined && item.status !== filter.status) match = false;
        return match;
      });
    }
    
    const total = allContent.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedContent = allContent.slice(start, end);
    return { content: paginatedContent, total };
  }

  async updateContent(id: number, contentData: Partial<InsertContent>, genreIds?: number[]): Promise<Content | undefined> {
    const existingContent = this.content.get(id);
    if (!existingContent) return undefined;
    
    const updatedContent = { ...existingContent, ...contentData };
    this.content.set(id, updatedContent);
    
    // Update genres if provided
    if (genreIds) {
      // Remove existing genre associations
      Array.from(this.contentGenres.keys())
        .filter(key => key.startsWith(`${id}-`))
        .forEach(key => this.contentGenres.delete(key));
      
      // Add new genre associations
      genreIds.forEach(genreId => {
        this.contentGenres.set(`${id}-${genreId}`, genreId);
      });
    }
    
    return updatedContent;
  }

  async deleteContent(id: number): Promise<boolean> {
    // Remove genre associations
    Array.from(this.contentGenres.keys())
      .filter(key => key.startsWith(`${id}-`))
      .forEach(key => this.contentGenres.delete(key));
    
    // Remove chapters
    const chaptersToDelete = Array.from(this.chapters.values())
      .filter(chapter => chapter.contentId === id);
    
    chaptersToDelete.forEach(chapter => {
      this.deleteChapter(chapter.id);
    });
    
    return this.content.delete(id);
  }

  async incrementContentViews(id: number): Promise<boolean> {
    const content = this.content.get(id);
    if (!content) return false;
    
    const updatedContent = { ...content, views: content.views + 1 };
    this.content.set(id, updatedContent);
    return true;
  }

  // Chapter management
  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    const id = this.chapterId++;
    const newChapter: Chapter = { 
      ...chapterData, 
      id, 
      views: 0 
    };
    this.chapters.set(id, newChapter);
    return newChapter;
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async getChaptersByContent(contentId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter(chapter => chapter.contentId === contentId)
      .sort((a, b) => a.number - b.number);
  }

  async updateChapter(id: number, chapterData: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const existingChapter = this.chapters.get(id);
    if (!existingChapter) return undefined;
    
    const updatedChapter = { ...existingChapter, ...chapterData };
    this.chapters.set(id, updatedChapter);
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    // Delete chapter content
    Array.from(this.chapterContents.values())
      .filter(content => content.chapterId === id)
      .forEach(content => {
        this.chapterContents.delete(content.id);
      });
    
    return this.chapters.delete(id);
  }

  async incrementChapterViews(id: number): Promise<boolean> {
    const chapter = this.chapters.get(id);
    if (!chapter) return false;
    
    const updatedChapter = { ...chapter, views: chapter.views + 1 };
    this.chapters.set(id, updatedChapter);
    return true;
  }

  // Chapter content management
  async createChapterContent(chapterContentData: InsertChapterContent): Promise<ChapterContent> {
    const id = this.chapterContentId++;
    const newChapterContent: ChapterContent = { ...chapterContentData, id };
    this.chapterContents.set(id, newChapterContent);
    return newChapterContent;
  }

  async getChapterContentByChapter(chapterId: number): Promise<ChapterContent[]> {
    return Array.from(this.chapterContents.values())
      .filter(content => content.chapterId === chapterId)
      .sort((a, b) => {
        // Sort by pageOrder for manga
        if (a.pageOrder !== undefined && b.pageOrder !== undefined) {
          return a.pageOrder - b.pageOrder;
        }
        return 0;
      });
  }

  async updateChapterContent(id: number, contentData: Partial<InsertChapterContent>): Promise<ChapterContent | undefined> {
    const existingContent = this.chapterContents.get(id);
    if (!existingContent) return undefined;
    
    const updatedContent = { ...existingContent, ...contentData };
    this.chapterContents.set(id, updatedContent);
    return updatedContent;
  }

  async deleteChapterContent(id: number): Promise<boolean> {
    return this.chapterContents.delete(id);
  }

  // Comments management
  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const now = new Date();
    const newComment: Comment = { ...commentData, id, createdAt: now };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByContent(contentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCommentsByChapter(chapterId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.chapterId === chapterId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Reports management
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.reportId++;
    const now = new Date();
    const newReport: Report = { ...reportData, id, createdAt: now };
    this.reports.set(id, newReport);
    return newReport;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getAllReports(page: number = 1, limit: number = 10): Promise<{ reports: Report[], total: number }> {
    const allReports = Array.from(this.reports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = allReports.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedReports = allReports.slice(start, end);
    return { reports: paginatedReports, total };
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // User activity
  async toggleFavorite(userId: number, contentId: number): Promise<boolean> {
    const key = this.getKeyByUserIdContentId(userId, contentId);
    if (this.userFavorites.has(key)) {
      this.userFavorites.delete(key);
      return false; // no longer favorite
    } else {
      this.userFavorites.set(key, true);
      return true; // now favorite
    }
  }

  async getFavorites(userId: number): Promise<Content[]> {
    const favoriteContentIds = Array.from(this.userFavorites.entries())
      .filter(([key, value]) => key.startsWith(`${userId}-`) && value)
      .map(([key]) => parseInt(key.split('-')[1]));
    
    return favoriteContentIds
      .map(id => this.content.get(id))
      .filter((content): content is Content => content !== undefined);
  }

  async addReadingHistory(userId: number, contentId: number, chapterId: number): Promise<boolean> {
    const id = this.readingHistoryId++;
    const now = new Date();
    
    this.readingHistories.set(id, {
      userId,
      contentId,
      chapterId,
      lastReadAt: now
    });
    
    return true;
  }

  async getReadingHistory(userId: number): Promise<{ content: Content, chapter: Chapter }[]> {
    const userHistory = Array.from(this.readingHistories.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime());
    
    // Group by contentId and get the most recent chapter for each content
    const contentMap = new Map<number, { contentId: number, chapterId: number, lastReadAt: Date }>();
    
    userHistory.forEach(history => {
      const existing = contentMap.get(history.contentId);
      if (!existing || history.lastReadAt > existing.lastReadAt) {
        contentMap.set(history.contentId, history);
      }
    });
    
    // Get content and chapter objects
    return Array.from(contentMap.values())
      .map(history => {
        const content = this.content.get(history.contentId);
        const chapter = this.chapters.get(history.chapterId);
        
        if (content && chapter) {
          return { content, chapter };
        }
        return null;
      })
      .filter((item): item is { content: Content, chapter: Chapter } => item !== null);
  }

  async unlockChapter(userId: number, chapterId: number): Promise<boolean> {
    const key = this.getKeyByUserIdChapterId(userId, chapterId);
    const now = new Date();
    
    this.unlockedChapters.set(key, { unlockedAt: now });
    return true;
  }

  async isChapterUnlocked(userId: number, chapterId: number): Promise<boolean> {
    const key = this.getKeyByUserIdChapterId(userId, chapterId);
    return this.unlockedChapters.has(key);
  }

  // Payments
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const now = new Date();
    const newPayment: Payment = { ...paymentData, id, createdAt: now };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values())
      .find(payment => payment.transactionId === transactionId);
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllPayments(page: number = 1, limit: number = 10): Promise<{ payments: Payment[], total: number }> {
    const allPayments = Array.from(this.payments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = allPayments.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPayments = allPayments.slice(start, end);
    return { payments: paginatedPayments, total };
  }

  async updatePaymentStatus(id: number, status: 'pending' | 'completed' | 'failed'): Promise<Payment | undefined> {
    const existingPayment = this.payments.get(id);
    if (!existingPayment) return undefined;
    
    const updatedPayment = { ...existingPayment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Advertisements
  async createAdvertisement(adData: InsertAdvertisement): Promise<Advertisement> {
    const id = this.advertisementId++;
    const newAd: Advertisement = { 
      ...adData, 
      id, 
      views: 0, 
      clicks: 0 
    };
    this.advertisements.set(id, newAd);
    return newAd;
  }

  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    return this.advertisements.get(id);
  }

  async getActiveAdvertisements(position: 'banner' | 'sidebar' | 'popup'): Promise<Advertisement[]> {
    const now = new Date();
    return Array.from(this.advertisements.values())
      .filter(ad => 
        ad.position === position && 
        ad.isActive && 
        ad.startDate <= now && 
        ad.endDate >= now
      );
  }

  async getAllAdvertisements(page: number = 1, limit: number = 10): Promise<{ ads: Advertisement[], total: number }> {
    const allAds = Array.from(this.advertisements.values())
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    const total = allAds.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedAds = allAds.slice(start, end);
    return { ads: paginatedAds, total };
  }

  async updateAdvertisement(id: number, adData: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const existingAd = this.advertisements.get(id);
    if (!existingAd) return undefined;
    
    const updatedAd = { ...existingAd, ...adData };
    this.advertisements.set(id, updatedAd);
    return updatedAd;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    return this.advertisements.delete(id);
  }

  async incrementAdViews(id: number): Promise<boolean> {
    const ad = this.advertisements.get(id);
    if (!ad) return false;
    
    const updatedAd = { ...ad, views: ad.views + 1 };
    this.advertisements.set(id, updatedAd);
    return true;
  }

  async incrementAdClicks(id: number): Promise<boolean> {
    const ad = this.advertisements.get(id);
    if (!ad) return false;
    
    const updatedAd = { ...ad, clicks: ad.clicks + 1 };
    this.advertisements.set(id, updatedAd);
    return true;
  }
}

export const storage = new MemStorage();
