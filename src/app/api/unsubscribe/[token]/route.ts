import { NextResponse, type NextRequest } from "next/server";
import { parseUnsubscribeType } from "@/lib/unsubscribe";
import { applyUnsubscribe } from "@/server/unsubscribe";

/** RFC 8058 one-click unsubscribe: mail clients POST here straight from the inbox. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/unsubscribe/[token]">) {
  const { token } = await params;
  const type = parseUnsubscribeType(request.nextUrl.searchParams.get("type"));
  const ok = await applyUnsubscribe(token, type);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

/** Someone opened the header link in a browser: send them to the page that asks first. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/unsubscribe/[token]">) {
  const { token } = await params;
  const type = parseUnsubscribeType(request.nextUrl.searchParams.get("type"));
  return NextResponse.redirect(new URL(`/unsubscribe/${encodeURIComponent(token)}?type=${type}`, request.url));
}
