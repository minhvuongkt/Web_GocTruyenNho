
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  driver: 'mysql2',
  dbCredentials: {
    uri: process.env.DATABASE_URL,
  },
});
