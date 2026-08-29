import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function sql() {
  if (!client) {
    const url = process.env.POSTGRES_URL;
    if (!url) throw new Error("POSTGRES_URL is required");
    client = postgres(url, { prepare: false, max: 5 });
  }
  return client;
}

export function db() {
  if (!database) database = drizzle(sql(), { schema });
  return database;
}
