import { db } from "../server/db";
import {
  content,
  chapters,
  chapterContent,
} from "../shared/schema";

async function populateChapters() {
  console.log("Starting to populate chapter data...");

  try {
    // Fetch content IDs
    const contentItems = await db.select().from(content);
    
    // Map content titles to IDs
    const contentMap = new Map();
    contentItems.forEach(item => contentMap.set(item.title, item.id));

    // Create One Piece Chapters
    const onePieceId = contentMap.get("One Piece");
    if (onePieceId) {
      const onePieceChapters = [
        { contentId: onePieceId, number: 1, title: "Romance Dawn", isLocked: false },
        { contentId: onePieceId, number: 2, title: "They Call Him Luffy, the Straw Hat", isLocked: false },
        { contentId: onePieceId, number: 3, title: "Enter Zoro: Pirate Hunter", isLocked: true, unlockPrice: 50 },
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
      console.log("Created One Piece chapters");
    }
    
    // Create Harry Potter Chapters
    const harryPotterId = contentMap.get("Harry Potter and the Philosopher's Stone");
    if (harryPotterId) {
      const harryPotterChapters = [
        { contentId: harryPotterId, number: 1, title: "The Boy Who Lived", isLocked: false },
        { contentId: harryPotterId, number: 2, title: "The Vanishing Glass", isLocked: false },
        { contentId: harryPotterId, number: 3, title: "The Letters from No One", isLocked: true, unlockPrice: 100 },
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
      console.log("Created Harry Potter chapters");
    }

    // Create Dragon Ball Chapters
    const dragonBallId = contentMap.get("Dragon Ball");
    if (dragonBallId) {
      const dragonBallChapters = [
        { contentId: dragonBallId, number: 1, title: "Bulma and Son Goku", isLocked: false },
        { contentId: dragonBallId, number: 2, title: "No Balls", isLocked: false },
        { contentId: dragonBallId, number: 3, title: "Sea Monkeys", isLocked: true, unlockPrice: 50 },
      ];
      
      for (const chapter of dragonBallChapters) {
        const [existingChapter] = await db.select().from(chapters)
          .where(chapters.contentId === chapter.contentId && chapters.number === chapter.number);
          
        if (!existingChapter) {
          const [newChapter] = await db.insert(chapters).values(chapter).returning();
          
          // Add chapter content
          await db.insert(chapterContent).values({
            chapterId: newChapter.id,
            content: `<div class="ql-font-merriweather ql-size-large">
              <h1>Chapter ${chapter.number}: ${chapter.title}</h1>
              <p>This is a sample content for the ${chapter.title} chapter of Dragon Ball.</p>
              <p>Join Goku and his friends as they search for the seven Dragon Balls.</p>
              <p>Their adventures take them across the world and into battles with formidable opponents.</p>
            </div>`
          });
        }
      }
      console.log("Created Dragon Ball chapters");
    }
    
    console.log("Chapter data population completed successfully!");
  } catch (error) {
    console.error("Error populating chapter data:", error);
  }
}

populateChapters().catch(console.error);