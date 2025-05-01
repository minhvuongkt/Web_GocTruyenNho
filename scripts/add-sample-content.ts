import { db } from "../server/db";
import {
  content,
  contentGenres,
  chapters,
  chapterContent,
  type InsertContent,
  type InsertChapter,
  type InsertChapterContent,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function addSampleContent() {
  console.log("🌱 Starting to add sample content...");

  try {
    // Add sample manga content
    const onePieceManga: InsertContent = {
      title: "One Piece",
      alternativeTitle: "ワンピース",
      type: "manga",
      authorId: 4, // Eiichiro Oda
      translationGroupId: 1, // ScanTrad
      releaseYear: "1997",
      status: "ongoing",
      description: "One Piece is a Japanese manga series written and illustrated by Eiichiro Oda. It has been serialized in Shueisha's Weekly Shōnen Jump magazine since July 1997, with its individual chapters compiled into 98 tankōbon volumes as of February 2021. The story follows the adventures of Monkey D. Luffy, a boy whose body gained the properties of rubber after unintentionally eating a Devil Fruit.",
      coverImage: "https://m.media-amazon.com/images/I/51P1QxCQWkL._SY445_SX342_.jpg",
    };

    // Add sample novel content
    const harryPotterNovel: InsertContent = {
      title: "Harry Potter and the Philosopher's Stone",
      alternativeTitle: "Harry Potter and the Sorcerer's Stone",
      type: "novel",
      authorId: 2, // J.K. Rowling
      translationGroupId: 2, // NovelGroup
      releaseYear: "1997",
      status: "completed",
      description: "Harry Potter and the Philosopher's Stone is a fantasy novel written by British author J. K. Rowling. The first novel in the Harry Potter series and Rowling's debut novel, it follows Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday, when he receives a letter of acceptance to Hogwarts School of Witchcraft and Wizardry.",
      coverImage: "https://m.media-amazon.com/images/I/5165He67NEL._SY445_SX342_.jpg",
    };

    // Check if content already exists
    const existingOnePiece = await db
      .select()
      .from(content)
      .where(eq(content.title, "One Piece"));
    
    const existingHarryPotter = await db
      .select()
      .from(content)
      .where(eq(content.title, "Harry Potter and the Philosopher's Stone"));

    // Add One Piece manga if it doesn't exist yet
    let onePieceId: number | null = null;
    if (existingOnePiece.length === 0) {
      const [newContent] = await db.insert(content).values(onePieceManga).returning();
      onePieceId = newContent.id;
      console.log(`✅ Content "${onePieceManga.title}" created with ID ${onePieceId}`);
      
      // Add genre associations for One Piece
      const onePieceGenres = [1, 3, 6]; // Action, Fantasy, Comedy
      for (const genreId of onePieceGenres) {
        await db.insert(contentGenres).values({
          contentId: onePieceId,
          genreId,
        });
      }
      console.log(`✅ Added genres for "${onePieceManga.title}"`);
    } else {
      onePieceId = existingOnePiece[0].id;
      console.log(`📝 Content "${onePieceManga.title}" already exists, skipping creation`);
    }

    // Add Harry Potter novel if it doesn't exist yet
    let harryPotterId: number | null = null;
    if (existingHarryPotter.length === 0) {
      const [newContent] = await db.insert(content).values(harryPotterNovel).returning();
      harryPotterId = newContent.id;
      console.log(`✅ Content "${harryPotterNovel.title}" created with ID ${harryPotterId}`);
      
      // Add genre associations for Harry Potter
      const harryPotterGenres = [3, 7, 8]; // Fantasy, Drama, Mystery
      for (const genreId of harryPotterGenres) {
        await db.insert(contentGenres).values({
          contentId: harryPotterId,
          genreId,
        });
      }
      console.log(`✅ Added genres for "${harryPotterNovel.title}"`);
    } else {
      harryPotterId = existingHarryPotter[0].id;
      console.log(`📝 Content "${harryPotterNovel.title}" already exists, skipping creation`);
    }

    // Add chapters for One Piece if content exists
    if (onePieceId) {
      // Check if chapters already exist
      const existingChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.contentId, onePieceId));
      
      if (existingChapters.length === 0) {
        // Add some chapters
        const onePieceChapters: InsertChapter[] = [
          {
            contentId: onePieceId,
            number: 1,
            title: "Romance Dawn",
            isLocked: false,
            releaseDate: new Date("1997-07-22"),
          },
          {
            contentId: onePieceId,
            number: 2,
            title: "They Call Him Luffy the Straw Hat",
            isLocked: false,
            releaseDate: new Date("1997-07-29"),
          },
          {
            contentId: onePieceId,
            number: 3,
            title: "Enter Zoro: Pirate Hunter",
            isLocked: true,
            unlockPrice: 5,
            releaseDate: new Date("1997-08-05"),
          },
        ];
        
        for (const chapterData of onePieceChapters) {
          const [newChapter] = await db.insert(chapters).values(chapterData).returning();
          console.log(`✅ Chapter ${chapterData.number}: "${chapterData.title}" created for One Piece`);
          
          // Add sample chapter content (manga pages)
          const chapterPages: InsertChapterContent[] = [
            {
              chapterId: newChapter.id,
              pageOrder: 1,
              imageUrl: `https://example.com/manga/onepiece/chapter${chapterData.number}/page1.jpg`,
            },
            {
              chapterId: newChapter.id,
              pageOrder: 2,
              imageUrl: `https://example.com/manga/onepiece/chapter${chapterData.number}/page2.jpg`,
            },
            {
              chapterId: newChapter.id,
              pageOrder: 3,
              imageUrl: `https://example.com/manga/onepiece/chapter${chapterData.number}/page3.jpg`,
            },
          ];
          
          for (const page of chapterPages) {
            await db.insert(chapterContent).values(page);
          }
          
          console.log(`✅ Added ${chapterPages.length} pages for One Piece Chapter ${chapterData.number}`);
        }
      } else {
        console.log(`📝 Chapters for One Piece already exist, skipping creation`);
      }
    }

    // Add chapters for Harry Potter if content exists
    if (harryPotterId) {
      // Check if chapters already exist
      const existingChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.contentId, harryPotterId));
      
      if (existingChapters.length === 0) {
        // Add some chapters
        const harryPotterChapters: InsertChapter[] = [
          {
            contentId: harryPotterId,
            number: 1,
            title: "The Boy Who Lived",
            isLocked: false,
            releaseDate: new Date("1997-06-26"),
          },
          {
            contentId: harryPotterId,
            number: 2,
            title: "The Vanishing Glass",
            isLocked: false,
            releaseDate: new Date("1997-06-26"),
          },
          {
            contentId: harryPotterId,
            number: 3,
            title: "The Letters from No One",
            isLocked: true,
            unlockPrice: 5,
            releaseDate: new Date("1997-06-26"),
          },
        ];
        
        for (const chapterData of harryPotterChapters) {
          const [newChapter] = await db.insert(chapters).values(chapterData).returning();
          console.log(`✅ Chapter ${chapterData.number}: "${chapterData.title}" created for Harry Potter`);
          
          // Add sample chapter content (novel text)
          const chapterTextContent: InsertChapterContent = {
            chapterId: newChapter.id,
            content: `This is sample text content for Chapter ${chapterData.number}: ${chapterData.title} of Harry Potter and the Philosopher's Stone. In a real implementation, this would contain the full text of the chapter.`,
          };
          
          await db.insert(chapterContent).values(chapterTextContent);
          console.log(`✅ Added text content for Harry Potter Chapter ${chapterData.number}`);
        }
      } else {
        console.log(`📝 Chapters for Harry Potter already exist, skipping creation`);
      }
    }

    console.log("✅ Sample content addition completed successfully!");
  } catch (error) {
    console.error("❌ Error adding sample content:", error);
  }
}

// Run the function
addSampleContent().catch(console.error);