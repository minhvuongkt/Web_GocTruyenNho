import { db } from "../server/db";
import {
  users,
  authors,
  translationGroups,
  genres,
} from "../shared/schema";
import { hashPassword } from "../server/auth";
import { execSync } from "child_process";

async function populateBasicData() {
  console.log("Starting to populate basic data...");

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

    console.log("Basic data population completed successfully!");
  } catch (error) {
    console.error("Error populating basic data:", error);
  }
}

async function runPopulationSequence() {
  try {
    // Step 1: Populate basic data (users, genres, authors, translation groups)
    await populateBasicData();
    
    // Step 2: Populate content data
    console.log("\nRunning content population script...");
    execSync("npx tsx scripts/populate-content.ts", { stdio: 'inherit' });
    
    // Step 3: Populate chapters data
    console.log("\nRunning chapters population script...");
    execSync("npx tsx scripts/populate-chapters.ts", { stdio: 'inherit' });
    
    // Step 4: Populate ads and payment data
    console.log("\nRunning ads and payments population script...");
    execSync("npx tsx scripts/populate-ads-payments.ts", { stdio: 'inherit' });
    
    console.log("\nAll data population completed successfully!");
  } catch (error) {
    console.error("Error during population sequence:", error);
  }
}

runPopulationSequence().catch(console.error);