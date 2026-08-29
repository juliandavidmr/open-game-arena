import { mcpResponse } from "@/lib/mcp";
export const runtime="nodejs"; export async function POST(request:Request){return mcpResponse(request);} export function GET(){return new Response("Method Not Allowed",{status:405,headers:{Allow:"POST"}});}
