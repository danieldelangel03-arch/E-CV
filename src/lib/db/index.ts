import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL no está configurada.");
    this.name = "DatabaseNotConfiguredError";
  }
}

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (database) return database;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseNotConfiguredError();

  database = drizzle(neon(connectionString), { schema });
  return database;
}
