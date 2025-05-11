import { db } from "../server/db";
import {
  users,
  authors,
  translationGroups,
  genres,
  content,
  contentGenres,
  chapters,
  chapterContent,
  advertisements,
  externalAdConfigs,
  paymentSettings,
} from "../shared/schema";
import { hashPassword } from "../server/auth";

async function populateSampleData() {
  console.log("Starting to populate sample data...");

  try {
    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      balance: 1000,
    }).onConflictDoNothing();

    console.log("Created admin user");

    // Create regular user
    const userPassword = await hashPassword("user123");
    await db.insert(users).values({
      username: "user",
      password: userPassword,
      email: "user@example.com",
      role: "user",
      firstName: "Regular",
      lastName: "User",
      balance: 500,
    }).onConflictDoNothing();

    console.log("Created regular user");

    // Create genres
    const genreData = [
      { name: "Action", description: "Genre involving excitement, energy and risk" },
      { name: "Adventure", description: "Genre involving exciting activities and often danger" },
      { name: "Romance", description: "Genre that focuses on the romantic relationships between characters" },
      { name: "Comedy", description: "Genre intended to be humorous or amusing by inducing laughter" },
      { name: "Drama", description: "Genre characterized by serious plot and themes that elicit strong emotions" },
      { name: "Fantasy", description: "Genre featuring magical or supernatural elements" },
      { name: "Horror", description: "Genre intended to frighten, scare, or disgust" },
      { name: "Mystery", description: "Genre that revolves around the solution of a crime or a problem" },
      { name: "Sci-Fi", description: "Genre based on imagined future scientific or technological advances" },
      { name: "Slice of Life", description: "Genre portraying day-to-day experiences of characters" },
    ];

    for (const genre of genreData) {
      await db.insert(genres).values(genre).onConflictDoNothing();
    }
    
    console.log("Created genres");

    // Create authors
    const authorData = [
      { name: "Eiichiro Oda", info: "Japanese manga artist and creator of One Piece", birthDate: "1975-01-01" },
      { name: "Akira Toriyama", info: "Japanese manga artist and creator of Dragon Ball", birthDate: "1955-04-05" },
      { name: "J.K. Rowling", info: "British author and creator of Harry Potter", birthDate: "1965-07-31" },
      { name: "George R.R. Martin", info: "American novelist and creator of A Song of Ice and Fire", birthDate: "1948-09-20" },
      { name: "Hajime Isayama", info: "Japanese manga artist and creator of Attack on Titan", birthDate: "1986-08-29" },
    ];

    for (const author of authorData) {
      await db.insert(authors).values(author).onConflictDoNothing();
    }
    
    console.log("Created authors");

    // Create translation groups
    const translationGroupData = [
      { name: "Manga Plus", description: "Official translation group for Shueisha manga", foundedDate: "2019-01-28" },
      { name: "Viz Media", description: "American manga publisher and anime distributor", foundedDate: "1986-07-01" },
      { name: "Fan Translators", description: "Group of fans who translate manga and novels", foundedDate: "2010-03-15" },
      { name: "Novel Horizon", description: "Translation group specializing in light novels", foundedDate: "2015-06-12" },
    ];

    for (const group of translationGroupData) {
      await db.insert(translationGroups).values(group).onConflictDoNothing();
    }
    
    console.log("Created translation groups");

    // Get IDs for reference
    const [onePiece] = await db.select().from(authors).where(authors.name === "Eiichiro Oda");
    const [dragonBall] = await db.select().from(authors).where(authors.name === "Akira Toriyama");
    const [harryPotter] = await db.select().from(authors).where(authors.name === "J.K. Rowling");
    const [asoiaf] = await db.select().from(authors).where(authors.name === "George R.R. Martin");
    const [aot] = await db.select().from(authors).where(authors.name === "Hajime Isayama");

    const [mangaPlus] = await db.select().from(translationGroups).where(translationGroups.name === "Manga Plus");
    const [vizMedia] = await db.select().from(translationGroups).where(translationGroups.name === "Viz Media");
    const [fanTranslators] = await db.select().from(translationGroups).where(translationGroups.name === "Fan Translators");
    const [novelHorizon] = await db.select().from(translationGroups).where(translationGroups.name === "Novel Horizon");

    // Create content
    const contentData = [
      {
        title: "One Piece",
        alternativeTitle: "Wan Pīsu",
        type: "manga",
        authorId: onePiece?.id || 1,
        translationGroupId: mangaPlus?.id || 1,
        releaseYear: "1997",
        status: "ongoing",
        description: "The series focuses on Monkey D. Luffy, a young man made of rubber, who, inspired by his childhood idol, the powerful pirate Red-Haired Shanks, sets off on a journey from the East Blue Sea to find the mythical treasure, the One Piece, and proclaim himself the King of the Pirates.",
        coverImage: "/uploads/content-images/one-piece.jpg",
        views: 1500,
      },
      {
        title: "Dragon Ball",
        alternativeTitle: "Doragon Bōru",
        type: "manga",
        authorId: dragonBall?.id || 2,
        translationGroupId: vizMedia?.id || 2,
        releaseYear: "1984",
        status: "completed",
        description: "The series follows the adventures of Son Goku from his childhood through adulthood as he trains in martial arts and explores the world in search of the seven mystical Dragon Balls that can summon a wish-granting dragon.",
        coverImage: "/uploads/content-images/dragon-ball.jpg",
        views: 1200,
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        alternativeTitle: "Harry Potter and the Sorcerer's Stone",
        type: "novel",
        authorId: harryPotter?.id || 3,
        translationGroupId: null,
        releaseYear: "1997",
        status: "completed",
        description: "The first novel in the Harry Potter series follows Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday, when he receives a letter of acceptance to Hogwarts School of Witchcraft and Wizardry.",
        coverImage: "/uploads/content-images/harry-potter.jpg",
        views: 2000,
      },
      {
        title: "A Game of Thrones",
        alternativeTitle: "A Song of Ice and Fire - Book 1",
        type: "novel",
        authorId: asoiaf?.id || 4,
        translationGroupId: null,
        releaseYear: "1996",
        status: "completed",
        description: "The first novel in the A Song of Ice and Fire series tells the story of several noble houses fighting for the Iron Throne in the Seven Kingdoms of Westeros.",
        coverImage: "/uploads/content-images/game-of-thrones.jpg",
        views: 1800,
      },
      {
        title: "Attack on Titan",
        alternativeTitle: "Shingeki no Kyojin",
        type: "manga",
        authorId: aot?.id || 5,
        translationGroupId: fanTranslators?.id || 3,
        releaseYear: "2009",
        status: "completed",
        description: "The story follows Eren Yeager, who vows to exterminate the Titans after they bring about the destruction of his hometown and the death of his mother.",
        coverImage: "/uploads/content-images/attack-on-titan.jpg",
        views: 1300,
      },
    ];

    for (const item of contentData) {
      const [exists] = await db.select().from(content).where(content.title === item.title);
      if (!exists) {
        await db.insert(content).values(item);
      }
    }
    
    console.log("Created content items");

    // Add genre relationships
    // Fetch content IDs
    const [onePieceContent] = await db.select().from(content).where(content.title === "One Piece");
    const [dragonBallContent] = await db.select().from(content).where(content.title === "Dragon Ball");
    const [harryPotterContent] = await db.select().from(content).where(content.title === "Harry Potter and the Philosopher's Stone");
    const [gameOfThronesContent] = await db.select().from(content).where(content.title === "A Game of Thrones");
    const [aotContent] = await db.select().from(content).where(content.title === "Attack on Titan");

    // Fetch genre IDs
    const [action] = await db.select().from(genres).where(genres.name === "Action");
    const [adventure] = await db.select().from(genres).where(genres.name === "Adventure");
    const [romance] = await db.select().from(genres).where(genres.name === "Romance");
    const [comedy] = await db.select().from(genres).where(genres.name === "Comedy");
    const [drama] = await db.select().from(genres).where(genres.name === "Drama");
    const [fantasy] = await db.select().from(genres).where(genres.name === "Fantasy");
    const [horror] = await db.select().from(genres).where(genres.name === "Horror");
    const [mystery] = await db.select().from(genres).where(genres.name === "Mystery");
    const [scifi] = await db.select().from(genres).where(genres.name === "Sci-Fi");

    // Define genre relationships
    const contentGenresData = [
      // One Piece: Action, Adventure, Comedy, Fantasy
      { contentId: onePieceContent?.id || 1, genreId: action?.id || 1 },
      { contentId: onePieceContent?.id || 1, genreId: adventure?.id || 2 },
      { contentId: onePieceContent?.id || 1, genreId: comedy?.id || 4 },
      { contentId: onePieceContent?.id || 1, genreId: fantasy?.id || 6 },
      
      // Dragon Ball: Action, Adventure, Comedy, Fantasy
      { contentId: dragonBallContent?.id || 2, genreId: action?.id || 1 },
      { contentId: dragonBallContent?.id || 2, genreId: adventure?.id || 2 },
      { contentId: dragonBallContent?.id || 2, genreId: comedy?.id || 4 },
      { contentId: dragonBallContent?.id || 2, genreId: fantasy?.id || 6 },
      
      // Harry Potter: Adventure, Fantasy
      { contentId: harryPotterContent?.id || 3, genreId: adventure?.id || 2 },
      { contentId: harryPotterContent?.id || 3, genreId: fantasy?.id || 6 },
      { contentId: harryPotterContent?.id || 3, genreId: mystery?.id || 8 },
      
      // Game of Thrones: Drama, Fantasy
      { contentId: gameOfThronesContent?.id || 4, genreId: drama?.id || 5 },
      { contentId: gameOfThronesContent?.id || 4, genreId: fantasy?.id || 6 },
      { contentId: gameOfThronesContent?.id || 4, genreId: adventure?.id || 2 },
      
      // Attack on Titan: Action, Drama, Horror
      { contentId: aotContent?.id || 5, genreId: action?.id || 1 },
      { contentId: aotContent?.id || 5, genreId: drama?.id || 5 },
      { contentId: aotContent?.id || 5, genreId: horror?.id || 7 },
    ];

    for (const relation of contentGenresData) {
      await db.insert(contentGenres).values(relation).onConflictDoNothing();
    }
    
    console.log("Created content-genre relationships");

    // Create chapters for each content
    // One Piece Chapters
    if (onePieceContent) {
      const onePieceChapters = [
        { contentId: onePieceContent.id, number: 1, title: "Romance Dawn", isLocked: false },
        { contentId: onePieceContent.id, number: 2, title: "They Call Him Luffy, the Straw Hat", isLocked: false },
        { contentId: onePieceContent.id, number: 3, title: "Enter Zoro: Pirate Hunter", isLocked: true, unlockPrice: 50 },
      ];
      
      for (const chapter of onePieceChapters) {
        const [existingChapter] = await db.select().from(chapters)
          .where(chapters.contentId === chapter.contentId && chapters.number === chapter.number);
          
        if (!existingChapter) {
          const [newChapter] = await db.insert(chapters).values(chapter).returning();
          
          // Add chapter content
          await db.insert(chapterContent).values({
            chapterId: newChapter.id,
            content: `<div class="ql-font-merriweather ql-size-large">
              <h1>Chapter ${chapter.number}: ${chapter.title}</h1>
              <p>This is a sample content for the ${chapter.title} chapter of One Piece.</p>
              <p>The story continues as Luffy and his crew navigate the Grand Line in search of the One Piece treasure.</p>
              <p>Many adventures await them as they encounter powerful enemies and make new friends along the way.</p>
            </div>`
          });
        }
      }
    }
    
    // Harry Potter Chapters
    if (harryPotterContent) {
      const harryPotterChapters = [
        { contentId: harryPotterContent.id, number: 1, title: "The Boy Who Lived", isLocked: false },
        { contentId: harryPotterContent.id, number: 2, title: "The Vanishing Glass", isLocked: false },
        { contentId: harryPotterContent.id, number: 3, title: "The Letters from No One", isLocked: true, unlockPrice: 100 },
      ];
      
      for (const chapter of harryPotterChapters) {
        const [existingChapter] = await db.select().from(chapters)
          .where(chapters.contentId === chapter.contentId && chapters.number === chapter.number);
          
        if (!existingChapter) {
          const [newChapter] = await db.insert(chapters).values(chapter).returning();
          
          // Add chapter content
          await db.insert(chapterContent).values({
            chapterId: newChapter.id,
            content: `<div class="ql-font-merriweather ql-size-large">
              <h1>Chapter ${chapter.number}: ${chapter.title}</h1>
              <p>This is a sample content for the ${chapter.title} chapter of Harry Potter and the Philosopher's Stone.</p>
              <p>The magical world unfolds as Harry discovers his true identity and heritage.</p>
              <p>The journey to Hogwarts School of Witchcraft and Wizardry is just the beginning of his adventures.</p>
            </div>`
          });
        }
      }
    }
    
    console.log("Created chapters and chapter content");

    // Create sample advertisements
    const adData = [
      {
        title: "Premium Membership",
        imageUrl: "/uploads/ads/premium-membership.jpg",
        targetUrl: "/premium",
        position: "top",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 728,
        height: 90,
      },
      {
        title: "New Manga Release",
        imageUrl: "/uploads/ads/new-manga.jpg",
        targetUrl: "/content/1",
        position: "right",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 300,
        height: 600,
      },
      {
        title: "Novel Promotion",
        imageUrl: "/uploads/ads/novel-promo.jpg",
        targetUrl: "/content/3",
        position: "popup",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 500,
        height: 500,
        displayFrequency: 60,
      },
    ];

    for (const ad of adData) {
      const [existingAd] = await db.select().from(advertisements)
        .where(advertisements.title === ad.title);
        
      if (!existingAd) {
        await db.insert(advertisements).values(ad);
      }
    }
    
    console.log("Created advertisements");

    // Create sample external ad configs
    const externalAdData = [
      {
        name: "Google AdSense Header",
        provider: "google",
        scriptContent: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-1234567890"
          data-ad-slot="1234567890"
          data-ad-format="auto"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
        position: "top",
        adUnitId: "ca-pub-1234567890",
        slotId: "1234567890",
        publisherId: "ca-pub-1234567890",
        isActive: true,
        width: 728,
        height: 90,
        format: "auto",
        isMobileEnabled: true,
      },
      {
        name: "Facebook Sidebar Ad",
        provider: "facebook",
        scriptContent: `<div id="fb-root"></div>
        <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v10.0&appId=your-app-id"></script>
        <div class="fb-page" data-href="https://www.facebook.com/facebook" data-tabs="" data-width="" data-height="" data-small-header="false" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true">
          <blockquote cite="https://www.facebook.com/facebook" class="fb-xfbml-parse-ignore">
            <a href="https://www.facebook.com/facebook">Facebook</a>
          </blockquote>
        </div>`,
        position: "right",
        adUnitId: null,
        slotId: null,
        publisherId: "facebook-page-id",
        isActive: true,
        width: 300,
        height: 500,
        format: "vertical",
        isMobileEnabled: false,
      },
    ];

    for (const ad of externalAdData) {
      const [existingAd] = await db.select().from(externalAdConfigs)
        .where(externalAdConfigs.name === ad.name);
        
      if (!existingAd) {
        await db.insert(externalAdConfigs).values(ad);
      }
    }
    
    console.log("Created external ad configs");

    // Create payment settings
    const [existingPaymentSettings] = await db.select().from(paymentSettings);
    
    if (!existingPaymentSettings) {
      await db.insert(paymentSettings).values({
        bankConfig: {
          bankName: "Example Bank",
          accountNumber: "1234567890",
          accountName: "Website Account",
          bankBranch: "Main Branch",
        },
        vietQRConfig: {
          bankId: "EXBANK",
          accountNumber: "1234567890",
          accountName: "Website Account",
          template: "compact",
        },
        payosConfig: {
          clientId: "your-client-id",
          apiKey: "your-api-key",
          checksumKey: "your-checksum-key",
          baseUrl: "https://api-merchant.payos.vn",
        },
        priceConfig: {
          coinExchangeRate: 10, // 1 coin = 10 currency units
          standardChapterPrice: 50, // Standard price in coins for locked chapters
          premiumChapterPrice: 100, // Premium price in coins for special chapters
          discountRate: 0.1, // 10% discount for bulk purchases
        },
        emailConfig: {
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          smtpUser: "noreply@example.com",
          smtpPass: "smtp-password",
          senderEmail: "noreply@example.com",
          adminEmail: "admin@example.com",
        },
        expiryConfig: {
          bankTransfer: 15, // 15 minutes
          payos: 30, // 30 minutes
        },
      });
    }
    
    console.log("Created payment settings");

    console.log("Sample data population completed successfully!");
  } catch (error) {
    console.error("Error populating sample data:", error);
  }
}

populateSampleData().catch(console.error);