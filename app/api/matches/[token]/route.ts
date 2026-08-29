import { deleteMatch, getObserver } from "@/lib/arena";
function unavailable() {
  return Response.json(
    { error: "unavailable" },
    { status: 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } },
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    return Response.json(await getObserver((await params).token), {
      headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return unavailable();
  }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const result = await deleteMatch((await params).token);
    return result.deleted
      ? new Response(null, { status: 204 })
      : Response.json(result, { status: 409 });
  } catch {
    return unavailable();
  }
}
