import { mcpResponse } from "@/lib/mcp";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return mcpResponse(request, (await params).token);
}
export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
