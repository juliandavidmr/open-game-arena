import { createMatch, directory } from "@/lib/arena";
export async function POST(){return Response.json(await createMatch(),{status:201});} export async function GET(request:Request){const u=new URL(request.url);return Response.json(await directory(u.searchParams.get("cursor")??undefined));}
