import { NextRequest, NextResponse } from "next/server";

const SERVICE_JNR_URL =
  process.env.SERVICE_JNR_URL || process.env.NEXT_PUBLIC_SERVICE_JNR_URL || "http://localhost:3003";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const endpoint = path.join("/");
  const cleanBase = SERVICE_JNR_URL.replace(/\/+$/, "");
  const targetUrl = new URL(`${cleanBase}/api/jnr/${endpoint}`);

  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (["host", "connection", "content-length", "transfer-encoding", "origin", "referer", "cookie"].includes(lowerKey)) {
      return;
    }
    headers.set(key, value);
  });
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);

  try {
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error duplex for streaming body
      duplex: hasBody ? "half" : undefined,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete("server");
    responseHeaders.delete("x-powered-by");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Service unavailable", details: message, target: targetUrl.toString() }, { status: 502 });
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const HEAD = proxyHandler;
