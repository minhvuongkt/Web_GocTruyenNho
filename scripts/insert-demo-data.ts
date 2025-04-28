import { db } from '../server/db';
import * as schema from '../shared/schema';
import { hashPassword } from '../server/auth';
import { eq } from 'drizzle-orm';

async function insertDemoData() {
  console.log('Inserting demo data...');

  // Insert users
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  const [admin] = await db.insert(schema.users).values({
    username: 'admin',
    password: adminPassword,
    email: 'admin@example.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    balance: 10000,
    isActive: true
  }).returning();
  
  const [regularUser] = await db.insert(schema.users).values({
    username: 'user',
    password: userPassword,
    email: 'user@example.com',
    role: 'user',
    firstName: 'Regular',
    lastName: 'User',
    balance: 5000,
    isActive: true
  }).returning();

  console.log(`Created users: admin (id: ${admin.id}), user (id: ${regularUser.id})`);

  // Insert genres
  const genresData = [
    { name: 'Action', description: 'Action-packed stories with intense sequences' },
    { name: 'Adventure', description: 'Stories about exciting journeys and quests' },
    { name: 'Comedy', description: 'Humorous and light-hearted stories' },
    { name: 'Drama', description: 'Emotionally intense stories focused on character development' },
    { name: 'Fantasy', description: 'Stories with magical elements and supernatural phenomena' },
    { name: 'Horror', description: 'Scary stories designed to frighten readers' },
    { name: 'Mystery', description: 'Stories involving solving crimes or puzzles' },
    { name: 'Romance', description: 'Stories focused on romantic relationships' },
    { name: 'Sci-Fi', description: 'Stories exploring advanced technology and scientific concepts' },
    { name: 'Slice of Life', description: 'Stories depicting everyday experiences' }
  ];

  for (const genre of genresData) {
    await db.insert(schema.genres).values(genre);
  }

  console.log(`Created ${genresData.length} genres`);

  // Insert authors
  const authorsData = [
    { name: 'Eiichiro Oda', bio: 'Creator of One Piece', country: 'Japan' },
    { name: 'Hajime Isayama', bio: 'Creator of Attack on Titan', country: 'Japan' },
    { name: 'Akira Toriyama', bio: 'Creator of Dragon Ball', country: 'Japan' },
    { name: 'ONE', bio: 'Creator of One Punch Man', country: 'Japan' },
    { name: 'Sui Ishida', bio: 'Creator of Tokyo Ghoul', country: 'Japan' }
  ];

  const authors = [];
  for (const author of authorsData) {
    const [newAuthor] = await db.insert(schema.authors).values(author).returning();
    authors.push(newAuthor);
  }

  console.log(`Created ${authors.length} authors`);

  // Insert translation groups
  const translationGroupsData = [
    { name: 'MangaPlus', description: 'Official manga translation service', website: 'https://mangaplus.shueisha.co.jp' },
    { name: 'ScanGroup', description: 'Fan translation group', website: 'https://example.com/scangroup' },
    { name: 'NovelTranslations', description: 'Novel translation group', website: 'https://example.com/noveltrans' }
  ];

  const translationGroups = [];
  for (const group of translationGroupsData) {
    const [newGroup] = await db.insert(schema.translationGroups).values(group).returning();
    translationGroups.push(newGroup);
  }

  console.log(`Created ${translationGroups.length} translation groups`);

  // Fetch all genres for assignment
  const genres = await db.select().from(schema.genres);

  // Insert content
  const contentData = [
    {
      title: 'One Piece',
      description: 'The story follows the adventures of Monkey D. Luffy and his crew as they explore the Grand Line in search of the world\'s ultimate treasure.',
      coverImage: 'https://example.com/one-piece-cover.jpg',
      type: 'manga',
      status: 'ongoing',
      authorId: authors[0].id,
      translationGroupId: translationGroups[0].id,
      isPublished: true,
      viewCount: 10000,
      genreIds: [genres[0].id, genres[1].id] // Action, Adventure
    },
    {
      title: 'Attack on Titan',
      description: 'In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
      coverImage: 'https://example.com/attack-on-titan-cover.jpg',
      type: 'manga',
      status: 'completed',
      authorId: authors[1].id,
      translationGroupId: translationGroups[0].id,
      isPublished: true,
      viewCount: 8000,
      genreIds: [genres[0].id, genres[3].id] // Action, Drama
    },
    {
      title: 'Dragon Ball',
      description: 'The series follows the adventures of protagonist Son Goku from his childhood through adulthood as he trains in martial arts.',
      coverImage: 'https://example.com/dragon-ball-cover.jpg',
      type: 'manga',
      status: 'completed',
      authorId: authors[2].id,
      translationGroupId: translationGroups[1].id,
      isPublished: true,
      viewCount: 9500,
      genreIds: [genres[0].id, genres[1].id, genres[2].id] // Action, Adventure, Comedy
    },
    {
      title: 'One Punch Man',
      description: 'The story follows Saitama, a superhero who can defeat any opponent with a single punch but seeks to find a worthy opponent.',
      coverImage: 'https://example.com/one-punch-man-cover.jpg',
      type: 'manga',
      status: 'ongoing',
      authorId: authors[3].id,
      translationGroupId: translationGroups[1].id,
      isPublished: true,
      viewCount: 7800,
      genreIds: [genres[0].id, genres[2].id] // Action, Comedy
    },
    {
      title: 'Tokyo Ghoul',
      description: 'The story follows Ken Kaneki, a college student who barely survives a deadly encounter with Rize Kamishiro, his date who reveals herself as a ghoul.',
      coverImage: 'https://example.com/tokyo-ghoul-cover.jpg',
      type: 'manga',
      status: 'completed',
      authorId: authors[4].id,
      translationGroupId: translationGroups[0].id,
      isPublished: true,
      viewCount: 7200,
      genreIds: [genres[0].id, genres[3].id, genres[5].id] // Action, Drama, Horror
    }
  ];

  const contents = [];
  for (const item of contentData) {
    const { genreIds, ...contentItem } = item;
    const [newContent] = await db.insert(schema.content).values(contentItem).returning();
    
    // Insert content-genre relations
    for (const genreId of genreIds) {
      await db.insert(schema.contentGenres).values({
        contentId: newContent.id,
        genreId: genreId
      });
    }
    
    contents.push(newContent);
  }

  console.log(`Created ${contents.length} content items`);

  // Insert chapters
  for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
    const content = contents[contentIndex];
    const chapterCount = contentIndex === 0 ? 5 : 3; // More chapters for first content
    
    for (let i = 1; i <= chapterCount; i++) {
      const [chapter] = await db.insert(schema.chapters).values({
        contentId: content.id,
        title: `Chapter ${i}: The Beginning`,
        number: i,
        price: i > 2 ? 500 : 0, // Make chapters after chapter 2 paid
        viewCount: 1000 - (i * 100),
        createdAt: new Date()
      }).returning();
      
      // Insert chapter content based on content type
      if (content.type === 'manga') {
        // For manga, add multiple image pages
        for (let page = 1; page <= 5; page++) {
          await db.insert(schema.chapterContent).values({
            chapterId: chapter.id,
            pageOrder: page,
            imageUrl: `https://example.com/manga/${content.id}/chapter-${i}/page-${page}.jpg`
          });
        }
      } else {
        // For novels, add text content
        await db.insert(schema.chapterContent).values({
          chapterId: chapter.id,
          content: `This is the content of chapter ${i} for ${content.title}. It's a lengthy text that continues the story from the previous chapter. The protagonist faces new challenges and meets interesting characters along the way.`
        });
      }
      
      // Add comments to each chapter
      await db.insert(schema.comments).values({
        userId: admin.id,
        contentId: content.id,
        chapterId: chapter.id,
        text: `Great chapter! I really enjoyed the part where the main character overcomes their challenge.`
      });
      
      await db.insert(schema.comments).values({
        userId: regularUser.id,
        contentId: content.id,
        chapterId: chapter.id,
        text: `I can't wait for the next chapter! The cliffhanger at the end was amazing.`
      });
    }
  }

  console.log(`Created chapters and comments`);

  // Add some favorites and reading history
  for (let i = 0; i < 3; i++) {
    // Add to favorites
    await db.insert(schema.userFavorites).values({
      userId: regularUser.id,
      contentId: contents[i].id
    });
    
    // Add to reading history
    const chapters = await db.select().from(schema.chapters).where(eq(schema.chapters.contentId, contents[i].id));
    if (chapters.length > 0) {
      await db.insert(schema.readingHistory).values({
        userId: regularUser.id,
        contentId: contents[i].id,
        chapterId: chapters[0].id,
        lastReadAt: new Date()
      });
    }
  }

  console.log('Added user favorites and reading history');

  // Create payment settings
  await db.insert(schema.paymentSettings).values({
    bankConfig: {
      name: 'Example Bank',
      accountNumber: '1234567890',
      accountName: 'Site Admin'
    },
    vietQRConfig: {
      bankId: 'TCB',
      accountNumber: '1234567890',
      accountName: 'Site Admin',
      template: 'compact'
    },
    priceConfig: {
      defaultUnlockPrice: 500,
      minDepositAmount: 5000,
      maxDepositAmount: 1000000
    }
  });

  console.log('Created payment settings');

  // Create advertisements
  const adsData = [
    {
      title: 'Banner Advertisement',
      imageUrl: 'https://example.com/ads/banner1.jpg',
      targetUrl: 'https://example.com/promo1',
      position: 'banner',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      viewCount: 500,
      clickCount: 25
    },
    {
      title: 'Sidebar Advertisement',
      imageUrl: 'https://example.com/ads/sidebar1.jpg',
      targetUrl: 'https://example.com/promo2',
      position: 'sidebar',
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      isActive: true,
      viewCount: 300,
      clickCount: 15
    }
  ];

  for (const ad of adsData) {
    await db.insert(schema.advertisements).values(ad);
  }

  console.log(`Created ${adsData.length} advertisements`);

  console.log('Demo data insertion complete!');
}

insertDemoData()
  .then(() => {
    console.log('Successfully inserted all demo data');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error inserting demo data:', error);
    process.exit(1);
  });