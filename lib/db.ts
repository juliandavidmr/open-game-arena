import postgres from "postgres";
let client: ReturnType<typeof postgres> | undefined;
export function sql() {
  if (!client) {
    const url = process.env.POSTGRES_URL;
    if (!url) throw new Error("POSTGRES_URL is required");
    client = postgres(url, { prepare: false, max: 5 });
  }
  return client;
}
