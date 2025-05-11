import { db } from "../server/db";
import {
  content,
  contentGenres,
  authors,
  translationGroups,
  genres,
} from "../shared/schema";

async function populateContent() {
  console.log("Starting to populate content data...");

  try {
    // Get IDs for reference
    const authorData = await db.select().from(authors);
    const translationGroupData = await db.select().from(translationGroups);
    const genreData = await db.select().from(genres);

    // Map names to IDs for easier reference
    const authorMap = new Map();
    const translationMap = new Map();
    const genreMap = new Map();

    authorData.forEach(author => authorMap.set(author.name, author.id));
    translationGroupData.forEach(group => translationMap.set(group.name, group.id));
    genreData.forEach(genre => genreMap.set(genre.name, genre.id));

    // Create content
    const contentData = [
      {
        title: "One Piece",
        alternativeTitle: "Wan Pīsu",
        type: "manga",
        authorId: authorMap.get("Eiichiro Oda") || 1,
        translationGroupId: translationMap.get("Manga Plus") || 1,
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
        authorId: authorMap.get("Akira Toriyama") || 2,
        translationGroupId: translationMap.get("Viz Media") || 2,
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
        authorId: authorMap.get("J.K. Rowling") || 3,
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
        authorId: authorMap.get("George R.R. Martin") || 4,
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
        authorId: authorMap.get("Hajime Isayama") || 5,
        translationGroupId: translationMap.get("Fan Translators") || 3,
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
    const contentItems = await db.select().from(content);
    
    // Map content titles to IDs
    const contentMap = new Map();
    contentItems.forEach(item => contentMap.set(item.title, item.id));

    // Define genre relationships
    const contentGenresData = [
      // One Piece: Action, Adventure, Comedy, Fantasy
      { contentId: contentMap.get("One Piece") || 1, genreId: genreMap.get("Action") || 1 },
      { contentId: contentMap.get("One Piece") || 1, genreId: genreMap.get("Adventure") || 2 },
      { contentId: contentMap.get("One Piece") || 1, genreId: genreMap.get("Comedy") || 4 },
      { contentId: contentMap.get("One Piece") || 1, genreId: genreMap.get("Fantasy") || 6 },
      
      // Dragon Ball: Action, Adventure, Comedy, Fantasy
      { contentId: contentMap.get("Dragon Ball") || 2, genreId: genreMap.get("Action") || 1 },
      { contentId: contentMap.get("Dragon Ball") || 2, genreId: genreMap.get("Adventure") || 2 },
      { contentId: contentMap.get("Dragon Ball") || 2, genreId: genreMap.get("Comedy") || 4 },
      { contentId: contentMap.get("Dragon Ball") || 2, genreId: genreMap.get("Fantasy") || 6 },
      
      // Harry Potter: Adventure, Fantasy
      { contentId: contentMap.get("Harry Potter and the Philosopher's Stone") || 3, genreId: genreMap.get("Adventure") || 2 },
      { contentId: contentMap.get("Harry Potter and the Philosopher's Stone") || 3, genreId: genreMap.get("Fantasy") || 6 },
      { contentId: contentMap.get("Harry Potter and the Philosopher's Stone") || 3, genreId: genreMap.get("Mystery") || 8 },
      
      // Game of Thrones: Drama, Fantasy
      { contentId: contentMap.get("A Game of Thrones") || 4, genreId: genreMap.get("Drama") || 5 },
      { contentId: contentMap.get("A Game of Thrones") || 4, genreId: genreMap.get("Fantasy") || 6 },
      { contentId: contentMap.get("A Game of Thrones") || 4, genreId: genreMap.get("Adventure") || 2 },
      
      // Attack on Titan: Action, Drama, Horror
      { contentId: contentMap.get("Attack on Titan") || 5, genreId: genreMap.get("Action") || 1 },
      { contentId: contentMap.get("Attack on Titan") || 5, genreId: genreMap.get("Drama") || 5 },
      { contentId: contentMap.get("Attack on Titan") || 5, genreId: genreMap.get("Horror") || 7 },
    ];

    for (const relation of contentGenresData) {
      await db.insert(contentGenres).values(relation).onConflictDoNothing();
    }
    
    console.log("Created content-genre relationships");

    console.log("Content data population completed successfully!");
  } catch (error) {
    console.error("Error populating content data:", error);
  }
}

populateContent().catch(console.error);