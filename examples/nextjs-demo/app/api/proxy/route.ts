import { NextRequest, NextResponse } from "next/server";

/**
 * Simple pass-through proxy for external resources that lack CORS headers.
 * Usage: GET /api/proxy?url=https://example.com/file.vtt
 *
 * Only allow-listed content types are forwarded to prevent abuse.
 */
const ALLOWED_CONTENT_TYPES = [
  "text/vtt",
  "text/plain",
  "application/octet-stream",
  "application/x-subrip",
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Only allow https
  if (targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Only https URLs are allowed" }, { status: 400 });
  }

  const upstream = await fetch(targetUrl.toString(), { cache: "force-cache" });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "text/plain";
  const isAllowed = ALLOWED_CONTENT_TYPES.some((t) => contentType.includes(t));

  const body = await upstream.text();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": isAllowed ? contentType : "text/plain",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
