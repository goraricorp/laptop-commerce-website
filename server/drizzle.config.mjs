import process from "process"
import dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

dotenv.config({
  path: ".env.local",
  // Runtime environment variables (Vercel, Docker, CI, etc.) must take
  // precedence over local development values.
  override: false,
  debug: false,
  quiet: true,
})
export default defineConfig({
  out: './src/database/migrations-v2',
  schema: './src/database/schema.js',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
