import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

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

  // El cliente WebSocket permite transacciones reales en Neon. Los snapshots
  // de borrador/publicación deben escribirse de forma atómica.
  database = drizzle({ client: new Pool({ connectionString }), schema });
  return database;
}
