import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch {
  /* no .env — DATABASE_URL must already be in the environment */
}

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/medvault";
const connectionString = (() => {
  const u = new URL(url);
  if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
  return u.toString();
})();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: connectionString,
  },
});